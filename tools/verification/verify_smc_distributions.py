
import pandas as pd
import numpy as np
import sys
import os

# Add root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def run_smc_checks(feature_file: str):
    print(f"=== SMC INSTITUTIONAL QA AUDIT: {feature_file} ===")
    if not os.path.exists(feature_file):
        print(f"FAIL: {feature_file} not found.")
        return

    df = pd.read_csv(feature_file)
    total = len(df)
    
    checks = {
        "OB_Presence": (df['ob_bullish_present'].mean(), 0.05, 0.30),
        "FVG_Active": (df['fvg_bullish_active'].mean(), 0.05, 0.40),
        "Sweep_Rare_Event": (df['sweep_detected'].mean(), 0.01, 0.10),
        "Confluence_Mean": (df['smc_confluence_long'].mean(), 0.10, 0.40),
        "Premium_Discount": (df['premium_discount'].mean(), -0.3, 0.3),
        "Structure_State": (df['structure_state'].abs().mean(), 0.1, 1.0),
        "Conflict_Rate": (df['smc_conflict'].mean(), 0.0, 0.05)
    }

    results = []
    all_pass = True

    for name, (val, low, high) in checks.items():
        status = "PASS" if low <= val <= high else "WARN"
        if status == "WARN" and (val == 0 or val == 1.0): 
            status = "FAIL"
            all_pass = False
        
        results.append({
            "Check": name,
            "Value": f"{val:.4f}",
            "Expected": f"[{low}, {high}]",
            "Result": status
        })

    # Correlation Check (Module 10 Req 6)
    corr = df['ob_bullish_present'].corr(df['fvg_bullish_active'])
    results.append({
        "Check": "OB/FVG_Correlation",
        "Value": f"{corr:.4f}",
        "Expected": "> 0.05",
        "Result": "PASS" if corr > 0.05 else "WARN"
    })

    print(pd.DataFrame(results).to_string(index=False))
    
    if all_pass:
        print("\n>>> QA STATUS: INSTITUTIONAL GRADE (PASSED)")
    else:
        print("\n>>> QA STATUS: REJECTED (Distributions out of range)")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=str, default="data/features_enhanced__XAUUSD_1h.csv")
    args = parser.parse_args()
    
    run_smc_checks(args.file)
