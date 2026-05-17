
import pandas as pd
import numpy as np
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class LiquidityPoolMapper:
    """
    Module 5: Liquidity Pool Mapper (Institutional Grade)
    
    Mathematical definitions:
    - Equal Highs/Lows: |H_i - H_j| < 0.1 * ATR.
    - Pool Density: Count of swing points within 0.2 * ATR.
    - Targeting: liq_as_target = 1 if current price is moving toward the nearest pool.
    """

    def __init__(self, pool_lookback: int = 50, eq_threshold: float = 0.1):
        self.pool_lookback = pool_lookback
        self.eq_threshold = eq_threshold

    def detect(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Detects liquidity pools and calculates related features.
        Optimized for production: Only calculates for the most recent window 
        required for inference (last 200 rows).
        """
        df = df.copy()
        
        # Initialize features
        for col in ['liq_pool_above_present', 'liq_pool_below_present', 'liq_pool_density_above', 
                    'liq_pool_density_below', 'liq_as_target', 'liq_sweep_proximity']:
            df[col] = 0
        for col in ['dist_to_sell_liq_norm', 'dist_to_buy_liq_norm']:
            df[col] = 0.0

        # Optimization: Only calculate for the last N rows in production/inference
        # We need at least the model's window (50) plus some buffer.
        calc_start = max(self.pool_lookback + 1, len(df) - 200)
        
        # Pre-cache column indices for speed
        cols = {c: df.columns.get_loc(c) for c in [
            'liq_pool_above_present', 'liq_pool_below_present', 'liq_pool_density_above', 
            'liq_pool_density_below', 'liq_as_target', 'liq_sweep_proximity',
            'dist_to_sell_liq_norm', 'dist_to_buy_liq_norm'
        ]}

        for i in range(calc_start, len(df)):
            current_close = df.iat[i, df.columns.get_loc('close')]
            prev_close = df.iat[i-1, df.columns.get_loc('close')]
            atr = df.iat[i, df.columns.get_loc('atr_14')]
            
            # window_highs = df['high'].iloc[i-self.pool_lookback:i]
            # window_lows = df['low'].iloc[i-self.pool_lookback:i]
            # Using .values for raw numpy speed
            window_highs = df['high'].values[i-self.pool_lookback:i]
            window_lows = df['low'].values[i-self.pool_lookback:i]
            
            # 1. Sell Side Liquidity (Equal Highs)
            above_highs = window_highs[window_highs > current_close]
            if len(above_highs) > 0:
                nearest_h = np.min(above_highs)
                count_near = np.sum(np.abs(above_highs - nearest_h) <= atr * self.eq_threshold)
                
                if count_near >= 2:
                    df.iat[i, cols['liq_pool_above_present']] = 1
                    df.iat[i, cols['liq_pool_density_above']] = int(count_near)
                    df.iat[i, cols['dist_to_sell_liq_norm']] = (nearest_h - current_close) / atr
                    if current_close > prev_close and current_close < nearest_h:
                        df.iat[i, cols['liq_as_target']] = 1
                    if (nearest_h - current_close) <= 0.5 * atr:
                        df.iat[i, cols['liq_sweep_proximity']] = 1

            # 2. Buy Side Liquidity (Equal Lows)
            below_lows = window_lows[window_lows < current_close]
            if len(below_lows) > 0:
                nearest_l = np.max(below_lows)
                count_near = np.sum(np.abs(below_lows - nearest_l) <= atr * self.eq_threshold)
                
                if count_near >= 2:
                    df.iat[i, cols['liq_pool_below_present']] = 1
                    df.iat[i, cols['liq_pool_density_below']] = int(count_near)
                    df.iat[i, cols['dist_to_buy_liq_norm']] = (current_close - nearest_l) / atr
                    if current_close < prev_close and current_close > nearest_l:
                        df.iat[i, cols['liq_as_target']] = 1
                    if (current_close - nearest_l) <= 0.5 * atr:
                        df.iat[i, cols['liq_sweep_proximity']] = 1

        return df

        return df
