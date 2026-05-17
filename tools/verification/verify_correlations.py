import pandas as pd
import numpy as np
import os
import glob
from scipy.stats import pearsonr

def verify_relationships():
    print("=== VERIFYING DXY & NEWS LOGIC (Empirical Check) ===")
    
    # constant path pattern
    files = glob.glob("data/features_enhanced_*.csv")
    
    for fpath in files:
        if "XAUUSD" not in fpath and "EURUSD" not in fpath and "USDJPY" not in fpath:
            continue
            
        print(f"\nAnalyzing {os.path.basename(fpath)}...")
        df = pd.read_csv(fpath)
        
        # 1. Check DXY Correlation
        if 'dxy_close' in df.columns:
            # We want rolling correlation or consistent trend
            # Just check if columns exist and calculate global correlation
            # Remove NaNs
            valid = df[['close', 'dxy_close']].dropna()
            if len(valid) > 100:
                corr, _ = pearsonr(valid['close'], valid['dxy_close'])
                print(f"  [DXY] Global Correlation (Price vs DXY): {corr:.4f}")
                
                if "USDJPY" in fpath:
                    expected = "POSITIVE (+)"
                    status = "✅ OK" if corr > 0 else "⚠️ Weak/Inverse (Check Regime)"
                else:
                    expected = "NEGATIVE (-)"
                    status = "✅ OK" if corr < 0 else "⚠️ Weak/Inverse (Check Regime)"
                    
                print(f"        Expected: {expected} | Status: {status}")
            else:
                 print("  [DXY] Not enough data for correlation.")
        else:
            print("  [DXY] Column 'dxy_close' missing.")
            
        # 2. Check News Impact Populated
        if 'news_impact_net' in df.columns:
            non_zero = (df['news_impact_net'] != 0).sum()
            print(f"  [NEWS] Non-Zero Impact Events: {non_zero}/{len(df)}")
            
            if non_zero > 0:
                # Check sample logic
                # Find a day with negative impact
                sample = df[df['news_impact_net'] < -0.1].head(1)
                if not sample.empty:
                    print(f"  [NEWS] Sample Negative News (Net={sample['news_impact_net'].values[0]:.2f})")
                    if "XAUUSD" in fpath or "EURUSD" in fpath:
                         print("        Context: Consistent with 'Good USD News' (Bearish for Pair)")
                    elif "USDJPY" in fpath:
                         print("        Context: Consistent with 'Bad USD News' (Bearish for Pair)")
            else:
                print("  [NEWS] Warning: No news impact found (Synthetic generation might be off).")
        else:
             print("  [NEWS] Column 'news_impact_net' missing.")

if __name__ == "__main__":
    verify_relationships()
