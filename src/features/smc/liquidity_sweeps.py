
import pandas as pd
import numpy as np
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class LiquiditySweepDetector:
    """
    Module 3: Liquidity Sweep Detector (Adversarial Grade)
    
    Mathematical definitions:
    - Sweep confirmed when price penetrates a 20-period swing extreme but closes back inside.
    - Wick extension >= 0.15 * ATR (filters noise).
    - RSI Divergence: Momentum must not follow price into the extreme.
    - ChoCH: First candle closing in the opposite direction post-sweep.
    """

    def __init__(self, swing_lookback: int = 20, wick_penetration_min: float = 0.15):
        self.swing_lookback = swing_lookback
        self.wick_penetration_min = wick_penetration_min

    def detect(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Detects liquidity sweeps and calculates related features.
        Optimized for production: Only calculates for the most recent window.
        """
        df = df.copy()
        
        # Initialize features
        for col in ['sweep_detected', 'sweep_direction', 'sweep_choch_confirmed', 'sweep_age_candles']:
            df[col] = 0
        for col in ['sweep_intensity', 'wick_to_body_ratio']:
            df[col] = 0.0

        # Optimization: Only calculate for the last N rows
        CALC_WINDOW = 500
        calc_start = max(self.swing_lookback + 5, len(df) - CALC_WINDOW)
        
        # Pre-cache column indices
        cols = {c: df.columns.get_loc(c) for c in [
            'sweep_detected', 'sweep_direction', 'sweep_choch_confirmed', 
            'sweep_age_candles', 'sweep_intensity', 'wick_to_body_ratio',
            'high', 'low', 'close', 'open', 'atr_14', 'rsi_14',
            'range_max', 'range_min'
        ]}

        last_sweep_idx = -1
        last_sweep_dir = 0
        
        for i in range(calc_start, len(df)):
            curr_high = df.iat[i, cols['high']]
            curr_low = df.iat[i, cols['low']]
            curr_close = df.iat[i, cols['close']]
            curr_open = df.iat[i, cols['open']]
            curr_max = df.iat[i, cols['range_max']]
            curr_min = df.iat[i, cols['range_min']]
            atr = df.iat[i, cols['atr_14']]
            
            # --- Upside Sweep ---
            if curr_high > curr_max and curr_close <= curr_max:
                wick_ext = (curr_high - curr_max) / atr
                if wick_ext >= self.wick_penetration_min:
                    prev_max_idx = df['high'].iloc[i-self.swing_lookback:i].idxmax()
                    rsi_div = df.iat[i, cols['rsi_14']] < df.at[prev_max_idx, 'rsi_14']
                    if rsi_div:
                        df.iat[i, cols['sweep_detected']] = 1
                        df.iat[i, cols['sweep_direction']] = 1
                        df.iat[i, cols['sweep_intensity']] = wick_ext
                        last_sweep_idx = i
                        last_sweep_dir = 1
            
            # --- Downside Sweep ---
            elif curr_low < curr_min and curr_close >= curr_min:
                wick_ext = (curr_min - curr_low) / atr
                if wick_ext >= self.wick_penetration_min:
                    prev_min_idx = df['low'].iloc[i-self.swing_lookback:i].idxmin()
                    rsi_div = df.iat[i, cols['rsi_14']] > df.at[prev_min_idx, 'rsi_14']
                    if rsi_div:
                        df.iat[i, cols['sweep_detected']] = 1
                        df.iat[i, cols['sweep_direction']] = -1
                        df.iat[i, cols['sweep_intensity']] = wick_ext
                        last_sweep_idx = i
                        last_sweep_dir = -1

            # --- Wick to Body ---
            body = max(0.0001, abs(curr_close - curr_open))
            wick = (curr_high - max(curr_open, curr_close)) if last_sweep_dir == 1 else (min(curr_open, curr_close) - curr_low)
            df.iat[i, cols['wick_to_body_ratio']] = wick / body

            # --- ChoCH Confirmation ---
            if last_sweep_idx != -1 and i > last_sweep_idx and i - last_sweep_idx <= 10:
                df.iat[i, cols['sweep_age_candles']] = i - last_sweep_idx
                if (last_sweep_dir == 1 and curr_close < curr_open) or (last_sweep_dir == -1 and curr_close > curr_open):
                    df.iat[i, cols['sweep_choch_confirmed']] = 1
                    last_sweep_idx = -1

        return df

        return df
