import sys
import os

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.utils.config_loader import config

def check_config():
    print("Checking Active Asset Configuration...")
    assets = config.get('assets', {})
    
    for symbol, details in assets.items():
        tfs = details.get('timeframes', [])
        print(f"Asset: {symbol}")
        print(f"  Active Timeframes: {tfs}")
        
if __name__ == "__main__":
    check_config()
