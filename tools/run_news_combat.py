import sys
import os
import time

# Add project root to path (MUST BE BEFORE LOCAL IMPORTS)
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import datetime, timedelta
from src.data.news_combat_monitor import NewsCombatMonitor
from src.utils.logger import get_logger

logger = get_logger()

def run_dashboard():
    monitor = NewsCombatMonitor()
    monitor.start_sentinel()
    
    os.system('cls' if os.name == 'nt' else 'clear')
    
    while True:
        try:
            os.system('cls' if os.name == 'nt' else 'clear')
            print("="*80)
            print(f"🚀 APEX TRADE AI - NEWS COMBAT DASHBOARD | {datetime.now().strftime('%H:%M:%S')}")
            print("="*80)
            
            # Status
            status = "🟢 SENTINEL ACTIVE (Waiting for Windows)"
            if monitor.combat_mode:
                status = "🔴 COMBAT MODE ACTIVE (Aggressive Polling 5s)"
            
            print(f"STATUS: {status}")
            print("-" * 80)
            
            # Show Last Releases
            if monitor.last_results:
                print("\nRECENT RELEASES:")
                for title, data in monitor.last_results.items():
                    color = "🟢" if "STRONG" in data['bias'] else "🔴" if "WEAK" in data['bias'] else "⚪"
                    print(f"  [{data['time']}] {title}: {data['actual']} | BIAS: {data['bias']} {color}")
            else:
                print("\nNo releases detected in this session.")
                
            print("-" * 80)
            print("\nLOGS:")
            # Just show a few lines of activity
            print("  - Sentinel monitoring ForexFactory via fast HTTP requests...")
            print("  - Target window: 10m before Red Folder events.")
            
            print("\n" + "="*80)
            print("(Press Ctrl+C to Exit)")
            
            time.sleep(2)
            
        except KeyboardInterrupt:
            print("\nShutting down monitor...")
            break
        except Exception as e:
            print(f"Dashboard Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    run_dashboard()
