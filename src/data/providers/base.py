
from abc import ABC, abstractmethod
import pandas as pd
from typing import List, Optional

class BaseProvider(ABC):
    """
    Abstract interface for all APEX Data Providers.
    Any new data source (ActiveTick, Oanda, IBKR) must implement this.
    """

    @abstractmethod
    def fetch_ohlcv(self, symbol: str, timeframe: str, candles: int) -> Optional[pd.DataFrame]:
        """
        Fetches OHLCV data for a single symbol/timeframe.
        Returns a DataFrame with columns: ['time', 'open', 'high', 'low', 'close', 'tick_volume']
        """
        pass

    @abstractmethod
    def validate_connection(self) -> bool:
        """
        Checks if the provider is active and ready (e.g. MT5 initialized, API key valid).
        """
        pass
