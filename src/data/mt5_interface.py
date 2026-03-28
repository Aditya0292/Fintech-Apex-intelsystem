import MetaTrader5 as mt5
import time
from typing import Dict, Optional

class MT5Interface:
    """
    Connects to MetaTrader 5 (MT5) Terminal for Real-Time Data.
    Requires MT5 Terminal to be installed and running.
    """
    
    def __init__(self):
        self.connected = False
        
    def connect(self) -> bool:
        if not mt5.initialize():
            print(f"MT5 Init Failed: {mt5.last_error()}")
            return False
            
        self.connected = True
        return True
        
    def get_live_price(self, symbol: str = "XAUUSD") -> Optional[float]:
        """
        Get the exact live Tick Price (Mid Price)
        Mid = (Bid + Ask) / 2
        Matches TradingView.
        """
        if not self.connected:
            if not self.connect():
                return None
        
        # Check symbol
        # Sometimes it's XAUUSD, XAUUSD.a, GOLD, etc.
        # We try strict match first, then search
        tick = mt5.symbol_info_tick(symbol)
        
        if tick is None:
            # Try finding a matching symbol
            all_symbols = mt5.symbols_get()
            candidates = [s.name for s in all_symbols if "XAU" in s.name or "GOLD" in s.name]
            
            if candidates:
                # Use first candidate
                symbol = candidates[0]
                tick = mt5.symbol_info_tick(symbol)
            else:
                print(f"MT5 Warning: Symbol {symbol} not found.")
                return None
                
        if tick:
            mid_price = (tick.bid + tick.ask) / 2
            return mid_price
        
        return None

    def get_historical_data(self, symbol: str = "XAUUSD", timeframe: int = mt5.TIMEFRAME_H4, num_candles: int = 1000):
        """
        Fetch historical candles from MT5.
        Returns a DataFrame compatible with SMC Analyzer.
        """
        import pandas as pd
        if not self.connected:
            if not self.connect():
                return None
                
        # Copy rates
        rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, num_candles)
        
        if rates is None or len(rates) == 0:
            print(f"MT5 Error: No rates found for {symbol}")
            return None
            
        # Convert to DataFrame
        df = pd.DataFrame(rates)
        df['time'] = pd.to_datetime(df['time'], unit='s')
        
        # Rename columns to match our standard (open, high, low, close only)
        # MT5 returns: time, open, high, low, close, tick_volume, spread, real_volume
        # We need lower case
        return df[['time', 'open', 'high', 'low', 'close', 'tick_volume']]

    def place_order(self, symbol: str, type: str, lot: float, sl: float = 0.0, tp: float = 0.0) -> bool:
        """
        Executes a Trade Order on MT5.
        type: 'BUY' or 'SELL'
        """
        if not self.connected:
            if not self.connect(): return False
            
        # Get price for order
        tick = mt5.symbol_info_tick(symbol)
        if not tick: 
            print(f"Error: Symbol {symbol} tick not found for order.")
            return False
            
        # Order Type Constants
        order_type = mt5.ORDER_TYPE_BUY if type == 'BUY' else mt5.ORDER_TYPE_SELL
        price = tick.ask if type == 'BUY' else tick.bid
        
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": lot,
            "type": order_type,
            "price": price,
            "sl": float(sl),
            "tp": float(tp),
            "deviation": 20,
            "magic": 2026,
            "comment": "Apex AI Signal",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        
        # Send
        result = mt5.order_send(request)
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            print(f"Order failed: {result.retcode} | {result.comment}")
            return False
            
        print(f"[{type}] Order Placed - Symbol: {symbol}, Lots: {lot}, Price: {price}")
        return True

    def get_open_positions(self, symbol: Optional[str] = None):
        """
        Retrieves all open positions.
        """
        if not self.connected:
            if not self.connect(): return []
            
        positions = mt5.positions_get(symbol=symbol) if symbol else mt5.positions_get()
        return positions if positions else []

    def close_all_positions(self, symbol: Optional[str] = None):
        """
        Safely closes all open positions for a symbol.
        """
        positions = self.get_open_positions(symbol)
        for pos in positions:
            tick = mt5.symbol_info_tick(pos.symbol)
            type_close = mt5.ORDER_TYPE_SELL if pos.type == mt5.ORDER_TYPE_BUY else mt5.ORDER_TYPE_BUY
            price_close = tick.bid if pos.type == mt5.ORDER_TYPE_BUY else tick.ask
            
            request = {
                "action": mt5.TRADE_ACTION_DEAL,
                "symbol": pos.symbol,
                "volume": pos.volume,
                "type": type_close,
                "position": pos.ticket,
                "price": price_close,
                "deviation": 20,
                "magic": 2026,
                "comment": "Apex Emergency Close",
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_IOC,
            }
            mt5.order_send(request)
        
        print(f"Closed {len(positions)} positions.")

    def shutdown(self):
        mt5.shutdown()
        self.connected = False

if __name__ == "__main__":
    mt = MT5Interface()
    if mt.connect():
        print("Connected to MT5")
        price = mt.get_live_price("XAUUSD")
        if price:
            print(f"Live Mid Price: {price}")
        mt.shutdown()
    else:
        print("Could not connect to MT5. Ensure Terminal is installed.")
