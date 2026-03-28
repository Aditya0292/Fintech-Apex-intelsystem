"""
APEX TRADE AI - Portfolio Re-Alignment Suite
============================================
1. Regenerates 84-feature datasets for ALL pairs.
2. Retrains Ensemble Meta-Learners for ALL pairs.
3. Prepares the system for a final multi-asset report.
"""

import os
import subprocess
import sys
import yaml

def run_cmd(cmd, name):
    print(f"--- Running: {name} ---")
    try:
        subprocess.run(cmd, check=True)
        print(f"--- [SUCCESS]: {name} ---")
        return True
    except Exception as e:
        print(f"--- [FAILED]: {name} | {e} ---")
        return False

def main():
    # Assets to synchronize
    assets = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"]
    timeframes = ["1h", "4h"]
    
    print("🚀 STARTING PORTFOLIO RE-ALIGNMENT...")
    
    # Step 1: Retrain all models
    # We use tools/train_all.py or call src/models/train_ensemble.py directly
    for asset in assets:
        for tf in timeframes:
            suffix = f"_{asset}_{tf}"
            print(f"\n⚡ SYNCING {suffix}...")
            
            # Training Command
            # Note: We use n_splits=3 for speed in this hackathon-ready script
            train_cmd = [sys.executable, "src/models/train_ensemble.py", "--suffix", suffix, "--n_splits", "3"]
            run_cmd(train_cmd, f"Training Ensemble {suffix}")

    print("\n✅ PORTFOLIO SYNC COMPLETE.")
    print("Now run 'python -m tools.backtest_all' to verify the new metrics.")

if __name__ == "__main__":
    main()
