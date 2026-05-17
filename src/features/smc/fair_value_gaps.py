
import pandas as pd
import numpy as np
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class FairValueGapDetector:
    """
    Module 2: Fair Value Gap Detector (Institutional Grade)
    
    Mathematical definitions:
    - Bullish FVG: Low_C[t] > High_C[t-2]. Gap = [High_C[t-2], Low_C[t]]
    - Bearish FVG: High_C[t] < Low_C[t-2]. Gap = [High_C[t], Low_C[t-2]]
    - Validity: 0.3 * ATR <= Size <= 3.0 * ATR
    - Fill tracking: percentage of the gap that has been touched or closed.
    """

    def __init__(self, min_atr_factor: float = 0.3, max_atr_factor: float = 3.0):
        self.min_atr_factor = min_atr_factor
        self.max_atr_factor = max_atr_factor

    def detect(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Detects FVGs and calculates related features.
        Optimized for production: Only calculates for the most recent window.
        """
        df = df.copy()
        
        # Initialize features
        for col in ['fvg_bullish_active', 'fvg_bearish_active', 'fvg_age_candles', 'fvg_ob_confluence']:
            df[col] = 0
        for col in ['fvg_size_norm', 'fvg_fill_pct']:
            df[col] = 0.0

        active_bull_fvgs = []
        active_bear_fvgs = []

        # Optimization: Only calculate for the last N rows
        # We use a larger window for FVGs as they can persist longer than OBs
        CALC_WINDOW = 500
        calc_start = max(2, len(df) - CALC_WINDOW)
        
        # Pre-cache column indices
        cols = {c: df.columns.get_loc(c) for c in [
            'fvg_bullish_active', 'fvg_bearish_active', 'fvg_age_candles', 
            'fvg_ob_confluence', 'fvg_size_norm', 'fvg_fill_pct',
            'high', 'low', 'close', 'atr_14'
        ]}

        for i in range(calc_start, len(df)):
            curr_low = df.iat[i, cols['low']]
            curr_high = df.iat[i, cols['high']]
            curr_close = df.iat[i, cols['close']]
            c1_high = df.iat[i-2, cols['high']]
            c1_low = df.iat[i-2, cols['low']]
            atr = df.iat[i, cols['atr_14']]
            
            # 1. Detect New FVG
            if curr_low > c1_high:
                gap_size = curr_low - c1_high
                if self.min_atr_factor * atr <= gap_size <= self.max_atr_factor * atr:
                    active_bull_fvgs.append({
                        'top': curr_low, 'bottom': c1_high, 'size': gap_size,
                        'lowest_reached': curr_low, 'created_at': i, 'fill_pct': 0.0
                    })

            if curr_high < c1_low:
                gap_size = c1_low - curr_high
                if self.min_atr_factor * atr <= gap_size <= self.max_atr_factor * atr:
                    active_bear_fvgs.append({
                        'top': c1_low, 'bottom': curr_high, 'size': gap_size,
                        'highest_reached': curr_high, 'created_at': i, 'fill_pct': 0.0
                    })

            # 2. Update / Clean lists
            remaining_bull = []
            for fvg in active_bull_fvgs:
                if curr_close <= fvg['bottom']: continue # Closed by body
                fvg['lowest_reached'] = min(fvg['lowest_reached'], curr_low)
                fill_pct = (fvg['top'] - fvg['lowest_reached']) / fvg['size']
                if fill_pct >= 1.0: continue
                fvg['fill_pct'] = max(0, min(1, fill_pct))
                remaining_bull.append(fvg)
            active_bull_fvgs = remaining_bull

            remaining_bear = []
            for fvg in active_bear_fvgs:
                if curr_close >= fvg['top']: continue # Closed by body
                fvg['highest_reached'] = max(fvg['highest_reached'], curr_high)
                fill_pct = (fvg['highest_reached'] - fvg['bottom']) / fvg['size']
                if fill_pct >= 1.0: continue
                fvg['fill_pct'] = max(0, min(1, fill_pct))
                remaining_bear.append(fvg)
            active_bear_fvgs = remaining_bear

            # 3. Proximity / Features
            prox = atr * 2.0
            if active_bull_fvgs:
                closest = min(active_bull_fvgs, key=lambda x: abs(curr_close - x['bottom']))
                if abs(curr_close - closest['bottom']) <= prox:
                    df.iat[i, cols['fvg_bullish_active']] = 1
                    df.iat[i, cols['fvg_size_norm']] = closest['size'] / atr
                    df.iat[i, cols['fvg_fill_pct']] = closest['fill_pct']
                    df.iat[i, cols['fvg_age_candles']] = i - closest['created_at']

            if active_bear_fvgs:
                closest = min(active_bear_fvgs, key=lambda x: abs(curr_close - x['top']))
                if abs(curr_close - closest['top']) <= prox:
                    df.iat[i, cols['fvg_bearish_active']] = 1
                    df.iat[i, cols['fvg_size_norm']] = max(df.iat[i, cols['fvg_size_norm']], closest['size'] / atr)
                    df.iat[i, cols['fvg_fill_pct']] = max(df.iat[i, cols['fvg_fill_pct']], closest['fill_pct'])
                    df.iat[i, cols['fvg_age_candles']] = max(df.iat[i, cols['fvg_age_candles']], i - closest['created_at'])

        return df

        return df
