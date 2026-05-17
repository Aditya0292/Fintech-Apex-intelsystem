"""
APEX TRADE AI - Robust Institutional Data Fetcher
=================================================
Fetches maximum historical depth for 1d, 4h, and 1h timeframes.
Implements staggered delays and retries to bypass Yahoo Finance rate limits.
"""

import yfinance as yf
import pandas as pd
import os
import time
import random
from datetime import datetime

# Symbols: XAUUSD (GC=F / XAUUSD=X), EURUSD=X, GBPUSD=X, USDJPY=X
ASSETS = {
    "XAUUSD": ["GC=F", "XAUUSD=X"], # Try GC=F first, then XAUUSD=X
    "EURUSD": ["EURUSD=X"],
    "GBPUSD": ["GBPUSD=X"],
    "USDJPY": ["USDJPY=X"]
}

TIMEFRAMES = {
    "1d": {"period": "max", "interval": "1d", "start": "2010-01-01"},
    "1h": {"period": "730d", "interval": "1h", "start": None},
    "4h": {"period": "730d", "interval": "1h", "start": None} # Resampled from 1h
}

def fetch_with_retry(ticker, period=None, start=None, interval="1d", retries=3):
    """Fetches data with a simple retry mechanism."""
    for attempt in range(retries):
        try:
            print(f"  Attempt {attempt+1} for {ticker} ({interval})...")
            if start:
                data = yf.download(ticker, start=start, interval=interval, progress=False, auto_adjust=True)
            else:
                data = yf.download(ticker, period=period, interval=interval, progress=False, auto_adjust=True)
            
            if not data.empty:
                return data
            
            print(f"  [WARN] Empty data for {ticker}. Retrying in {5 * (attempt+1)}s...")
            time.sleep(5 * (attempt+1))
        except Exception as e:
            print(f"  [ERROR] {ticker} attempt {attempt+1} failed: {e}")
            time.sleep(10 * (attempt+1))
    return None

def fetch_asset_data(symbol_name, tickers, tf_key):
    tf_conf = TIMEFRAMES[tf_key]
    print(f"\n>>> Fetching {symbol_name} ({tf_key})...")
    
    data = None
    for ticker in tickers:
        data = fetch_with_retry(ticker, period=tf_conf["period"], start=tf_conf["start"], interval=tf_conf["interval"])
        if data is not None and not data.empty:
            break
            
    if data is None or data.empty:
        print(f"  [CRITICAL] Failed to fetch any data for {symbol_name} {tf_key}")
        return

    try:        
        # Standardize columns
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.get_level_values(0)
        data.columns = [str(c).lower() for c in data.columns]
        
        # Resample for 4h
        if tf_key == "4h":
            print(f"  Resampling 1h -> 4h...")
            agg_dict = {'open': 'first', 'high': 'max', 'low': 'min', 'close': 'last', 'volume': 'sum'}
            valid_agg = {k: v for k, v in agg_dict.items() if k in data.columns}
            data = data.resample('4h').agg(valid_agg).dropna()
            
        data = data.reset_index()
        cols = {c: "time" for c in data.columns if "date" in c.lower()}
        data = data.rename(columns=cols)
        
        # Save Artifact
        suffix = "history" if tf_key == "1d" else tf_key
        os.makedirs("data", exist_ok=True)
        out_path = f"data/{symbol_name}_{suffix}.csv"
        data.to_csv(out_path, index=False)
        print(f"  [SUCCESS] Saved {len(data)} rows to {out_path}")
        
    except Exception as e:
        print(f"  [CRITICAL] Formatting error for {symbol_name} {tf_key}: {e}")

def main():
    print(f"APEX Institutional Data Sync - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 60)
    
    # Randomize asset order to help with rate limits
    asset_keys = list(ASSETS.keys())
    random.shuffle(asset_keys)
    
    for symbol_name in asset_keys:
        tickers = ASSETS[symbol_name]
        # Fetch 1d first, then 1h (which 4h uses)
        # Note: 1h and 4h use the same fetch, so we can optimize by fetching 1h once and resampling twice.
        
        # Fetch Daily
        fetch_asset_data(symbol_name, tickers, "1d")
        time.sleep(random.uniform(5, 10)) # Stagger between timeframe fetches
        
        # Fetch 1h and save both 1h and 4h
        fetch_asset_data(symbol_name, tickers, "1h")
        time.sleep(random.uniform(2, 5))
        fetch_asset_data(symbol_name, tickers, "4h")
        
        print(f"Cooldown before next asset...")
        time.sleep(random.uniform(15, 25)) 
            
    print("\n" + "=" * 60)
    print("STAGGERED DATA SYNC COMPLETE.")

if __name__ == "__main__":
    main()
