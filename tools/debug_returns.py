import pandas as pd
import numpy as np

def check_returns():
    path = "data/GBPUSD_history.csv"
    print(f"Loading {path}...")
    df = pd.read_csv(path)
    
    print("Columns:", df.columns.tolist())
    print("Dtypes:\n", df.dtypes)
    print("\nHead:\n", df.head())
    
    # Check for 0 volume or flat candles
    df['move_abs'] = (df['close'] - df['open']).abs()
    df['pct_move'] = df['move_abs'] / df['open']
    
    threshold = 0.0002 # 0.02%
    neutrals = df[df['pct_move'] <= threshold]
    
    print("\nStatistics:")
    print(df['pct_move'].describe())
    
    print(f"\nThreshold: {threshold} (0.02%)")
    print(f"Total Rows: {len(df)}")
    print(f"Neutral Rows: {len(neutrals)} ({len(neutrals)/len(df):.2%})")
    
    # Check if 'next' day return logic matches
    # FeaturePipeline uses: next_open = df['open'].shift(-1), next_close = df['close'].shift(-1)
    # ret = (next_close - next_open) / next_open
    
    next_open = df['open'].shift(-1)
    next_close = df['close'].shift(-1)
    ret = (next_close - next_open) / next_open
    ret = ret.fillna(0)
    
    targets = np.zeros(len(df), dtype=int)
    targets[:] = 2
    targets[ret > threshold] = 1
    targets[ret < -threshold] = 0
    
    print(f"\nReplicated Pipeline Logic Distribution:")
    for val, count in zip(u, c):
        print(f"Class {val}: {count} ({count/len(targets):.1%})")
        
    print("\n--- Flat Row Inspection ---")
    flat_rows = df[df['pct_move'] < 0.0001]
    print(f"Rows with move < 0.01%: {len(flat_rows)}")
    print(flat_rows.head(10))
    print("\nTail of flat rows:")
    print(flat_rows.tail(10))

if __name__ == "__main__":
    check_returns()
