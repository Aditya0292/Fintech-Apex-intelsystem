import time
import json
import os
import sys
from pathlib import Path

# Add root
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'tools'))

from src.utils.logger import get_logger
from tools.production.predict_all import get_multi_asset_analysis
from src.data.mt5_interface import MT5Interface

logger = get_logger()

CACHE_FILE = Path("data/prediction_cache.json")
INTERVAL_SECONDS = 3600 # 1 hour baseline sync

def run_daemon(skip_mt5=False):
    print("="*60)
    print("APEX INTELLIGENCE BACKGROUND DAEMON v8")
    print("="*60)
    
    if not skip_mt5:
        # 1. Initialize MT5 ONCE
        mt = MT5Interface()
        if mt.connect():
            print("[SUCCESS] MT5 Terminal Connected and Hidden.")
        else:
            print("[WARNING] MT5 Connection Failed. Falling back to YFinance live feeds.")
    else:
        print("[INFO] MT5 Disabled. Running on YFinance live feeds.")
        
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    while True:
        try:
            print(f"\n[{time.strftime('%Y-%m-%d %H:%M:%S')}] Triggering Prediction Cycle...")
            
            # Fetch data (will use MT5 if connected, else YFinance, else CSV)
            data = get_multi_asset_analysis(skip_mt5=skip_mt5)
            
            # Write JSON atomically to prevent UI read errors
            temp_file = CACHE_FILE.with_suffix('.tmp')
            with open(temp_file, 'w') as f:
                json.dump(data, f, default=str)
            os.replace(temp_file, CACHE_FILE)
            
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Cycle Complete. Cache updated. Sleeping 5 mins.")
            time.sleep(INTERVAL_SECONDS)
            
        except KeyboardInterrupt:
            print("\nDaemon terminated by user.")
            break
        except Exception as e:
            print(f"\n[ERROR] Daemon Cycle Failed: {e}")
            time.sleep(60) # Wait 1 min on error before retry

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--no-mt5', action='store_true', help='Disable MT5 usage')
    args = parser.parse_args()
    run_daemon(skip_mt5=args.no_mt5)
