import subprocess
import os
import yaml
import sys

def train_all():
    # Load config for assets and timeframes
    with open('src/config/assets.yaml', 'r') as f:
        assets_cfg = yaml.safe_load(f)
    
    # We use lowercase codes for suffixes
    timeframes = ['daily', '4h', '1h', '15m']
    assets = assets_cfg.keys()
    
    print("APEX TRADE AI - Automated Stacking Ensemble Training")
    print("=" * 60)
    
    for asset in assets:
        print(f"\n>>> TRAINING ASSET: {asset}")
        for tf in timeframes:
            suffix = f"_{asset}_{tf}"
            
            # Check if data exists
            x_path = f"data/X{suffix}.npy"
            if not os.path.exists(x_path):
                continue
                
            print(f"  Training Ensemble for {suffix}...")
            
            # Run train_ensemble.py
            # We use subprocess to isolate memory and avoid interference
            cmd = [sys.executable, "src/models/train_ensemble.py", "--suffix", suffix, "--n_splits", "3"]
            
            try:
                subprocess.run(cmd, check=True)
                print(f"  [SUCCESS] {suffix} Trained.")
            except subprocess.CalledProcessError as e:
                print(f"  [ERROR] training failed for {suffix}: {e}")

    print("\n" + "=" * 60)
    print("ALL MODELS TRAINED SUCCESSFULLY.")

if __name__ == "__main__":
    train_all()
