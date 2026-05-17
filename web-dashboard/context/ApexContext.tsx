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

export type ActiveTab = "dashboard" | "world" | "risk" | "ledger" | "execution" | "opps" | "smc" | "analytics";

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
  liveData: any; // Store the full raw JSON for deep components
  isScanning: boolean;
  triggerScan: () => Promise<void>;
  triggerCSMRefresh: () => Promise<void>;
  scanInterval: number;
  setScanInterval: (mins: number) => void;
  isAutoScanEnabled: boolean;
  setIsAutoScanEnabled: (enabled: boolean) => void;
}

const ApexContext = createContext<ApexState | undefined>(undefined);

export function ApexProvider({ children }: { children: React.ReactNode }) {
  const [activeSymbol, setActiveSymbol] = useState("XAUUSD");
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");

  // State
  const [setups, setSetups] = useState<TradeSetup[]>([]);
  const [biases, setBiases] = useState<AssetBias[]>([]);
  const [liveData, setLiveData] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanInterval, setScanInterval] = useState(5); // Default 5 mins
  const [isAutoScanEnabled, setIsAutoScanEnabled] = useState(true);
  
  const fetchLivePredictions = async () => {
    try {
      const res = await fetch("/api/predict_all");
      if (!res.ok) return;
      
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Failed to fetch live Apex data:", err);
      return null;
    }
  };

  const updateStateFromData = (data: any) => {
    if (!data || !data.assets) return;
    
    setLiveData(data); // Store full payload
    const newSetups: TradeSetup[] = [];
    const newBiases: AssetBias[] = [];
    
    Object.entries(data.assets).forEach(([sym, assetData]: [string, any]) => {
      const dec = assetData.decision || {};
      const bias = dec.decision === 'WAIT' ? 'NEUTRAL' : (dec.decision === 'LONG' || dec.decision === 'BUY' ? 'BULLISH' : 'BEARISH');
      const conf = dec.net_confidence ? Math.round(dec.net_confidence * 100) : 0;
      
      newSetups.push({
        symbol: sym,
        bias: bias,
        confidence: conf,
        rr: "1:2.0", 
        timeframe: "1H"
      });
      
      newBiases.push({
        symbol: sym,
        bias: bias,
        change: conf > 50 ? 0.1 : -0.1, 
        price: 0 
      });
    });
    
    setSetups(newSetups);
    setBiases(newBiases);
  };

  useEffect(() => {
    let isMounted = true;
    const runCycle = async () => {
      const data = await fetchLivePredictions();
      if (isMounted) updateStateFromData(data);
    };

    runCycle();
    const interval = setInterval(runCycle, 10000); // Poll every 10s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Automatic Scan Interval
  useEffect(() => {
    if (scanInterval <= 0 || !isAutoScanEnabled) return;
    
    console.log(`Setting up Tactical Pulse: Auto-Scan every ${scanInterval} minutes.`);
    const intervalId = setInterval(() => {
      console.log(`[Tactical Pulse] Triggering scheduled scan...`);
      triggerScan();
    }, scanInterval * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [scanInterval, isAutoScanEnabled]);

  const triggerScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    
    // Remember the old timestamp to detect when the scan finishes
    const oldTimestamp = liveData?.generated_at;

    try {
      const res = await fetch("/api/scan", { method: "POST" });
      if (res.ok) {
        // Polling loop to wait for new data (max 3 mins)
        let attempts = 0;
        const checkNewData = setInterval(async () => {
          attempts++;
          const freshData = await fetchLivePredictions();
          
          if (freshData && freshData.generated_at !== oldTimestamp) {
            updateStateFromData(freshData);
            setIsScanning(false);
            clearInterval(checkNewData);
          }

          if (attempts > 30) { // Timeout after 5 mins (10s * 30)
            setIsScanning(false);
            clearInterval(checkNewData);
          }
        }, 10000); 
      } else {
        setIsScanning(false);
      }
    } catch (err) {
      console.error("Scan trigger failed:", err);
      setIsScanning(false);
    }
  };

  const triggerCSMRefresh = async () => {
    try {
      const res = await fetch("/api/csm/refresh", { method: "POST" });
      if (res.ok) {
        // Fetch new state immediately
        const freshData = await fetchLivePredictions();
        if (freshData) updateStateFromData(freshData);
      }
    } catch (err) {
      console.error("CSM refresh failed:", err);
    }
  };

  const [accountInfo] = useState<AccountInfo>({
    balance: 10000.00,
    equity: 10247.50,
    margin: 312.00,
    freeMargin: 9935.50,
    leverage: 100,
    connected: true, 
    broker: "APEX MT5 DAEMON",
  });

  const [openPositions] = useState<OpenPosition[]>([]);

  return (
    <ApexContext.Provider value={{
      setups,
      biases,
      activeSymbol,
      setActiveSymbol,
      newsImpact: 78,
      newsSentiment: "NEUTRAL",
      activeTab,
      setActiveTab,
      accountInfo,
      openPositions,
      liveData,
      isScanning,
      triggerScan,
      triggerCSMRefresh,
      scanInterval,
      setScanInterval,
      isAutoScanEnabled,
      setIsAutoScanEnabled,
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
