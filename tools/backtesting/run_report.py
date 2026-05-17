import os
import sys
import pandas as pd
from datetime import datetime

# Add root to path
sys.path.append(os.getcwd())

from tools.backtesting.backtest import Backtester

def generate_consolidated_report():
    assets = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY"]
    timeframes = ["1h", "4h"]
    
    initial_cap = 1000
    report_data = []
    
    print(f"Starting Elite Backtest Report at {datetime.now()}")
    print("=" * 60)
    
    for asset in assets:
        for tf in timeframes:
            suffix = f"_{asset}_{tf}"
            # Asset-Specific Thresholds to balance Portfolio ROI
            threshold_map = {
                "XAUUSD": 0.57,
                "GBPUSD": 0.54,
                "EURUSD": 0.52,
                "USDJPY": 0.52
            }
            thresh = threshold_map.get(asset, 0.55)
            
            print(f"\nProcessing {asset} {tf}...")
            
            try:
                bt = Backtester(initial_capital=initial_cap)
                # Run full history backtest
                results = bt.run_comparative_analysis(thresholds=[thresh], full_data=True, suffix=suffix)
                
                if results:
                    res = results[0]
                    report_data.append({
                        "Asset": asset,
                        "TF": tf,
                        "Thresh": res["Threshold"],
                        "Trades": res["Trades"],
                        "Conv. Rate": f"{res['Conversion']:.1%}",
                        "Win Rate": f"{res['WinRate']:.1%}",
                        "Accuracy": f"{res['Accuracy']:.1%}",
                        "Precision": f"{res['Precision']:.1%}",
                        "Profit": f"${res['Final Equity'] - initial_cap:,.2f}",
                        "Final Balance": f"${res['Final Equity']:,.2f}",
                        "ROI": f"{res['Return']:.1%}"
                    })
            except Exception as e:
                print(f"Error processing {asset} {tf}: {e}")

    # Display Report
    df = pd.DataFrame(report_data)
    if not df.empty:
        print("\n" + "=" * 100)
        print("ELITE BACKTEST PERFORMANCE REPORT (STARTING CAPITAL: $1,000)")
        print("=" * 100)
        print(df.to_string(index=False))
        
        # Save to file
        report_path = "reports/elite_backtest_results.md"
        os.makedirs("reports", exist_ok=True)
        
        md = "# Elite Backtest Results\n\n"
        md += f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
        md += "Initial Capital: $1,000\n\n"
        md += df.to_markdown(index=False)
        
        with open(report_path, "w") as f:
            f.write(md)
        print(f"\nReport saved to: {report_path}")
    else:
        print("No results found.")

if __name__ == "__main__":
    generate_consolidated_report()
