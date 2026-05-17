import numpy as np
import os
import sys

sys.path.append(os.getcwd())

def check_balance():
    assets = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY"]
    timeframes = ["1d", "4h", "1h", "15m"]
    
    print(f"{'Asset':<10} | {'TF':<5} | {'Bear (0)':<10} | {'Bull (1)':<10} | {'Neut (2)':<10} | {'Total':<8}")
    print("-" * 75)
    
    for asset in assets:
        for tf in timeframes:
            # Construct path: data/y_class_{asset}_{tf}.npy
            # Note: My recent file listing showed data/y_class_EURUSD_1d.npy etc.
            suffix = f"_{asset}_{tf}"
            path = f"data/y_class{suffix}.npy"
            
            if not os.path.exists(path):
                # Try XAUUSD legacy path? No, listing showed XAUUSD has full names now too
                continue
                
            try:
                y = np.load(path)
                unique, counts = np.unique(y, return_counts=True)
                dist = dict(zip(unique, counts))
                
                bear = dist.get(0, 0)
                bull = dist.get(1, 0)
                neut = dist.get(2, 0)
                total = len(y)
                
                print(f"{asset:<10} | {tf:<5} | {bear:<10} ({bear/total:.1%}) | {bull:<10} ({bull/total:.1%}) | {neut:<10} ({neut/total:.1%}) | {total:<8}")
                
            except Exception as e:
                print(f"{asset:<10} | {tf:<5} | Error: {e}")

if __name__ == "__main__":
    check_balance()
