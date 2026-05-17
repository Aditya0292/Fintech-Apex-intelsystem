
import yfinance as yf
import pandas as pd
import logging
from typing import Optional
from src.data.providers.base import BaseProvider

logger = logging.getLogger(__name__)

# Map internal timeframe strings to yfinance intervals
YF_INTERVALS = {
    '1d':  '1d',
    '1h':  '1h',
    '30m': '30m',
    '15m': '15m',
    '5m':  '5m',
}

class YFinanceProvider(BaseProvider):
    """
    Free Public Data Provider using yfinance.
    Does NOT require a desktop terminal or API keys.
    """

    def validate_connection(self) -> bool:
        # yfinance is stateless/HTTP, so we just return True
        return True

    def fetch_ohlcv(self, symbol: str, timeframe: str, candles: int) -> Optional[pd.DataFrame]:
        # yfinance does not support 4h natively, we must fetch 1h and resample
        target_tf = timeframe
        fetch_tf = YF_INTERVALS.get(timeframe)
        
        if timeframe == '4h':
            fetch_tf = '1h'
            
        if fetch_tf is None:
            logger.error(f"Unsupported yfinance timeframe: {timeframe}")
            return None

        # Determine period based on candle count and interval
        if timeframe == '1d': period = '2y'
        elif timeframe == '4h' or timeframe == '1h': period = '1mo'
        else: period = '7d'

        ticker = yf.Ticker(symbol)
        try:
            df = ticker.history(period=period, interval=fetch_tf)
            if df.empty:
                logger.warning(f"No yfinance data for {symbol} @ {fetch_tf}")
                return None
            
            # Resample if 4h is requested
            if target_tf == '4h':
                df = df.resample('4H').agg({
                    'Open': 'first',
                    'High': 'max',
                    'Low': 'min',
                    'Close': 'last',
                    'Volume': 'sum'
                }).dropna()

            # Match the APEX standard column format
            df = df.reset_index()
            df = df.rename(columns={
                'Datetime': 'time',
                'Date':     'time',
                'Open':     'open',
                'High':     'high',
                'Low':      'low',
                'Close':    'close',
                'Volume':   'volume'
            })
            
            # Ensure 'time' is datetime
            df['time'] = pd.to_datetime(df['time']).dt.tz_localize(None)
            
            return df[['time', 'open', 'high', 'low', 'close', 'volume']].tail(candles)
        except Exception as e:
            logger.error(f"YFinance fetch failed for {symbol}: {e}")
            return None
