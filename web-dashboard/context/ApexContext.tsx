"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface TradeSetup {
  symbol: string;
  bias: "BULLISH" | "BEARISH" | "NEUTRAL";
  confidence: number;
  rr: string;
  timeframe: string;
}

interface AssetBias {
  symbol: string;
  bias: "BULLISH" | "BEARISH" | "NEUTRAL";
  change: number;
  price: number;
}

interface AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  connected: boolean;
  broker: string;
}

interface OpenPosition {
  ticket: number;
  symbol: string;
  type: "BUY" | "SELL";
  lots: number;
  openPrice: number;
  sl: number;
  tp: number;
  profit: number;
  openTime: string;
}

export type ActiveTab = "dashboard" | "world" | "risk" | "ledger" | "execution" | "opps" | "flow" | "analytics";

interface ApexState {
  setups: TradeSetup[];
  biases: AssetBias[];
  activeSymbol: string;
  setActiveSymbol: (s: string) => void;
  newsImpact: number;
  newsSentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  accountInfo: AccountInfo;
  openPositions: OpenPosition[];
}

const ApexContext = createContext<ApexState | undefined>(undefined);

export function ApexProvider({ children }: { children: React.ReactNode }) {
  const [activeSymbol, setActiveSymbol] = useState("XAUUSD");
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");

  // Mock Data for initial design verification
  const [setups] = useState<TradeSetup[]>([
    { symbol: "XAUUSD", bias: "BULLISH", confidence: 88, rr: "1:3.2", timeframe: "1H" },
    { symbol: "EURUSD", bias: "BEARISH", confidence: 72, rr: "1:2.5", timeframe: "15M" },
    { symbol: "GBPUSD", bias: "BULLISH", confidence: 65, rr: "1:4.1", timeframe: "4H" },
    { symbol: "USDJPY", bias: "NEUTRAL", confidence: 45, rr: "1:1.8", timeframe: "1H" },
  ]);

  const [biases] = useState<AssetBias[]>([
    { symbol: "XAUUSD", bias: "BULLISH", change: 0.24, price: 2154.20 },
    { symbol: "EURUSD", bias: "BEARISH", change: -0.12, price: 1.0842 },
    { symbol: "GBPUSD", bias: "BULLISH", change: 0.08, price: 1.2654 },
    { symbol: "USDJPY", bias: "NEUTRAL", change: 0.02, price: 149.23 },
  ]);

  const [accountInfo] = useState<AccountInfo>({
    balance: 10000.00,
    equity: 10247.50,
    margin: 312.00,
    freeMargin: 9935.50,
    leverage: 100,
    connected: false, // Will be true when MT5 is live
    broker: "OANDA",
  });

  const [openPositions] = useState<OpenPosition[]>([
    { ticket: 2026001, symbol: "XAUUSD", type: "BUY", lots: 0.08, openPrice: 2148.30, sl: 2138.00, tp: 2175.00, profit: 47.52, openTime: "2026-03-27 14:22" },
    { ticket: 2026002, symbol: "GBPUSD", type: "BUY", lots: 0.05, openPrice: 1.2640, sl: 1.2590, tp: 1.2750, profit: 7.00, openTime: "2026-03-27 16:45" },
  ]);

  return (
    <ApexContext.Provider value={{
      setups,
      biases,
      activeSymbol,
      setActiveSymbol,
      newsImpact: 78,
      newsSentiment: "POSITIVE",
      activeTab,
      setActiveTab,
      accountInfo,
      openPositions,
    }}>
      {children}
    </ApexContext.Provider>
  );
}

export function useApex() {
  const context = useContext(ApexContext);
  if (!context) throw new Error("useApex must be used within ApexProvider");
  return context;
}
