
import numpy as np
import pandas as pd
import sys
import os

# Mock the environment
sys.path.append(os.getcwd())

from tools.backtesting.backtest import Backtester
from tools.backtesting.evaluate import load_data, load_all_models

def run_optimized_simulation():
    print("--- Running Optimized Simulation (0.57 Threshold, 1% Risk, 1:2 RR) ---")
    
    # Load XAUUSD Daily Data
    try:
        X, y, X_tree = load_data(suffix="_XAUUSD_1d")
        y_reg = np.load("data/y_reg_XAUUSD_1d.npy")
    except Exception as e:
        print(f"Error loading XAUUSD data: {e}")
        return

    # Initialize Backtester
    bt = Backtester(initial_capital=1000)
    bt.risk_pct = 0.01  # 1% Risk
    bt.rr_ratio = 2.5   # XAUUSD usually has higher RR in the script logic (2.5)
    
    # Load Models
    input_shape = (X.shape[1], X.shape[2])
    models = load_all_models(input_shape, suffix="_XAUUSD_1d")
    xgb_m, lgb_m, lstm_m, trans_m, meta_m = models
    
    if any(m is None for m in models):
        print("Failed to load models.")
        return

    # Predictions
    print("Generating predictions...")
    p_xgb = xgb_m.predict_proba(X_tree)
    p_lgb = lgb_m.predict(X_tree)
    p_lstm = lstm_m.predict(X, verbose=0)
    p_trans = trans_m.predict(X, verbose=0)
    stacked = np.hstack([p_xgb, p_lgb, p_lstm, p_trans])
    probs = meta_m.predict_proba(stacked)
    preds = np.argmax(probs, axis=1)
    max_probs = np.max(probs, axis=1)
    
    # Run thresholds
    thresholds = [0.55, 0.57, 0.60, 0.65]
    
    print(f"{'Thresh':<8} | {'Return':<10} | {'WinRate':<8} | {'Trades':<8} | {'Equity':<10}")
    print("-" * 55)
    
    for thresh in thresholds:
        equity = [1000]
        wins = 0
        trades_count = 0
        
        for i in range(len(preds) - 1):
            conf = max_probs[i]
            pred_class = preds[i]
            actual_label = y[i+1] # Triple barrier outcome
            
            position = 0
            if conf >= thresh:
                if pred_class == 2: position = 1
                elif pred_class == 0: position = -1
            
            if position != 0:
                is_win = False
                if position == 1 and actual_label == 2: is_win = True
                elif position == -1 and actual_label == 0: is_win = True
                
                trades_count += 1
                current_equity = equity[-1]
                if is_win:
                    equity.append(current_equity + current_equity * (bt.risk_pct * bt.rr_ratio))
                    wins += 1
                else:
                    equity.append(current_equity - current_equity * bt.risk_pct)
            else:
                equity.append(equity[-1])
        
        win_rate = wins / trades_count if trades_count > 0 else 0
        total_return = (equity[-1] - 1000) / 1000
        print(f"{thresh:<8.2f} | {total_return:<10.1%} | {win_rate:<8.1%} | {trades_count:<8} | ${equity[-1]:<10.2f}")

if __name__ == "__main__":
    run_optimized_simulation()
