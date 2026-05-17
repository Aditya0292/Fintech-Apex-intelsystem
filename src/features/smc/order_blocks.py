
import pandas as pd
import numpy as np
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class OrderBlockDetector:
    """
    Module 1: Order Block Detection Engine (Institutional Grade)
    
    Mathematical definitions:
    - Bullish OB = last bearish candle before displacement candle(s) UP
    - Bearish OB = last bullish candle before displacement candle(s) DOWN
    - Displacement = range_candle / ATR_14 >= 2.0
    - OTE (Optimal Trade Entry) = 50% of the OB candle body
    - Mitigation: Starts at 1.0, reduces by 0.25 on each touch (max 3)
    """

    def __init__(self, atr_period: int = 14, displacement_threshold: float = 2.0):
        self.atr_period = atr_period
        self.displacement_threshold = displacement_threshold

    def detect(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Detects Order Blocks and calculates related features.
        Optimized for production: Only calculates for the most recent window.
        """
        df = df.copy()
        
        # Initialize features
        for col in ['ob_bullish_present', 'ob_bearish_present', 'ob_confluence_count']:
            df[col] = 0
        for col in ['ob_distance_norm', 'ob_freshness_score']:
            df[col] = 0.0

        active_bull_obs = []
        active_bear_obs = []

        # Optimization: Only calculate for the last N rows
        CALC_WINDOW = 500
        calc_start = max(self.atr_period + 1, len(df) - CALC_WINDOW)
        
        # Pre-cache column indices
        cols = {c: df.columns.get_loc(c) for c in [
            'ob_bullish_present', 'ob_bearish_present', 'ob_confluence_count', 
            'ob_distance_norm', 'ob_freshness_score',
            'high', 'low', 'open', 'close', 'atr_14'
        ]}

        for i in range(calc_start, len(df)):
            curr_close = df.iat[i, cols['close']]
            curr_low = df.iat[i, cols['low']]
            curr_high = df.iat[i, cols['high']]
            atr = df.iat[i, cols['atr_14']]
            
            prev_open = df.iat[i-1, cols['open']]
            prev_close = df.iat[i-1, cols['close']]
            prev_atr = df.iat[i-1, cols['atr_14']]
            
            # 1. Detect New OB
            displacement_up = (prev_close - prev_open) / prev_atr >= self.displacement_threshold
            displacement_down = (prev_open - prev_close) / prev_atr >= self.displacement_threshold

            if displacement_up:
                for j in range(2, 7):
                    idx = i - j
                    if idx < 0: break
                    if df.iat[idx, cols['close']] < df.iat[idx, cols['open']]:
                        active_bull_obs.append({
                            'top': df.iat[idx, cols['high']], 'bottom': df.iat[idx, cols['low']],
                            'mid': (df.iat[idx, cols['high']] + df.iat[idx, cols['low']]) / 2,
                            'freshness': 1.0, 'retests': 0, 'created_at': i
                        })
                        break

            if displacement_down:
                for j in range(2, 7):
                    idx = i - j
                    if idx < 0: break
                    if df.iat[idx, cols['close']] > df.iat[idx, cols['open']]:
                        active_bear_obs.append({
                            'top': df.iat[idx, cols['high']], 'bottom': df.iat[idx, cols['low']],
                            'mid': (df.iat[idx, cols['high']] + df.iat[idx, cols['low']]) / 2,
                            'freshness': 1.0, 'retests': 0, 'created_at': i
                        })
                        break

            # 2. Update / Clean
            active_bull_obs = [ob for ob in active_bull_obs if curr_close >= ob['bottom']]
            active_bear_obs = [ob for ob in active_bear_obs if curr_close <= ob['top']]

            for ob in active_bull_obs:
                if curr_low <= ob['top'] and curr_low > ob['bottom']:
                    if ob['retests'] < 3:
                        ob['retests'] += 1
                        ob['freshness'] -= 0.25
            
            for ob in active_bear_obs:
                if curr_high >= ob['bottom'] and curr_high < ob['top']:
                    if ob['retests'] < 3:
                        ob['retests'] += 1
                        ob['freshness'] -= 0.25

            active_bull_obs = [ob for ob in active_bull_obs if ob['retests'] < 3]
            active_bear_obs = [ob for ob in active_bear_obs if ob['retests'] < 3]

            # 3. Proximity
            prox = atr * 1.5
            if active_bull_obs:
                closest = min(active_bull_obs, key=lambda x: abs(curr_close - x['mid']))
                if abs(curr_close - closest['mid']) <= prox:
                    df.iat[i, cols['ob_bullish_present']] = 1
                    df.iat[i, cols['ob_freshness_score']] = closest['freshness']
                    df.iat[i, cols['ob_distance_norm']] = (curr_close - closest['mid']) / atr

            if active_bear_obs:
                closest = min(active_bear_obs, key=lambda x: abs(curr_close - x['mid']))
                if abs(curr_close - closest['mid']) <= prox:
                    df.iat[i, cols['ob_bearish_present']] = 1
                    df.iat[i, cols['ob_freshness_score']] = max(df.iat[i, cols['ob_freshness_score']], closest['freshness'])
                    df.iat[i, cols['ob_distance_norm']] = (curr_close - closest['mid']) / atr

            df.iat[i, cols['ob_confluence_count']] = len([ob for ob in active_bull_obs + active_bear_obs if abs(curr_close - ob['mid']) <= prox * 2])

        return df

        return df
