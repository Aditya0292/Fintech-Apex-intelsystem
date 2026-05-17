
import pandas as pd
import numpy as np
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class ConfluenceScorer:
    """
    Module 6: SMC Confluence Scorer (Institutional Grade)
    
    Synthesizes all SMC signals into a joint probability score.
    
    Weights (per user specification):
    - OB: 0.25
    - FVG (Active + Non-filled): 0.20
    - Sweep (Recent + Confirmed): 0.20
    - BOS (Trend alignment): 0.15
    - Premium/Discount: 0.10
    - HTF Alignment (Logic anchor): 0.05
    - Liquidity Target: 0.05
    """

    def __init__(self, weights: Optional[Dict[str, float]] = None):
        self.weights = weights or {
            'ob': 0.25,
            'fvg': 0.20,
            'sweep': 0.20,
            'bos': 0.15,
            'premium_discount': 0.10,
            'htf': 0.05,
            'liq': 0.05
        }

    def calculate(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculates joint confluence scores: C_long, C_short, C_net.
        Expects all SMC features to be present in df.
        """
        df = df.copy()
        
        # 1. Bullish Confluence (C_long)
        c_long = (
            self.weights['ob'] * df['ob_bullish_present'] * df['ob_freshness_score'] +
            self.weights['fvg'] * df['fvg_bullish_active'] * (1.0 - df['fvg_fill_pct']) +
            self.weights['sweep'] * df['sweep_detected'] * (df['sweep_direction'] == -1).astype(int) +
            self.weights['bos'] * df['bos_confirmed'] * (df['structure_state'] == 1).astype(int) +
            self.weights['premium_discount'] * (df['premium_discount'] < -0.3).astype(int) +
            self.weights['liq'] * df['liq_pool_below_present'] * df['liq_as_target']
        ).fillna(0.0)

        # 2. Bearish Confluence (C_short)
        c_short = (
            self.weights['ob'] * df['ob_bearish_present'] * df['ob_freshness_score'] +
            self.weights['fvg'] * df['fvg_bearish_active'] * (1.0 - df['fvg_fill_pct']) +
            self.weights['sweep'] * df['sweep_detected'] * (df['sweep_direction'] == 1).astype(int) +
            self.weights['bos'] * df['bos_confirmed'] * (df['structure_state'] == -1).astype(int) +
            self.weights['premium_discount'] * (df['premium_discount'] > 0.3).astype(int) +
            self.weights['liq'] * df['liq_pool_above_present'] * df['liq_as_target']
        ).fillna(0.0)

        # 3. Final Features (Module 7 naming convention)
        df['smc_confluence_long'] = c_long
        df['smc_confluence_short'] = c_short
        df['smc_confluence_net'] = c_long - c_short
        df['smc_setup_quality'] = df[['smc_confluence_long', 'smc_confluence_short']].max(axis=1)
        
        # Conflict Detection: If both long and short have high confluence (>0.3 each)
        df['smc_conflict'] = ((df['smc_confluence_long'] > 0.3) & (df['smc_confluence_short'] > 0.3)).astype(int)

        return df
