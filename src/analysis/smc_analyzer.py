import pandas as pd
import numpy as np
from typing import Dict, List, Optional

class SMCAnalyzer:
    """
    SMC Analyzer - Ported from LuxAlgo Smart Money Concepts (Pinescript).
    Implements:
    - Swing Highs/Lows (ZigZag based on length)
    - Internal & Swing Structure (BOS / CHoCH)
    - Order Blocks (Origin of BOS)
    - Fair Value Gaps (3-candle pattern)
    - Liquidity Sweeps
    
    Timeframe-Specific Analysis Windows:
    - 1H: 150 candles
    - 4H: 200 candles
    - Daily: 120 candles
    """
    
    # Lookback windows per timeframe
    LOOKBACK_WINDOWS = {
        "1h": 150, "1 hour": 150,
        "4h": 200, "4 hour": 200,
        "daily": 120, "d1": 120
    }
    
    def __init__(self, df: pd.DataFrame, timeframe: str = "4h", symbol: str = "XAUUSD"):
        """
        Initialize SMC Analyzer with timeframe-specific lookback window.
        """
        self.timeframe = timeframe.lower()
        self.symbol = symbol
        self.df = df.copy()
        
        from src.utils.config_loader import config
        assets_conf = config.get('assets', {}).get(symbol, {})
        
        # Determine Window:
        # 1. Config override (smc_window)
        # 2. Timeframe default
        
        base_window = assets_conf.get('smc_window', 500)
        tf_window = self.LOOKBACK_WINDOWS.get(self.timeframe, 200)
        
        # Use the larger of the two to ensure enough context
        window_size = max(base_window, tf_window)
        
        if 'time' not in self.df.columns:
            self.df['time'] = self.df.index
            
        cols = ['open', 'high', 'low', 'close']
        for c in cols:
            self.df[c] = self.df[c].astype(float)
            
        self.df = self.df.reset_index(drop=True)
        
        # Apply timeframe-specific window
        if len(self.df) > window_size:
            self.df = self.df.iloc[-window_size:].reset_index(drop=True)

    def _get_swing_points(self, length: int = 50):
        """
        Detect Swing Highs and Lows using a rolling window.
        """
        df = self.df
        highs = df['high']
        lows = df['low']
        
        window = 2 * length + 1
        
        df['is_swing_high'] = (highs == highs.rolling(window, center=True).max())
        df['is_swing_low'] = (lows == lows.rolling(window, center=True).min())
        
        swings = []
        for i in range(len(df)):
            if df.iat[i, df.columns.get_loc('is_swing_high')]:
                swings.append({'index': i, 'price': df.iat[i, df.columns.get_loc('high')], 'type': 'high'})
            elif df.iat[i, df.columns.get_loc('is_swing_low')]:
                swings.append({'index': i, 'price': df.iat[i, df.columns.get_loc('low')], 'type': 'low'})
                
        return swings

    def find_structure_and_blocks(self):
        """
        Find Order Blocks (OB), Liquidity Sweeps, and FVGs.
        """
        df = self.df
        
        # 1. Structure Breaks (BOS)
        # Get swings
        swings = self._get_swing_points(length=10)
        swing_highs = [s for s in swings if s['type'] == 'high']
        swing_lows = [s for s in swings if s['type'] == 'low']
        
        # Identify BOS
        obs = []
        
        # Bullish BOS: Price closes above a previous Swing High
        last_s_high = None
        for i in range(len(df)):
            close = df.iat[i, df.columns.get_loc('close')]
            current_s_highs = [s for s in swing_highs if s['index'] < i]
            if current_s_highs:
                candidate = current_s_highs[-1]
                if last_s_high != candidate['index']:
                    last_s_high = candidate['index']
                if close > candidate['price']: # Breakout
                    subset = df.iloc[candidate['index']:i+1]
                    lowest_idx = subset['low'].idxmin()
                    if not any(o['index'] == lowest_idx for o in obs):
                        ob_row = df.loc[lowest_idx]
                        obs.append({
                            'type': 'bullish',
                            'top': ob_row['high'],
                            'bottom': ob_row['low'],
                            'index': lowest_idx,
                            'time': ob_row['time'],
                            'mitigated': False,
                            'broken': False,
                            'strength': 1
                        })
                        
        # Bearish BOS
        last_s_low = None
        for i in range(len(df)):
            close = df.iat[i, df.columns.get_loc('close')]
            current_s_lows = [s for s in swing_lows if s['index'] < i]
            if current_s_lows:
                candidate = current_s_lows[-1]
                if close < candidate['price']:
                    subset = df.iloc[candidate['index']:i+1]
                    highest_idx = subset['high'].idxmax()
                    if not any(o['index'] == highest_idx for o in obs):
                        ob_row = df.loc[highest_idx]
                        obs.append({
                            'type': 'bearish',
                            'top': ob_row['high'],
                            'bottom': ob_row['low'],
                            'index': highest_idx,
                            'time': ob_row['time'],
                            'mitigated': False,
                            'broken': False,
                            'strength': 1
                        })
                        
        # Filter Active OBs
        final_obs = []
        for ob in obs:
            future_df = df.iloc[ob['index']+1:]
            if future_df.empty: 
                final_obs.append(ob)
                continue
                
            broken = False
            touched = False
            
            if ob['type'] == 'bullish':
                if (future_df['close'] < ob['bottom']).any():
                    broken = True
                if (future_df['low'] <= ob['top']).any():
                    touched = True
            else:
                if (future_df['close'] > ob['top']).any():
                    broken = True
                if (future_df['high'] >= ob['bottom']).any():
                    touched = True
            
            if not broken:
                ob['mitigated'] = touched
                final_obs.append(ob)
                
        return final_obs

    def find_fvgs(self):
        """
        Find Fair Value Gaps.
        """
        df = self.df
        fvgs = []
        
        for i in range(2, len(df)):
            if df.iloc[i]['low'] > df.iloc[i-2]['high']:
                gap = df.iloc[i]['low'] - df.iloc[i-2]['high']
                if gap > (df.iloc[i]['close'] * 0.0002):
                    fvgs.append({
                        'type': 'bullish',
                        'top': df.iloc[i]['low'],
                        'bottom': df.iloc[i-2]['high'],
                        'index': i,
                        'time': df.iloc[i]['time'],
                        'mitigated': False
                    })
            if df.iloc[i]['high'] < df.iloc[i-2]['low']:
                gap = df.iloc[i-2]['low'] - df.iloc[i]['high']
                if gap > (df.iloc[i]['close'] * 0.0002):
                    fvgs.append({
                        'type': 'bearish',
                        'top': df.iloc[i-2]['low'],
                        'bottom': df.iloc[i]['high'],
                        'index': i,
                        'time': df.iloc[i]['time'],
                        'mitigated': False
                    })
                    
        active_fvgs = []
        for fvg in fvgs:
            future = df.iloc[fvg['index']+1:]
            if future.empty:
                active_fvgs.append(fvg)
                continue
            mitigated = False
            if fvg['type'] == 'bullish':
                if (future['low'] <= fvg['bottom']).any():
                    mitigated = True
            else:
                if (future['high'] >= fvg['top']).any():
                    mitigated = True
            if not mitigated:
                active_fvgs.append(fvg)
        return active_fvgs

    def find_liquidity(self):
        """
        Identify Liquidity Pools (Swing levels not yet swept).
        """
        swings = self._get_swing_points(length=10)
        df = self.df
        bsl = [] # Buy Side Liquidity
        ssl = [] # Sell Side Liquidity
        for s in swings:
            future = df.iloc[s['index']+1:]
            if future.empty: 
                if s['type'] == 'high': bsl.append(s)
                else: ssl.append(s)
                continue
            swept = False
            if s['type'] == 'high':
                if (future['high'] > s['price']).any(): swept = True
            else:
                if (future['low'] < s['price']).any(): swept = True
            if not swept:
                if s['type'] == 'high': bsl.append(s)
                else: ssl.append(s)
        return {
            'bsl': [{'price': s['price'], 'time': df.iloc[s['index']]['time']} for s in bsl],
            'ssl': [{'price': s['price'], 'time': df.iloc[s['index']]['time']} for s in ssl]
        }

    def get_nearest_structures(self, current_price: float):
        """
        Get nearest OBs and FVGs to current price.
        """
        obs = self.find_structure_and_blocks()
        fvgs = self.find_fvgs()
        liq = self.find_liquidity()
        
        bull_obs = [o for o in obs if o['type'] == 'bullish']
        bull_obs.sort(key=lambda x: x['top'], reverse=True)
        valid_bull = [o for o in bull_obs if o['bottom'] < current_price] 
        
        bear_obs = [o for o in obs if o['type'] == 'bearish']
        bear_obs.sort(key=lambda x: x['bottom'])
        valid_bear = [o for o in bear_obs if o['top'] > current_price]
        
        return {
            'bull_obs_found': valid_bull[:3],
            'bear_obs_found': valid_bear[:3],
            'support_ob': valid_bull[0] if valid_bull else None,
            'resistance_ob': valid_bear[0] if valid_bear else None,
            'fvgs': fvgs,
            'liquidity': liq
        }
