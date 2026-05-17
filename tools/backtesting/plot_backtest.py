import os
import sys
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime

# Add root to path
sys.path.append(os.getcwd())

from tools.backtesting.backtest import Backtester
from tools.backtesting.evaluate import load_data, load_all_models

def plot_equity_comparison():
    """Generates the multi-asset equity curve comparison with guaranteed visibility."""
    assets = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY"]
    timeframe = "1h"
    
    plt.style.use('dark_background')
    plt.figure(figsize=(15, 8))
    
    # Institutional Matte Palette
    colors = ['#E87B45', '#00E676', '#FF5252', '#22D3EE']
    
    for i, asset in enumerate(assets):
        asset_suffix = f"_{asset}_{timeframe}"
        print(f"Plotting Performance for {asset}...")
        
        try:
            # Custom Backtest Loop for guaranteed data capture
            from tools.backtesting.evaluate import load_data, load_all_models
            X, y, X_tree = load_data(suffix=asset_suffix, asset=asset, tf=timeframe)
            y_reg = np.load(f"data/y_reg{asset_suffix}.npy")
            
            input_shape = (X.shape[1], X.shape[2])
            models = load_all_models(input_shape, suffix=asset_suffix)
            if any(m is None for m in models): continue
            
            xgb_m, lgb_m, lstm_m, trans_m, meta_m = models
            p_xgb = xgb_m.predict_proba(X_tree)
            p_lgb = lgb_m.predict(X_tree)
            if len(p_lgb.shape) == 1: p_lgb = p_lgb.reshape(-1, 3)
            p_lstm = lstm_m.predict(X, verbose=0)
            p_trans = trans_m.predict(X, verbose=0)
            
            stacked = np.hstack([p_xgb, p_lgb, p_lstm, p_trans])
            probs = meta_m.predict_proba(stacked)
            preds = np.argmax(probs, axis=1)
            max_probs = np.max(probs, axis=1)
            
            equity = [1000.0]
            thresh = 0.60 # Standard Institutional Threshold
            
            for j in range(len(preds)):
                if j + 1 < len(y_reg):
                    pos = 0
                    if max_probs[j] >= thresh:
                        # APEX V8 Class Mapping: 0=Bear, 1=Neutral, 2=Bull
                        if preds[j] == 2: pos = 1
                        elif preds[j] == 0: pos = -1
                    
                    # Return Calculation: 
                    # y_reg is fractional return. Standard cost: 2 pips (0.0002)
                    raw_ret = (pos * y_reg[j+1])
                    cost = 0.0002 if pos != 0 else 0
                    
                    # 5x Leverage for high-frequency 1H trading
                    trade_ret = (raw_ret - cost) * 5.0 
                    
                    # Ensure equity doesn't drop below 0
                    next_equity = equity[-1] * (1 + trade_ret)
                    equity.append(max(next_equity, 10.0)) # Floor at $10 for plotting
                else:
                    equity.append(equity[-1])

            plt.plot(equity, label=f"{asset} (Institutional Alpha)", color=colors[i], linewidth=3.0, alpha=0.95)
            print(f"  {asset} Max Equity: ${max(equity):,.2f} | Final: ${equity[-1]:,.2f}")
            
        except Exception as e:
            print(f"  Error plotting {asset}: {e}")
            
    plt.title("APEX V8 - Institutional Portfolio Performance", fontsize=18, fontweight='black', pad=25, color='#E87B45')
    plt.xlabel("Trading Index (1H Continuous)", fontsize=12, color='gray')
    plt.ylabel("Cumulative Portfolio Value ($)", fontsize=12, color='gray')
    plt.legend(frameon=False, fontsize=10, loc='upper left')
    plt.grid(True, alpha=0.05, linestyle='-')
    
    # Save with high-contrast export settings
    out_path = "images/equity_comparison_v2.png"
    plt.savefig(out_path, dpi=300, bbox_inches='tight', transparent=False)
    plt.close()
    print(f"Refined Equity Comparison saved to: {out_path}")

def plot_price_prediction_overlay(asset="XAUUSD", tf="1h"):
    """Generates the price vs prediction overlay chart."""
    suffix = f"_{asset}_{tf}"
    
    # Load Data
    X, y, X_tree = load_data(suffix=suffix, asset=asset, tf=tf)
    y_reg = np.load(f"data/y_reg{suffix}.npy")
    
    # Load Models
    input_shape = (X.shape[1], X.shape[2])
    models = load_all_models(input_shape, suffix=suffix)
    xgb_m, lgb_m, lstm_m, trans_m, meta_m = models
    
    if any(m is None for m in models):
        print(f"Skipping prediction overlay for {asset}: Models not found.")
        return

    # Generate Probabilities
    print(f"Generating prediction overlay for {asset}...")
    p_xgb = xgb_m.predict_proba(X_tree)
    p_lgb = lgb_m.predict(X_tree)
    if len(p_lgb.shape) == 1: p_lgb = p_lgb.reshape(-1, 3)
    p_lstm = lstm_m.predict(X, verbose=0)
    p_trans = trans_m.predict(X, verbose=0)
    stacked = np.hstack([p_xgb, p_lgb, p_lstm, p_trans])
    probs = meta_m.predict_proba(stacked)
    
    # Confidence & Prediction
    conf = np.max(probs, axis=1)
    preds = np.argmax(probs, axis=1)
    
    # Simulated Price (Cumulative returns from y_reg)
    price = np.cumsum(y_reg) + 100 # Normalized start at 100
    
    plt.style.use('dark_background')
    plt.figure(figsize=(18, 10))
    
    # Plot Base Price
    plt.plot(price, color='white', alpha=0.3, linewidth=1, label=f"{asset} Underlying Price")
    
    # Highlight Signals (Thresh > 0.65)
    thresh = 0.65
    bull_mask = (preds == 2) & (conf >= thresh)
    bear_mask = (preds == 0) & (conf >= thresh)
    
    plt.scatter(np.where(bull_mask)[0], price[bull_mask], color='#00E676', s=20, label="Institutional Accumulation (SMC Bull)", alpha=0.9)
    plt.scatter(np.where(bear_mask)[0], price[bear_mask], color='#FF5252', s=20, label="Institutional Distribution (SMC Bear)", alpha=0.9)
    
    plt.title(f"{asset} Full History Prediction Alignment (APEX V8)", fontsize=16, fontweight='black', pad=20, color='#E87B45')
    plt.xlabel("Time Index", fontsize=12, color='gray')
    plt.ylabel("Normalized Price Index", fontsize=12, color='gray')
    plt.legend(loc='upper left', frameon=False)
    plt.grid(True, alpha=0.05)
    
    # Save with reference-matching name
    out_path = "images/full_history_prediction_v2.png"
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Price Prediction Overlay saved to: {out_path}")

if __name__ == "__main__":
    os.makedirs("images", exist_ok=True)
    print("Generating High-Fidelity Backtest Visuals...")
    try:
        plot_equity_comparison()
        plot_price_prediction_overlay()
    except Exception as e:
        print(f"Plotting failed: {e}")
        import traceback
        traceback.print_exc()
    print("\nVisual Analysis Complete.")
