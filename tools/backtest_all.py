"""
APEX TRADE AI - Comprehensive Multi-Asset Backtest
==================================================
Runs backtests for all configured assets and timeframes.
Generates a consolidated report and organizes plots.
"""

import os
import sys
import pandas as pd
import shutil
from datetime import datetime

# Add root to path
sys.path.append(os.getcwd())

from tools.backtest import Backtester

def main():
    # Configuration (Full Suite)
    assets = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY"]
    timeframes = ["1 Hour", "4 Hour"]
    
    # Map timeframes to standard suffix codes
    tf_map = {
        "Daily": "1d",
        "4 Hour": "4h",
        "1 Hour": "1h",
        "15 Min": "15m"
    }
    
    # Setup Output Directory
    output_dir = "backtests"
    os.makedirs(output_dir, exist_ok=True)
    images_dir = "images" 
    
    final_report = []
    
    print(f"Starting Multi-Asset Backtest Suite at {datetime.now()}")
    print("=" * 60)
    
    # Load Thresholds from assets.yaml
    from src.utils.config_loader import config as global_config
    assets_conf = global_config.get('assets', {})

    for asset in assets:
        print(f"\n>>> PROCESSING ASSET: {asset}")
        
        # Get asset config
        asset_cfg = assets_conf.get(asset, {})
        conf_threshs_map = asset_cfg.get('confidence_thresholds', {})
        
        for tf in timeframes:
            tf_code = tf_map[tf]
            
            # Confidence Threshold for this asset/timeframe
            # Default to 0.60 if not found
            thresh = conf_threshs_map.get(tf_code, 0.60)
            
            suffix = f"_{asset}_{tf_code}"
            
            data_path = f"data/X{suffix}.npy"
            if not os.path.exists(data_path):
                print(f"  [Skipping] Data not found for {asset} {tf} ({data_path})")
                continue
                
            print(f"  Running Backtest for {asset} - {tf} (Thresh: {thresh})...")
            
            try:
                # Realistic Cost Map
                cost_map = {
                    "XAUUSD": {"comm": 0.0002, "slip": 0.0002},
                    "EURUSD": {"comm": 0.00007, "slip": 0.0001},
                    "GBPUSD": {"comm": 0.00007, "slip": 0.0001},
                    "USDJPY": {"comm": 0.00007, "slip": 0.0001}
                }
                costs = cost_map.get(asset, {"comm": 0.001, "slip": 0.0005})
                
                bt = Backtester(initial_capital=10000, commission=costs['comm'], slippage=costs['slip'])
                
                # Run single threshold backtest (closest to the defined one)
                results = bt.run_comparative_analysis(thresholds=[thresh], full_data=True, suffix=suffix)
                
                # Record result
                best_res = results[0]
                
                # Record for Report
                final_report.append({
                    "Asset": asset,
                    "Timeframe": tf,
                    "Best Threshold": best_res['Threshold'],
                    "Win Rate": best_res['WinRate'],
                    "ROI (Test)": best_res['Return'],
                    "Trades": best_res['Trades'],
                    "Equity": best_res['Final Equity']
                })
                
                # Move Plot
                src_plot = f"{images_dir}/equity_comparison{suffix}.png"
                dst_plot = f"{output_dir}/equity_{asset}_{tf_code}.png"
                if os.path.exists(src_plot):
                    shutil.copy(src_plot, dst_plot)
                    
            except Exception as e:
                print(f"  [Error] Failed backtest for {asset} {tf}: {e}")
                
    # Generate Markdown Report
    print("\n" + "=" * 60)
    print("GENERATING FINAL REPORT")
    print("=" * 60)
    
    df_res = pd.DataFrame(final_report)
    if not df_res.empty:
        # Sort by ROI
        df_res = df_res.sort_values(by="ROI (Test)", ascending=False)
        
        md = f"# APEX Trade AI - Backtest Report ({datetime.now().strftime('%Y-%m-%d')})\n\n"
        md += "## Performance Summary (Out-of-Sample)\n"
        md += "| Asset | Timeframe | Best Threshold | Win Rate | ROI (Test) | Trades | Final Equity |\n"
        md += "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n"
        
        for _, row in df_res.iterrows():
            md += f"| **{row['Asset']}** | {row['Timeframe']} | {row['Best Threshold']:.2f} | {row['Win Rate']:.1%} | **{row['ROI (Test)']:.1%}** | {row['Trades']} | ${row['Equity']:,.2f} |\n"
            
        md += "\n## Equity Curves\n"
        for _, row in df_res.iterrows():
            tf_code = tf_map[row['Timeframe']]
            img_name = f"equity_{row['Asset']}_{tf_code}.png"
            md += f"### {row['Asset']} - {row['Timeframe']}\n"
            md += f"![Equity Curve]({img_name})\n\n"
            
        report_path = f"{output_dir}/report.md"
        with open(report_path, "w") as f:
            f.write(md)
            
        print(f"Report saved to: {report_path}")
        print(df_res.to_string(index=False))
        
    else:
        print("No results generated.")

if __name__ == "__main__":
    main()
