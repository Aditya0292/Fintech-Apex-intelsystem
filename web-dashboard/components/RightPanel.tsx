import React from 'react';
import NewsFeed from './NewsFeed';
import { useApexData } from '../hooks/useApexData';
import { useApex } from '../context/ApexContext';

interface PairDetailProps {
  asset: string;
  timeframes: { tf: string; signal: 'BUY' | 'SELL' | 'WAIT'; confidence: number }[];
}

function PairDetailCards({ asset, timeframes }: PairDetailProps) {
  return (
    <div className="bg-terminal-bg-panel border border-border rounded-[4px] p-3 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <span className="font-mono text-[11px] font-bold text-terminal-gold tracking-widest">{asset} DEPTH</span>
        <span className="font-mono text-[9px] text-text-muted uppercase">Multi-TF Consensus</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {timeframes.map(tf => {
          const color = tf.signal === 'BUY' ? 'text-terminal-green' : tf.signal === 'SELL' ? 'text-terminal-red' : 'text-terminal-amber';
          const borderColor = tf.signal === 'BUY' ? 'border-terminal-green/30' : tf.signal === 'SELL' ? 'border-terminal-red/30' : 'border-terminal-amber/30';
          return (
            <div key={tf.tf} className={`bg-terminal-bg-card border ${borderColor} rounded-[2px] p-2 flex flex-col items-center`}>
              <span className="font-mono text-[8px] text-text-muted mb-1">{tf.tf}</span>
              <span className={`font-mono text-[10px] font-bold ${color}`}>{tf.signal}</span>
              <div className="w-full h-[1.5px] bg-terminal-bg-track mt-1.5 opacity-30">
                <div className={`h-full ${color.replace('text-', 'bg-')}`} style={{ width: `${tf.confidence}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RightPanel() {
  const { news, combatStatus } = useApexData();
  const { activeSymbol, liveData } = useApex();

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
      
      {/* PAIR DEPTH (NEW SECTION) */}
      <div className="p-[14px] border-b border-border bg-terminal-bg-card/30">
        <PairDetailCards 
          asset={activeSymbol} 
          timeframes={[
            { tf: '15M', signal: liveData?.assets?.[activeSymbol]?.predictions?.['15 Minute']?.signal?.toUpperCase() || 'WAIT', confidence: liveData?.assets?.[activeSymbol]?.predictions?.['15 Minute']?.confidence ? Math.round(liveData.assets[activeSymbol].predictions['15 Minute'].confidence * 100) : 50 },
            { tf: 'H1', signal: liveData?.assets?.[activeSymbol]?.predictions?.['1 Hour']?.signal?.toUpperCase() || 'WAIT', confidence: liveData?.assets?.[activeSymbol]?.predictions?.['1 Hour']?.confidence ? Math.round(liveData.assets[activeSymbol].predictions['1 Hour'].confidence * 100) : 50 },
            { tf: 'H4', signal: liveData?.assets?.[activeSymbol]?.predictions?.['4 Hour']?.signal?.toUpperCase() || 'WAIT', confidence: liveData?.assets?.[activeSymbol]?.predictions?.['4 Hour']?.confidence ? Math.round(liveData.assets[activeSymbol].predictions['4 Hour'].confidence * 100) : 50 },
            { tf: 'D1', signal: liveData?.assets?.[activeSymbol]?.predictions?.['Daily']?.signal?.toUpperCase() || 'WAIT', confidence: liveData?.assets?.[activeSymbol]?.predictions?.['Daily']?.confidence ? Math.round(liveData.assets[activeSymbol].predictions['Daily'].confidence * 100) : 50 },
          ]}
        />
      </div>
      <div className="p-[14px] border-b border-border">
        <div className="font-mono text-[9px] tracking-[0.1em] font-bold text-text-secondary mb-2 uppercase">MTF Alignment</div>
        <div className="font-mono text-[9px] text-terminal-gold mb-3">CONFLUENCE LIVE</div>
        
        {/* Placeholder bars mapped to live */}
        <div className="space-y-2">
          {['Daily', '4 Hour', '1 Hour'].map(tfName => {
             const pred = liveData?.assets?.[activeSymbol]?.predictions?.[tfName];
             const sig = pred?.signal?.toUpperCase() || 'WAIT';
             const conf = pred?.confidence ? Math.round(pred.confidence * 100) : 50;
             const color = sig === 'BUY' || sig === 'LONG' ? 'terminal-green' : sig === 'SELL' || sig === 'SHORT' ? 'terminal-red' : 'terminal-amber';
             return (
              <div key={tfName} className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-text-muted w-[28px]">{tfName.replace(' Hour', 'H').replace('Daily', '1D')}</span>
                <div className="h-[6px] bg-terminal-bg-hover flex-1 rounded-[1px] overflow-hidden"><div className={`h-full bg-${color} w-[${conf}%]`} style={{width: `${conf}%`}} /></div>
                <span className={`font-mono text-[9px] text-${color} w-[28px] text-right font-bold`}>{sig}</span>
              </div>
             )
          })}
        </div>
      </div>

      {/* CSM GRID */}
      <div className="p-[14px] border-b border-border">
        <div className="font-mono text-[9px] tracking-[0.1em] font-bold text-text-secondary mb-2 uppercase">Capital Flow (CSM)</div>
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          {Object.entries(liveData?.market_context?.csm || { USD: 5, EUR: 5, GBP: 5, JPY: 5, AUD: 5, CAD: 5, CHF: 5, NZD: 5 }).slice(0, 8).map(([curr, val]: [string, any]) => (
            <div key={curr} className="bg-terminal-bg-card border border-border rounded-[2px] p-1 flex flex-col items-center">
              <span className="font-mono text-[8px] text-text-muted">{curr}</span>
              <span className={`font-mono text-[10px] font-bold ${val > 6 ? 'text-terminal-green' : val < 4 ? 'text-terminal-red' : 'text-text-secondary'}`}>{val.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RISK PARAMS */}
      <div className="p-[14px] border-b border-border">
        <div className="font-mono text-[9px] tracking-[0.1em] font-bold text-text-secondary mb-2 uppercase">Risk Parameters</div>
        <div className="space-y-1.5 mt-3">
          <div className="flex justify-between items-center"><span className="font-mono text-[9px] text-text-muted">KELLY</span><span className="font-mono text-[10px] text-text-primary">0.23</span></div>
          <div className="flex justify-between items-center"><span className="font-mono text-[9px] text-text-muted">ATR(14)</span><span className="font-mono text-[10px] text-text-primary">18.2</span></div>
          <div className="flex justify-between items-center"><span className="font-mono text-[9px] text-text-muted">STOP LEVEL</span><span className="font-mono text-[10px] text-terminal-red">2727.30</span></div>
          <div className="flex justify-between items-center"><span className="font-mono text-[9px] text-text-muted">TARGET ZONE</span><span className="font-mono text-[10px] text-terminal-green">2770.00</span></div>
          <div className="flex justify-between items-center mt-2 border-t border-border pt-1"><span className="font-mono text-[9px] text-text-muted">LOT SIZE</span><span className="font-mono text-[10px] font-bold text-terminal-gold">0.08</span></div>
          <div className="flex justify-between items-center"><span className="font-mono text-[9px] text-text-muted">MAX RISK</span><span className="font-mono text-[10px] text-terminal-amber">1.0% acct</span></div>
        </div>
      </div>

      {/* MACRO NEWS FEED */}
      <div className="pt-3 flex-1 overflow-hidden">
         <NewsFeed news={news} combatStatus={combatStatus} />
      </div>

    </div>
  );
}
