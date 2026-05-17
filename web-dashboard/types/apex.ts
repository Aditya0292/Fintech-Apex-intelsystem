export interface AssetTick {
  symbol: string;
  price: number;
  change: number; // Positive or negative indicating direction
}

export interface NewsEvent {
  id: string;
  timestamp: string; // ISO string
  headline: string;
  impact: 'HIGH' | 'MED' | 'LOW';
  decay?: number; // Added client-side
}

export interface SMCZone {
  y1: number;
  y2: number;
  label?: string;
  status?: 'active' | 'warning' | 'inactive';
}

export interface ConsensusResult {
  asset: string;
  aligned: number;
  total: number;
  direction: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;
}

export interface RiskParams {
  kelly: number;
  lotSize: number;
  atr: number;
  stopLevel: number;
  targetLevel: number;
  maxRisk: string; // e.g., "1.0% acct"
}

export interface SignalData {
  asset: string;
  signal: 'BUY' | 'SELL' | 'WAIT';
  entry: number;
  tp: number;
  sl: number;
  rr: string;
  confidence: number;
}

export interface NewsCombatStatus {
  is_monitoring: boolean;
  combat_mode: boolean;
  active_event?: {
    title: string;
    country: string;
    date: string;
    impact: string;
  };
  last_results?: Record<string, {
    actual: string;
    bias: string;
    time: string;
  }>;
  updated_at: string;
}
