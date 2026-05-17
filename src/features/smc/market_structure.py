
import pandas as pd
import numpy as np
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class MarketStructureEngine:
    """
    Module 4: Market Structure Engine (Markov State Machine)
    
    Mathematical definitions:
    State Space: S = {UPTREND, DOWNTREND, CONSOLIDATION}
    BOS_up: Close[t] > max(High[t-n:t-1]) AND Displacement >= 1.0 ATR
    BOS_down: Close[t] < min(Low[t-n:t-1]) AND Displacement >= 1.0 ATR
    ChoCH: First close in opposition (Close < HL in Uptrend, etc.)
    Premium/Discount: (Close - Equity) / (0.5 * Range)
    """

    def __init__(self, bos_lookback: int = 20, displacement_min: float = 1.0):
        self.bos_lookback = bos_lookback
        self.displacement_min = displacement_min

    def detect(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Detects market structure states and calculates related features.
        Optimized for production: Only calculates for the most recent window.
        """
        df = df.copy()
        
        # Initialize features
        for col in ['structure_state', 'bos_confirmed', 'choch_confirmed']:
            df[col] = 0
        for col in ['premium_discount', 'swing_high_distance', 'swing_low_distance', 'structure_strength']:
            df[col] = 0.0

        # Optimization: Only calculate for the last N rows
        CALC_WINDOW = 500
        calc_start = max(self.bos_lookback + 1, len(df) - CALC_WINDOW)
        
        # Pre-cache column indices
        cols = {c: df.columns.get_loc(c) for c in [
            'structure_state', 'bos_confirmed', 'choch_confirmed', 
            'premium_discount', 'swing_high_distance', 'swing_low_distance', 
            'structure_strength', 'high', 'low', 'close', 'open', 'atr_14',
            'range_max', 'range_min'
        ]}

        current_state = 0
        last_bos_high = 0.0
        last_bos_low = 0.0

        for i in range(calc_start, len(df)):
            curr_high = df.iat[i, cols['high']]
            curr_low = df.iat[i, cols['low']]
            curr_close = df.iat[i, cols['close']]
            curr_open = df.iat[i, cols['open']]
            curr_max = df.iat[i, cols['range_max']]
            curr_min = df.iat[i, cols['range_min']]
            atr = df.iat[i, cols['atr_14']]
            
            displacement = (curr_high - curr_low) / atr
            
            # --- State Transitions (BOS) ---
            if curr_close > curr_max and curr_close > curr_open:
                if displacement >= self.displacement_min:
                    current_state = 1
                    df.iat[i, cols['bos_confirmed']] = 1
                    df.iat[i, cols['structure_strength']] = displacement
                    last_bos_high = curr_high
                    last_bos_low = curr_min

            elif curr_close < curr_min and curr_close < curr_open:
                if displacement >= self.displacement_min:
                    current_state = -1
                    df.iat[i, cols['bos_confirmed']] = 1
                    df.iat[i, cols['structure_strength']] = displacement
                    last_bos_low = curr_low
                    last_bos_high = curr_max

            # --- Change of Character (ChoCH) ---
            if current_state == 1 and curr_close < curr_min:
                current_state = 0
                df.iat[i, cols['choch_confirmed']] = 1
            elif current_state == -1 and curr_close > curr_max:
                current_state = 0
                df.iat[i, cols['choch_confirmed']] = 1

            df.iat[i, cols['structure_state']] = current_state

            # --- Premium / Discount Ratio ---
            if last_bos_high > last_bos_low:
                equilibrium = (last_bos_high + last_bos_low) / 2
                half_range = (last_bos_high - last_bos_low) / 2
                if half_range > 0:
                    pd_val = (curr_close - equilibrium) / half_range
                    df.iat[i, cols['premium_discount']] = max(-1.0, min(1.0, pd_val))

            # --- Distances ---
            if curr_max > 0:
                df.iat[i, cols['swing_high_distance']] = (curr_close - curr_max) / atr
                df.iat[i, cols['swing_low_distance']] = (curr_close - curr_min) / atr

        return df
