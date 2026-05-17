"""
APEX TRADE AI - Automated Ensemble Training Orchestrator
=========================================================
Runs pre-flight checks then trains all asset/timeframe models.
"""

import subprocess
import os
import yaml
import sys

def train_all():
    # Load config for assets and timeframes
    with open('src/config/assets.yaml', 'r') as f:
        assets_cfg = yaml.safe_load(f)
    
    # Standard Institutional Timeframes (3-TF Precision Mode)
    timeframes = ['1d', '4h', '1h']
    assets = list(assets_cfg.keys())
    
    print("APEX TRADE AI - Institutional Training Pipeline V2")
    print("=" * 60)
    print(f"Assets: {assets}")
    print(f"Timeframes: {timeframes}")
    print(f"Training Config: epochs=80, batch=64, LR=0.0005, gap=100")
    print("=" * 60)
    
    results = []
    
    for asset in assets:
        print(f"\n>>> TRAINING ASSET: {asset}")
        for tf in timeframes:
            suffix = f"_{asset}_{tf}"
            
            # Check if data exists
            x_path = f"data/X{suffix}.npy"
            if not os.path.exists(x_path):
                print(f"  Skipping {suffix}: {x_path} not found")
                continue
            
            # 1. Run Pre-Flight Check
            print(f"\n  [PRE-FLIGHT] Checking {suffix}...")
            preflight_cmd = [sys.executable, "tools/verification/pre_flight_check.py", "--suffix", suffix]
            preflight_result = subprocess.run(preflight_cmd, capture_output=True, text=True)
            print(preflight_result.stdout)
            
            if preflight_result.returncode != 0:
                print(f"  [SKIP] {suffix} failed pre-flight check")
                results.append((suffix, "FAILED PRE-FLIGHT"))
                continue
                
            # 2. Train Ensemble
            print(f"  Training Ensemble for {suffix}...")
            cmd = [
                sys.executable, "src/models/train_ensemble.py",
                "--suffix", suffix,
                "--n_splits", "3",
                "--epochs", "80",
                "--gap", "100"
            ]
            
            try:
                subprocess.run(cmd, check=True)
                print(f"  [SUCCESS] {suffix} Trained.")
                results.append((suffix, "SUCCESS"))
            except subprocess.CalledProcessError as e:
                print(f"  [ERROR] training failed for {suffix}: {e}")
                results.append((suffix, f"ERROR: {e}"))

    print("\n" + "=" * 60)
    print("TRAINING SUMMARY")
    print("=" * 60)
    for suffix, status in results:
        icon = "[OK]" if status == "SUCCESS" else "[FAIL]"
        print(f"  {icon} {suffix}: {status}")
    
    success_count = sum(1 for _, s in results if s == "SUCCESS")
    print(f"\n{success_count}/{len(results)} models trained successfully.")
    print("=" * 60)

if __name__ == "__main__":
    train_all()
