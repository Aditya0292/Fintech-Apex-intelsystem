
import pandas as pd
from pathlib import Path
import logging
from src.data.providers.factory import ProviderFactory

logger = logging.getLogger(__name__)

# Standard APEX Heartbeat configuration
# Each provider maps these to their internal constants
TIMEFRAME_CONFIG = {
    '1d':  {'candles': 500,  'refresh_sec': 86400},
    '4h':  {'candles': 500,  'refresh_sec': 14400},
    '1h':  {'candles': 500,  'refresh_sec': 3600},
    '30m': {'candles': 500,  'refresh_sec': 1800},
    '5m':  {'candles': 500,  'refresh_sec': 300},
}

class MTFCandleFetcher:
    """
    High-level Candle Fetcher. 
    Uses the ProviderFactory to fetch data from MT5, YFinance, or other sources.
    """
    def __init__(self):
        self.provider = ProviderFactory.get_provider()
        self.data_dir = Path('data/prices')
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def fetch_all(self, assets=None):
        if assets is None:
            assets = ['XAUUSD']
        
        total = 0

        for asset in assets:
            # Map standard symbol to provider-specific symbol (e.g. XAUUSD -> GC=F)
            provider_symbol = ProviderFactory.get_symbol_map(asset)

            for tf_name, cfg in TIMEFRAME_CONFIG.items():
                logger.info(f"Fetching {asset} ({provider_symbol}) @ {tf_name} using {self.provider.__class__.__name__}")
                
                df = self.provider.fetch_ohlcv(
                    symbol=provider_symbol, 
                    timeframe=tf_name, 
                    candles=cfg['candles']
                )

                if df is not None and not df.empty:
                    # Save as parquet for fast access
                    out_path = self.data_dir / f"{asset}_{tf_name}.parquet"
                    df.to_parquet(out_path)
                    
                    # Also save as CSV for legacy tools compatibility
                    csv_path = Path('data') / f"{asset}_{tf_name}.csv"
                    df.to_csv(csv_path, index=False)
                    
                    total += len(df)
                else:
                    logger.warning(f"Failed to fetch {asset} {tf_name} from {self.provider.__class__.__name__}")
        
        return total
