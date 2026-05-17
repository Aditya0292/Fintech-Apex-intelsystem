"use client";

import { useState, useEffect } from 'react';
import { SignalData, AssetTick, NewsEvent, RiskParams, SMCZone, ConsensusResult, NewsCombatStatus } from '../types/apex';
import { calcDecay } from '../utils/decay';

// DUMMY DATA FOR VISUALIZATION
const DUMMY_SIGNALS: SignalData[] = [
  { asset: 'XAUUSD', signal: 'BUY', entry: 2745.5, tp: 2770, sl: 2727, rr: '1:3.2', confidence: 85 },
  { asset: 'EURUSD', signal: 'WAIT', entry: 1.0945, tp: 1.0980, sl: 1.0920, rr: '1:1.5', confidence: 60 },
  { asset: 'USDJPY', signal: 'SELL', entry: 150.25, tp: 149.50, sl: 150.80, rr: '1:2.1', confidence: 78 },
  { asset: 'GBPUSD', signal: 'BUY', entry: 1.2650, tp: 1.2720, sl: 1.2610, rr: '1:2.5', confidence: 82 },
  { asset: 'US30', signal: 'SELL', entry: 42100.5, tp: 41900, sl: 42200, rr: '1:2.0', confidence: 71 },
  { asset: 'BTCUSD', signal: 'BUY', entry: 64500, tp: 68000, sl: 63000, rr: '1:3.5', confidence: 89 },
  { asset: 'AUDUSD', signal: 'WAIT', entry: 0.6540, tp: 0.6600, sl: 0.6500, rr: '1:1.2', confidence: 54 },
  { asset: 'USDCHF', signal: 'SELL', entry: 0.8845, tp: 0.8780, sl: 0.8890, rr: '1:1.8', confidence: 66 },
];

const DUMMY_NEWS: NewsEvent[] = [
  { id: '1', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), headline: 'Federal Reserve unlikley to cut rates before Q3, citing persistent inflation data.', impact: 'HIGH' },
  { id: '2', timestamp: new Date(Date.now() - 45 * 60000).toISOString(), headline: 'ECB board member suggests gradual normalization of balance sheet throughout year.', impact: 'MED' },
  { id: '3', timestamp: new Date(Date.now() - 180 * 60000).toISOString(), headline: 'US Retail Sales (MoM) actual 0.4% vs forecast 0.3%.', impact: 'LOW' },
];

export function useApexData() {
  const [signals, setSignals] = useState<SignalData[]>(DUMMY_SIGNALS);
  const [ticks, setTicks] = useState<AssetTick[]>([]);
  const [news, setNews] = useState<NewsEvent[]>([]);
  const [risk, setRisk] = useState<RiskParams>({ kelly: 0.23, lotSize: 0.08, atr: 18.2, stopLevel: 2727.3, targetLevel: 2770.0, maxRisk: '1.0% acct' });
  const [combatStatus, setCombatStatus] = useState<NewsCombatStatus | null>(null);

  // 1. Ticks polling (2s) simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setSignals(prev => prev.map(sig => {
        // Randomly fluctuate price by 0.1% for flash effect
        const change = (Math.random() - 0.5) * 0.001; 
        return {
          ...sig,
          entry: sig.entry * (1 + change)
        };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 2. Signals polling (30s - slower because ML is heavy)
  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await fetch('/api/predict_all?assets=all');
        const data = await response.json();
        
        if (data.assets) {
          const mappedSignals: SignalData[] = Object.keys(data.assets).map(symbol => {
            const asset = data.assets[symbol];
            const dec = asset.decision || {};
            // Find a representing timeframe for levels (e.g. 1 Hour)
            const mainTF = asset.predictions['1 Hour'] || asset.predictions['4 Hour'] || Object.values(asset.predictions)[0] as any;
            
            return {
              asset: symbol,
              signal: dec.decision || 'WAIT',
              entry: mainTF?.levels?.entry || 0,
              tp: mainTF?.levels?.tp || 0,
              sl: mainTF?.levels?.sl || 0,
              rr: '1:2.0', // Default or calc if possible
              confidence: Math.round((dec.net_confidence || 0) * 100)
            };
          });
          setSignals(mappedSignals);
        }

        if (data.market_context?.news) {
          const mappedNews: NewsEvent[] = data.market_context.news.map((n: any, i: number) => ({
            id: String(i),
            timestamp: n.time || new Date().toISOString(),
            headline: `${n.currency}: ${n.event} (${n.actual || 'N/A'} vs ${n.forecast || 'N/A'})`,
            impact: n.impact.toUpperCase() as 'HIGH' | 'MED' | 'LOW'
          }));
          setNews(mappedNews);
        }
      } catch (err) {
        console.error("Failed to fetch real-time signals:", err);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3. News & Decay processing (60s)
  useEffect(() => {
    const updateNewsDecay = () => {
      setNews(prev => {
        // Just calculate decay on dummy data for now
        const currentNews = prev.length ? prev : DUMMY_NEWS;
        return currentNews.map(item => ({
          ...item,
          decay: calcDecay(new Date(item.timestamp))
        }));
      });
    };

    updateNewsDecay(); // Initial run
    const interval = setInterval(updateNewsDecay, 60000);
    return () => clearInterval(interval);
  }, []);

  // 4. Combat Status polling (5s - critical window)
  useEffect(() => {
    const fetchCombat = async () => {
      try {
        const res = await fetch('/api/combat_status');
        const data = await res.json();
        setCombatStatus(data);
      } catch (e) {
        console.error("Combat fetch failed", e);
      }
    };
    fetchCombat();
    const interval = setInterval(fetchCombat, 5000);
    return () => clearInterval(interval);
  }, []);

  return { signals, ticks, news, risk, combatStatus };
}
