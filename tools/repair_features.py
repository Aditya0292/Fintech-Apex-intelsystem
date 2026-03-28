import sys
import os
import argparse
import pandas as pd
import numpy as np

# Add root
sys.path.append(os.getcwd())

from src.features.feature_pipeline import run_pipeline

def repair_all(assets_arg="all"):
    assets = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY"]
    if assets_arg != "all":
        assets = [a.strip() for a in assets_arg.split(',')]
        
    timeframes = [
        ("Daily", "1d"),
        ("4 Hour", "4h"),
        ("1 Hour", "1h"),
        ("15 Min", "15m")
    ]
    
    print(f"Starting Bulk Feature Repair for: {assets}")
    
    for asset in assets:
        print(f"\n>>> REPAIRING ASSET: {asset}")
        
        # 1. Base History (Daily/Full)
        # Some assets have _history.csv, some have _1d.csv as base
        # Logic: Try _history.csv first, then _1d.csv
        base_path = f"data/{asset}_history.csv"
        if not os.path.exists(base_path):
            base_path = f"data/{asset}_1d.csv"
            
        if os.path.exists(base_path):
            # Run for Daily
            # Suffix should be _{asset}_1d
            suffix = f"_{asset}_1d"
            print(f"  [Daily] Processing {base_path} -> Suffix: {suffix}")
            run_pipeline(data_path=base_path, suffix=suffix, symbol=asset)
        else:
            print(f"  [Warning] No daily data found for {asset}")
            
        # 2. Intraday Timeframes
        for tf_name, tf_code in timeframes:
            if tf_code == "1d": continue # Handled above
            
            # Input file: data/{asset}_{tf_code}.csv
            input_path = f"data/{asset}_{tf_code}.csv"
            
            if os.path.exists(input_path):
                suffix = f"_{asset}_{tf_code}"
                print(f"  [{tf_name}] Processing {input_path} -> Suffix: {suffix}")
                run_pipeline(data_path=input_path, suffix=suffix, symbol=asset)
            else:
                print(f"  [Skip] {input_path} not found.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--assets", default="all", help="all or list like XAUUSD,EURUSD")
    parser.add_argument("--schema", default="77", help="Ignored (enforced by pipeline code)")
    
    args = parser.parse_args()
    
    repair_all(args.assets)
