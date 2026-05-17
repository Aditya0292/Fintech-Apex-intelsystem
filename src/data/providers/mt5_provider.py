
import MetaTrader5 as mt5
import pandas as pd
import logging
import time
from typing import Optional
from src.data.providers.base import BaseProvider

logger = logging.getLogger(__name__)

# Map internal timeframe strings to MT5 constants
MT5_TIMEFRAMES = {
    '1d':  mt5.TIMEFRAME_D1,
    '4h':  mt5.TIMEFRAME_H4,
    '1h':  mt5.TIMEFRAME_H1,
    '30m': mt5.TIMEFRAME_M30,
    '15m': mt5.TIMEFRAME_M15,
    '5m':  mt5.TIMEFRAME_M5,
}

class MT5Provider(BaseProvider):
    """
    Standard MT5 Data Provider.
    Requires the MetaTrader 5 Desktop Terminal to be running.
    """

    def __init__(self, max_retries: int = 10, retry_delay: int = 5):
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self.connected = False
        self._initialize()

    def _initialize(self):
        for attempt in range(1, self.max_retries + 1):
            if mt5.initialize():
                self.connected = True
                logger.info(f"MT5 Provider initialized successfully.")
                return True
            
            err = mt5.last_error()
            logger.warning(f"MT5 initialization attempt {attempt} failed: {err}. Retrying in {self.retry_delay}s...")
            if attempt < self.max_retries:
                time.sleep(self.retry_delay)
        
        logger.error(f"MT5 Provider FATAL: All {self.max_retries} attempts failed.")
        return False

    def validate_connection(self) -> bool:
        if not self.connected:
            return self._initialize()
        return True

    def fetch_ohlcv(self, symbol: str, timeframe: str, candles: int) -> Optional[pd.DataFrame]:
        if not self.validate_connection():
            return None
        
        mt5_tf = MT5_TIMEFRAMES.get(timeframe)
        if mt5_tf is None:
            logger.error(f"Unsupported MT5 timeframe: {timeframe}")
            return None

        # Ensure symbol is visible
        if not mt5.symbol_select(symbol, True):
            logger.warning(f"Failed to select {symbol} in MT5 Market Watch")
            return None

        rates = mt5.copy_rates_from_pos(symbol, mt5_tf, 0, candles)
        if rates is not None and len(rates) > 0:
            df = pd.DataFrame(rates)
            df['time'] = pd.to_datetime(df['time'], unit='s')
            
            # Normalize column names to APEX standard
            df = df.rename(columns={
                'open': 'open',
                'high': 'high',
                'low':  'low',
                'close': 'close',
                'tick_volume': 'volume'
            })
            return df[['time', 'open', 'high', 'low', 'close', 'volume']]
        
        return None
