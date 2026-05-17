import sys
import os
from pathlib import Path

# Capture Original Stdout (for clean JSON output)
ORIGINAL_STDOUT = sys.stdout

# If JSON requested, redirect all stdout to stderr immediately
# This catches import-time logs from Keras/TensorFlow
if "--json" in sys.argv:
    sys.stdout = sys.stderr

# Suppress TensorFlow Logs completely
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3' 
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import pandas as pd
import argparse
from datetime import datetime
from tabulate import tabulate
import json
import warnings
import yaml
import MetaTrader5 as mt5

# Add root
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'tools'))

from src.utils.logger import get_logger
from src.utils.time_utils import normalize_ts
from src.data.csm_provider import CSMProvider
from src.data.news_manager import NewsManager
from src.data.geopolitical_news import GeopoliticalNewsManager
from tools.production.predict import Predictor
from src.analysis.consensus import ConsensusEngine

warnings.filterwarnings("ignore")
logger = get_logger()

# CONFIG
BANKROLL = 1000.0
MAX_RISK = 0.02
RISK_REWARD = 1.2

def calculate_kelly(prob_win, risk_reward):
    if prob_win < 0.5: return 0.0
    q = 1 - prob_win
    f = prob_win - (q / risk_reward)
    return max(f, 0.0)


def get_multi_asset_analysis(symbols: list = None, skip_mt5: bool = False):
    """
    Core analysis function that returns structured data for API or Dashboard.
    """
    if symbols is None:
        symbols = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY"]
        
    output = {
        "generated_at": datetime.now().isoformat(),
        "market_context": {},
        "assets": {},
        "ranking": []
    }
    
    # 1. MARKET CONTEXT (News & CSM)
    nm = NewsManager()
    gnm = GeopoliticalNewsManager()
    
    # Standard Economic News for all major and relevant global currencies
    # We fetch for the whole week to ensure the dashboard has 'High Impact' upcoming events
    all_econ_news = []
    major_currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF', 'CNY']
    for cur in major_currencies:
        # Fetching for the week via the DataProvider integrated in NewsManager
        events = nm.get_asset_events(f"{cur}XXX", limit=15)
        all_econ_news.extend(events)
        
    # Sort and Deduplicate
    unique_econ = []
    seen = set()
    for e in all_econ_news:
        key = f"{e['currency']}_{e['event']}_{e['time']}"
        if key not in seen:
            unique_econ.append(e)
            seen.add(key)
            
    # Priority sort
    unique_econ.sort(key=lambda x: (x['impact'] == 'High', x['impact'] == 'Medium'), reverse=True)
    output['market_context']['economic_news'] = unique_econ
    
    # GEOPOLITICAL NEWS (Requested: Top 10)
    output['market_context']['news'] = gnm.get_top_geopolitical_news(limit=10)
    # CSM
    cp = CSMProvider()
    csm_data = cp.get_latest_csm()
    output['market_context']['csm'] = csm_data
    
    # 2. HIGH-RELIABILITY CONFLUENCE STACK (3-TF Mode)
    timeframes = ["Daily", "4 Hour", "1 Hour"]
    tf_map = { 
        "Daily": "1d", 
        "4 Hour": "4h", 
        "1 Hour": "1h"
    }
    
    global_opportunities = {}
    
    # MT5 Interface (Optional)
    mt_connected = False
    mt = None
    if not skip_mt5:
        from src.data.mt5_interface import MT5Interface
        mt = MT5Interface()
        mt_connected = mt.connect()
        if mt_connected:
            logger.info("Connected to MT5. Priority given to live data feeds.")
        else:
            logger.warning("MT5 not connected. Falling back to YFinance/CSV data.")
    else:
        logger.info("Skipping MT5 initialization as requested. Using YFinance for live data.")
    


    for symbol in symbols:
        asset_result = {
            "symbol": symbol,
            "predictions": {},
            "news": [],
            "smc": None
        }
        
        # News for Asset
        try:
            events = nm.get_asset_events(symbol)
            asset_result['news'] = events
        except Exception as e:
            logger.error(f"News fetch failed for {symbol}: {e}")
            asset_result['news'] = []
        
        results_map = {}
        
        # Analyze Timeframes
        for tf_name in timeframes:
            tf_code = tf_map[tf_name]
            # MT5 Timeframe Mapping
            mt_tf_map = {"1d": mt5.TIMEFRAME_D1, "4h": mt5.TIMEFRAME_H4, "1h": mt5.TIMEFRAME_H1}
            
            df = None
            # 1. Try MT5 Live
            if mt_connected:
                try:
                    df = mt.get_historical_data(symbol, timeframe=mt_tf_map[tf_code], num_candles=1000)
                    if df is not None:
                        logger.info(f"  [{symbol}] Fetched {len(df)} candles from MT5 ({tf_name})")
                except Exception as e:
                    logger.debug(f"  [{symbol}] MT5 fetch failed for {tf_name}: {e}")
            
            # 2. Fallback to YFinance
            if df is None:
                try:
                    import yfinance as yf
                    yf_symbol_map = {
                        "XAUUSD": "GC=F", "EURUSD": "EURUSD=X", 
                        "GBPUSD": "GBPUSD=X", "USDJPY": "JPY=X"
                    }
                    yf_tf_map = {"1d": "1d", "4h": "1h", "1h": "1h"} # yf doesn't easily do 4h intraday reliably for long periods, but we can approximate or use 1h. For safety, just fetch 1h.
                    
                    yf_sym = yf_symbol_map.get(symbol, symbol)
                    yf_tf = yf_tf_map[tf_code]
                    
                    # Fetch data
                    ticker = yf.Ticker(yf_sym)
                    yf_df = ticker.history(period="1mo", interval=yf_tf)
                    
                    if not yf_df.empty:
                        # Convert to standard format
                        df = yf_df.reset_index()
                        # YFinance returns Datetime, Open, High, Low, Close, Volume
                        df = df.rename(columns={'Datetime': 'time', 'Date': 'time', 'Open': 'open', 'High': 'high', 'Low': 'low', 'Close': 'close', 'Volume': 'tick_volume'})
                        df['time'] = pd.to_datetime(df['time']).dt.tz_localize(None) # Remove tz
                        df = df[['time', 'open', 'high', 'low', 'close', 'tick_volume']]
                        
                        # If 4H, resample
                        if tf_code == "4h":
                            df.set_index('time', inplace=True)
                            df = df.resample('4h').agg({'open': 'first', 'high': 'max', 'low': 'min', 'close': 'last', 'tick_volume': 'sum'}).dropna().reset_index()
                            
                        logger.info(f"  [{symbol}] Fetched {len(df)} candles from YFinance ({tf_name})")
                except Exception as e:
                    logger.debug(f"  [{symbol}] YFinance fetch failed for {tf_name}: {e}")

            # 3. Fallback to CSV
            if df is None:
                path = f"data/{symbol}_{tf_code}.csv"
                if tf_code == '1d' and not os.path.exists(path):
                    if os.path.exists(f"data/{symbol}_history.csv"): path = f"data/{symbol}_history.csv"
                
                if os.path.exists(path):
                    df = pd.read_csv(path)
                    logger.info(f"  [{symbol}] Loaded local CSV data for {tf_name}")
            
            if df is None: continue
                
            try:
                # Prediction Logic
                run_suffix = f"_{symbol}_{tf_code}"
                predictor = Predictor(timeframe=tf_name, run_id=run_suffix, symbol=symbol) 
                res = predictor.predict(df)
                
                if "error" in res:
                    logger.error(f"Prediction error for {symbol} {tf_name}: {res['error']}")
                    continue
                
                results_map[tf_name] = res
                
                # Add to output
                asset_result['predictions'][tf_name] = {
                    "signal": res['prediction'],
                    "confidence": res['confidence'],
                    "risk": calculate_kelly(res['confidence'], RISK_REWARD) * 0.5,
                    "levels": res['trade_levels'],
                    "technicals": res.get('technicals', {})
                }
                
            except Exception as e:
                logger.error(f"  [{symbol}] Prediction logic failed for {tf_name}: {e}")
                
        if mt_connected:
            mt.shutdown()
                
        # Ensure symbol is at least in output assets even if no signal
        if results_map or True: # Always include for dashboard stability
            if not results_map:
                # Provide a Neutral/Wait state if no signals were generated
                asset_result['decision'] = {"decision": "WAIT", "reason": "Awaiting High-Confluence Setup", "net_confidence": 0}
                asset_result['predictions']['Daily'] = {
                    "signal": "WAIT", "confidence": 0, "risk": 0, 
                    "levels": {"tp": 0, "sl": 0}, "technicals": {}
                }
            else:
                # Formulate Consensus for this asset
                consensus = ConsensusEngine()
                signals = {k: v['prediction'].upper() for k, v in results_map.items()}
                confs = {k: v['confidence'] for k, v in results_map.items()}
                decision = consensus.resolve(signals, confs)
                asset_result['decision'] = decision
            
            output['assets'][symbol] = asset_result
            
            # Store for Global Ranking
            dec = asset_result.get('decision', {})
            # Check 4h or 1h for main signal
            main_res = results_map.get('4 Hour') or results_map.get('1 Hour') or results_map.get('Daily')
            if main_res:
                main_res_copy = main_res.copy()
                main_res_copy['prediction'] = dec.get('decision', 'WAIT')
                main_res_copy['confidence'] = dec.get('net_confidence', 0)
                global_opportunities[symbol] = main_res_copy
            else:
                # Add as Neutral entry if no timeframe data but we want it in runway
                global_opportunities[symbol] = {
                    "symbol": symbol,
                    "prediction": "WAIT",
                    "confidence": 0,
                    "trade_levels": {"tp": 0, "sl": 0}
                }

    # 3. GLOBAL RANKING
    from src.analysis.multi_asset_consensus import MultiAssetConsensus
    mac = MultiAssetConsensus()
    
    if not global_opportunities:
        # Fallback: Populate with all analyzed assets sorted by relative confidence
        for symbol, asset_data in output['assets'].items():
            dec = asset_data['decision']
            # Find the best prediction record to use for metadata
            main_res = asset_data['predictions'].get('4 Hour') or \
                       asset_data['predictions'].get('1 Hour') or \
                       asset_data['predictions'].get('Daily')
            
            if main_res:
                main_res_copy = main_res.copy()
                main_res_copy['symbol'] = symbol
                main_res_copy['bias'] = dec['decision'] if dec['decision'] != 'WAIT' else 'NEUTRAL'
                main_res_copy['confidence'] = dec['net_confidence']
                global_opportunities[symbol] = main_res_copy

    if global_opportunities:
        ranked = mac.rank_assets(global_opportunities)
        output['ranking'] = ranked
        
    return output

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assets", nargs='+', default=["XAUUSD"], help="List of assets or 'all'")
    parser.add_argument("--json", action="store_true", help="Output JSON only")
    parser.add_argument('--headless', action='store_true', help='Run without interactive prompts, exit with code')
    parser.add_argument('--no-mt5', action='store_true', help='Skip MT5 initialization to avoid window popup')
    parser.add_argument('--output', type=str, default='data/prediction_cache.json', help='Output path for prediction results')
    args = parser.parse_args()

    symbols = args.assets
    if "all" in symbols:
        try:
            with open("src/config/assets.yaml", "r") as f:
                d = yaml.safe_load(f)
                symbols = list(d.keys())
        except:
            symbols = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY"]
            
    # Run Analysis
    data = get_multi_asset_analysis(symbols, skip_mt5=args.no_mt5)
    
    if args.json or args.headless:
        try:
            # 5. SAVE TO CACHE/OUTPUT if headless
            if args.headless:
                out_path = Path(args.output)
                out_path.parent.mkdir(parents=True, exist_ok=True)
                with open(out_path, 'w') as f:
                    json.dump(data, f, default=str)
                # Print count for pipeline parser (executor.py uses this)
                print(f"predictions: {len(data['assets'])}")
            
            # Write ONLY valid JSON to the original stdout pipe
            ORIGINAL_STDOUT.write(json.dumps(data, default=str))
            ORIGINAL_STDOUT.flush()
        except Exception as e:
            with open("logs/debug_crash.txt", "w") as f:
                f.write(f"Error: {e}\n")
            sys.exit(1)
            
        sys.stdout = ORIGINAL_STDOUT # Loosely restore
        os._exit(0)

    # CLI Display Logic (Updated for 3 timeframes)
    print("="*80)
    print("!!!  REGULATORY DISCLAIMER & RISK WARNING  !!!")
    print("="*80)
    print(f"APEX TRADE AI - MULTI-ASSET INTELLIGENCE ({datetime.now().strftime('%Y-%m-%d %H:%M')})")
    print("="*80)
    
    # CSM
    csm_table = [[k, v] for k, v in sorted(data['market_context']['csm'].items(), key=lambda x: x[1], reverse=True)]
    print("\n   [CSM] Currency Strength Meter (0-10):")
    print(tabulate(csm_table, headers=["Currency", "Strength"], tablefmt="simple"))
    
    # Assets
    for symbol, asset_data in data['assets'].items():
        print(f"\n   >> Analyzing {symbol}...")
        
        # Summary Table
        summary_data = []
        for tf, pred in asset_data['predictions'].items():
             summary_data.append({
                "TF": tf,
                "Signal": pred['signal'],
                "Conf": f"{pred['confidence']:.1%}",
                "TP": pred['levels']['tp'],
                "SL": pred['levels']['sl']
             })
        if summary_data:
            print(tabulate(summary_data, headers="keys", tablefmt="simple"))
            
            dec = asset_data.get('decision', {})
            print(f"   >> ACTION: {dec.get('decision', 'N/A')} | {dec.get('reason', '')}")
            
            # News
            print(f"\n      [NEWS] High-Impact News ({symbol}):")
            if asset_data['news']:
                print(tabulate(pd.DataFrame(asset_data['news']), headers="keys", tablefmt="simple"))
            else:
                print("         No upcoming high-impact events found.")

            # SMC & Tech
            if 'smc' in asset_data and asset_data['smc']:
                smc = asset_data['smc']
                micro = asset_data.get('microstructure', {})
                print(f"\n      [SMC] Deep Dive (Lowest TF):")
                
                # Technical Profile logic reused
                techs = list(asset_data['predictions'].values())[-1].get('technicals', {})
                if techs:
                     print(f"\n      [TECH] Technical Profile:")
                     print(f"         RSI: {techs.get('rsi', 0):.1f}")
                     print(f"         ADX: {techs.get('adx', 0):.1f}")
                
                # Order Blocks
                obs = []
                for ob in (smc.get('bull_obs_found') or []):
                    obs.append(["Bullish OB", ob['top'], ob['bottom'], "Demand"])
                for ob in (smc.get('bear_obs_found') or []):
                    obs.append(["Bearish OB", ob['top'], ob['bottom'], "Supply"])
                if obs:
                    print(tabulate(obs, headers=["Type", "Top", "Bottom", "Zone"], tablefmt="simple"))
                else:
                    print("         No major Order Blocks nearby.")
                    
    # Global Rank
    print("\n[3/4] Multi-Asset Ranking")
    if data['ranking']:
         # Use MultiAssetConsensus to generate report string from list
         from src.analysis.multi_asset_consensus import MultiAssetConsensus
         mac = MultiAssetConsensus()
         print(mac.generate_report(data['ranking']))
    else:
         print("   No high-confluence setups identified.")

    print("\n[4/4] Execution Complete.")


if __name__ == "__main__":
    main()
