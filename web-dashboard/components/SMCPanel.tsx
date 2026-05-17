import React from 'react';

// APEX SMC PANEL V8 - Institutional Intelligence
// Integrates Module 8 specifications: Confluence, Zones, Sweeps, and Kelly sizing.
interface SMCData {
  confluence_long: number;
  confluence_short: number;
  setup_quality: number;
  structure: 'UPTREND' | 'DOWNTREND' | 'CONSOLIDATION';
  premium_discount: number; // -1 to 1
  sweep_detected: boolean;
  sweep_direction: 'HIGH' | 'LOW' | 'NONE';
  kelly_base: number;
  kelly_adjusted: number;
  conflict: boolean;
  active_zones: { type: string, zone: string, freshness: number }[];
}

export default function SMCPanel({ data }: { data?: SMCData }) {
  // Mock data if none provided (for UI dev)
  const d: SMCData = data || {
    confluence_long: 0.72,
    confluence_short: 0.15,
    setup_quality: 0.72,
    structure: 'UPTREND',
    premium_discount: -0.65,
    sweep_detected: true,
    sweep_direction: 'LOW',
    kelly_base: 2.0,
    kelly_adjusted: 2.0,
    conflict: false,
    active_zones: [
      { type: 'OB', zone: '2730.50-2738.20', freshness: 1.0 },
      { type: 'FVG', zone: '2740.10-2742.60', freshness: 0.75 }
    ]
  };

  const statusColor = d.setup_quality > 0.65 ? 'text-terminal-green' : (d.setup_quality > 0.4 ? 'text-terminal-amber' : 'text-text-muted');

  return (
    <div className="bg-terminal-bg-card border border-border rounded-[4px] p-3 flex flex-col h-full overflow-hidden">
      {/* 1. Header & Confluence Meter */}
      <div className="flex justify-between items-center mb-3">
        <div className="font-mono text-[9px] tracking-[0.1em] font-bold text-text-secondary uppercase">Institutional SMC Engine</div>
        <div className={`font-mono text-[10px] font-bold ${statusColor}`}>QUALITY: {(d.setup_quality * 100).toFixed(0)}%</div>
      </div>

      {/* Confluence Bar */}
      <div className="h-1.5 w-full bg-[rgba(255,255,255,0.05)] rounded-full mb-4 flex overflow-hidden">
        <div className="h-full bg-terminal-green" style={{ width: `${d.confluence_long * 100}%` }}></div>
        <div className="h-full bg-terminal-amber opacity-30" style={{ width: `${(1 - d.confluence_long - d.confluence_short) * 100}%` }}></div>
        <div className="h-full bg-terminal-red" style={{ width: `${d.confluence_short * 100}%` }}></div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        
        {/* 2. Market Structure Section */}
        <div className="space-y-1">
           <div className="font-mono text-[8px] text-text-muted uppercase">Market State</div>
           <div className="flex justify-between items-center bg-[rgba(255,255,255,0.02)] p-2 rounded">
              <span className={`font-serif text-sm font-bold ${d.structure === 'UPTREND' ? 'text-terminal-green' : 'text-terminal-red'}`}>
                {d.structure === 'UPTREND' ? '↑ ' : '↓ '}{d.structure}
              </span>
              <span className="font-mono text-[10px] text-terminal-blue">
                {d.premium_discount < 0 ? 'DISCOUNT' : 'PREMIUM'} {(Math.abs(d.premium_discount)*100).toFixed(0)}%
              </span>
           </div>
        </div>

        {/* 3. Sweep Alert (Pulsing Badge) */}
        {d.sweep_detected && (
          <div className="animate-pulse bg-[rgba(245,158,11,0.1)] border border-terminal-amber p-2 rounded flex justify-between items-center">
            <span className="font-mono text-[9px] font-bold text-terminal-amber">SWEEP DETECTED</span>
            <span className="font-mono text-[9px] text-terminal-amber">[{d.sweep_direction} SIDE]</span>
          </div>
        )}

        {/* 4. Active Zones Table */}
        <div className="space-y-1">
          <div className="font-mono text-[8px] text-text-muted uppercase">Active Liquidity Zones</div>
          <div className="text-[10px] space-y-1">
            {d.active_zones.map((z, i) => (
              <div key={i} className="flex justify-between font-mono py-1 border-b border-[rgba(255,255,255,0.05)]">
                <span className="text-terminal-blue">{z.type}</span>
                <span className="text-text-secondary">{z.zone}</span>
                <span className="text-terminal-green">{z.freshness === 1 ? '●' : '◐'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Kelly Adjustment */}
        <div className="pt-2 border-t border-[rgba(255,255,255,0.1)]">
           <div className="flex justify-between items-center">
              <span className="font-mono text-[9px] text-text-muted uppercase">Kelly Adjustment</span>
              <span className={`font-mono text-[10px] ${d.conflict ? 'text-terminal-amber' : 'text-text-muted'}`}>
                {d.kelly_base}% → <span className={d.conflict ? 'font-bold' : ''}>{d.kelly_adjusted}%</span>
              </span>
           </div>
           {d.conflict && (
             <div className="text-[8px] font-mono text-terminal-amber mt-1 italic">
               (!) SMC Conflict detected - sizing halved for safety.
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
