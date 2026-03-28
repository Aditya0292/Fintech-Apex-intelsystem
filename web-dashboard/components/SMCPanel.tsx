import React from 'react';

// Using mock SMC data for structure logic testing over API layer implementation
export default function SMCPanel() {
  
  const Row = ({ label, value, status }: { label: string, value: string, status: 'active' | 'warning' | 'inactive' | 'blue' }) => {
    
    let colorClass = 'text-text-muted';
    if (status === 'active') colorClass = 'text-terminal-green';
    else if (status === 'warning') colorClass = 'text-terminal-amber';
    else if (status === 'blue') colorClass = 'text-terminal-blue';

    return (
      <div className="flex justify-between items-center py-1.5 border-b-[0.5px] border-[rgba(var(--border-rgb,30,45,61),0.5)] last:border-0">
        <span className="font-mono text-[9px] text-text-muted tracking-wide">{label}</span>
        <span className={`font-mono text-[10px] ${colorClass}`}>{value === 'N/A' ? '-' : value}</span>
      </div>
    );
  };

  return (
    <div className="bg-terminal-bg-card border border-border rounded-[4px] p-3 flex flex-col h-full overflow-hidden">
      <div className="font-mono text-[9px] tracking-[0.1em] font-bold text-text-secondary mb-3 uppercase shrink-0">SMC Structure</div>
      
      <div className="flex-1 overflow-y-auto pr-1">
        <Row label="ZONE ALIGNMENT" value="DISCOUNT" status="blue" />
        <Row label="ORDER BLOCK" value="2730.50 - 2738.20" status="active" />
        <Row label="FAIR VALUE GAP" value="2740.10 - 2742.60" status="active" />
        <Row label="BOS DIRECTION" value="BULLISH" status="active" />
        <Row label="CHOCH" value="NONE DETECTED" status="inactive" />
        <Row label="LIQUIDITY SWEEP" value="2715.40 (SWEEP)" status="warning" />
        <Row label="INDUCEMENT LVL" value="2752.80" status="warning" />
      </div>
    </div>
  );
}
