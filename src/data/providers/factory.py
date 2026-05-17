
import logging
from src.data.providers.mt5_provider import MT5Provider
from src.data.providers.yfinance_provider import YFinanceProvider
from src.utils.config_loader import config

logger = logging.getLogger(__name__)

class ProviderFactory:
    """
    Returns the correct data provider based on configuration.
    """

    _cached_provider = None

    @classmethod
    def get_provider(cls):
        if cls._cached_provider:
            return cls._cached_provider

        data_cfg = config.get('data', {})
        provider_name = data_cfg.get('active_provider', 'mt5').lower()

        logger.info(f"Initializing Data Provider: {provider_name}")

        if provider_name == 'mt5':
            cls._cached_provider = MT5Provider()
        elif provider_name == 'yfinance':
            cls._cached_provider = YFinanceProvider()
        else:
            logger.warning(f"Unknown provider '{provider_name}'. Falling back to MT5.")
            cls._cached_provider = MT5Provider()

        return cls._cached_provider

    @classmethod
    def get_symbol_map(cls, symbol: str) -> str:
        """
        Maps a standard symbol (e.g. XAUUSD) to the provider-specific ticker.
        """
        data_cfg = config.get('data', {})
        symbol_map = data_cfg.get('symbol_map', {})
        provider_name = data_cfg.get('active_provider', 'mt5').lower()
        
        # If mapping exists for this provider, use it
        return symbol_map.get(symbol, symbol)
