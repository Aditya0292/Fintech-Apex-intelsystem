import pandas as pd
import numpy as np
import os
import yaml

def verify_distributions():
    # Load config for assets and timeframes
    with open('src/config/assets.yaml', 'r') as f:
        assets_cfg = yaml.safe_load(f)
    
    timeframes = ['daily', '4h', '1h', '15m']
    assets = assets_cfg.keys()
    
    print("APEX TRADE AI - Zero Trade Fix Verification")
    print("=" * 60)
    print(f"{'Asset':<10} | {'TF':<6} | {'Bull %':<8} | {'Bear %':<8} | {'Neut %':<8} | {'Status'}")
    print("-" * 60)
    
    all_passed = True
    
    for asset in assets:
        for tf in timeframes:
            # Suffix corresponds to how data is saved
            suffix = f"_{asset}_{tf}"
            y_path = f"data/y_class{suffix}.npy"
            
            if not os.path.exists(y_path):
                # print(f"{asset:<10} | {tf:<6} | {'Missing':<8} | {'Missing':<8} | {'Missing':<8} | [SKIP]")
                continue
                
            y = np.load(y_path)
            total = len(y)
            bull = np.sum(y == 1)
            bear = np.sum(y == -1)
            neut = np.sum(y == 0)
            
            bull_pct = bull/total
            bear_pct = bear/total
            neut_pct = neut/total
            
            status = "PASS"
            if bull_pct < 0.05 or bear_pct < 0.05:
                status = "FAIL (Low Activity)"
                all_passed = False
            elif neut_pct > 0.90:
                status = "FAIL (Too many Neutral)"
                all_passed = False
                
            print(f"{asset:<10} | {tf:<6} | {bull_pct:<8.1%} | {bear_pct:<8.1%} | {neut_pct:<8.1%} | [{status}]")
            
    print("-" * 60)
    if all_passed:
        print("VERIFICATION SUCCESS: All datasets show healthy distribution.")
    else:
        print("VERIFICATION FAILURE: Some datasets still show low trade frequency.")

if __name__ == "__main__":
    verify_distributions()
