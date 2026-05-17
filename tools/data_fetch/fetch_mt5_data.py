"""
APEX TRADE AI - Institutional MT5 Data Fetcher
==============================================
Fetches extreme historical depth directly from local MT5 Terminal
to ensure 1H and 4H models have 5-10+ years of data for training.
"""

import MetaTrader5 as mt5
import pandas as pd
import os
import sys

sys.path.append(os.getcwd())
from src.data.mt5_interface import MT5Interface

ASSETS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY"]

TIMEFRAMES = {
    "1h": {"const": mt5.TIMEFRAME_H1, "bars": 50000},  # ~8.2 years
    "4h": {"const": mt5.TIMEFRAME_H4, "bars": 15000},  # ~10 years
    "1d": {"const": mt5.TIMEFRAME_D1, "bars": 5000}    # ~19 years
}

def fetch_all_mt5_data():
    print("=" * 60)
    print("APEX TRADE AI - MT5 Institutional History Sync")
    print("=" * 60)
    
    mt = MT5Interface()
    if not mt.connect():
        print("CRITICAL: Could not connect to MT5 Terminal. Please open MT5 and try again.")
        return
        
    os.makedirs("data", exist_ok=True)
    
    for asset in ASSETS:
        print(f"\n>>> Syncing {asset} from MT5...")
        
        # Verify symbol exists
        tick = mt5.symbol_info_tick(asset)
        actual_symbol = asset
        
        if tick is None:
            # Fallback for suffixes (e.g. EURUSD.a)
            all_symbols = mt5.symbols_get()
            if all_symbols is not None:
                candidates = [s.name for s in all_symbols if asset in s.name]
                if candidates:
                    actual_symbol = candidates[0]
                    print(f"  Mapped {asset} to MT5 symbol: {actual_symbol}")
                else:
                    print(f"  [ERROR] {asset} not found in MT5 market watch.")
                    continue
            else:
                print(f"  [ERROR] MT5 symbols_get() returned None. Terminal connection issue?")
                continue
                
        for tf_name, tf_config in TIMEFRAMES.items():
            print(f"  Fetching {tf_name} ({tf_config['bars']} bars)...")
            df = mt.get_historical_data(
                symbol=actual_symbol, 
                timeframe=tf_config["const"], 
                num_candles=tf_config["bars"]
            )
            
            if df is not None and not df.empty:
                # MT5 returns time in UTC. We keep it as is.
                out_path = f"data/{asset}_{tf_name}.csv"
                
                # For 1d, we also save a _history.csv to match the base expectation
                if tf_name == "1d":
                    hist_path = f"data/{asset}_history.csv"
                    df.to_csv(hist_path, index=False)
                    
                df.to_csv(out_path, index=False)
                
                years = len(df) / (252 * (24 if tf_name == "1h" else (6 if tf_name == "4h" else 1)))
                print(f"  [SUCCESS] {tf_name}: {len(df)} rows saved (~{years:.1f} years)")
            else:
                print(f"  [FAIL] {tf_name}: Could not retrieve data.")

    mt.shutdown()
    print("\n" + "=" * 60)
    print("MT5 SYNC COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    fetch_all_mt5_data()
