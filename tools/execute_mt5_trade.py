#!/usr/bin/env python3
"""
MT5 Trade Execution Bridge
Called by Next.js API route to place trades via MetaTrader 5 terminal.
Usage: python execute_mt5_trade.py --symbol XAUUSD --type BUY --lot 0.08 --sl 2138 --tp 2175
"""
import argparse
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

try:
    from src.data.mt5_interface import MT5Interface
except ImportError:
    print("ERROR: Could not import MT5Interface. Ensure MetaTrader5 package is installed.")
    sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Execute MT5 Trade")
    parser.add_argument("--symbol",  type=str,   required=True, help="Symbol, e.g. XAUUSD")
    parser.add_argument("--type",    type=str,   required=True, choices=["BUY", "SELL"], help="Order type")
    parser.add_argument("--lot",     type=float, required=True, help="Lot size, e.g. 0.08")
    parser.add_argument("--sl",      type=float, default=0.0,   help="Stop Loss price")
    parser.add_argument("--tp",      type=float, default=0.0,   help="Take Profit price")
    args = parser.parse_args()

    mt = MT5Interface()
    if not mt.connect():
        print(f"FAILED: Could not connect to MT5 terminal. Ensure it is running.")
        sys.exit(1)

    success = mt.place_order(
        symbol=args.symbol,
        type=args.type,
        lot=args.lot,
        sl=args.sl,
        tp=args.tp,
    )
    mt.shutdown()

    if success:
        print(f"OK: {args.type} {args.lot} lots {args.symbol} | SL={args.sl} | TP={args.tp}")
        sys.exit(0)
    else:
        print(f"FAILED: Order rejected by broker.")
        sys.exit(1)

if __name__ == "__main__":
    main()
