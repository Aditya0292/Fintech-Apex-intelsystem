import React from 'react';
import { getCurrentSession } from '../utils/session';

export default function BottomStatus() {
  const sessionLabel = getCurrentSession();
  // Placeholders for shell validation Phase 2
  const accuracy = 71.3;
  const kelly = 0.23;
  const lot = 0.08;
  const atrStop = "18.2";

  // Accuracy color logic
  let accColor = "text-terminal-red";
  if (accuracy > 65) accColor = "text-terminal-green";
  else if (accuracy >= 50) accColor = "text-terminal-amber";

  return (
    <div className="h-[22px] w-full bg-terminal-bg-panel border-t border-border flex items-center px-4 shrink-0">
      <div className="flex items-center space-x-6 w-full">
        
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-text-muted">MODEL</span>
          <span className="font-mono text-[9px] text-text-secondary">v4.2</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-text-muted">FEATURES</span>
          <span className="font-mono text-[9px] text-text-secondary">77</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-text-muted">LAST TRAIN</span>
          <span className="font-mono text-[9px] text-text-secondary">2d</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-text-muted">ACCURACY</span>
          <span className={`font-mono text-[9px] ${accColor}`}>{accuracy}%</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-text-muted">KELLY</span>
          <span className="font-mono text-[9px] text-text-secondary">{kelly}</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-text-muted">LOT</span>
          <span className="font-mono text-[9px] text-text-secondary">{lot}</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-text-muted">ATR STOP</span>
          <span className="font-mono text-[9px] text-text-secondary">{atrStop} pip</span>
        </div>

        <div className="h-2 w-[1px] bg-border mx-1" />

        <div className="flex items-center gap-1.5 group cursor-help" title="Signals verified on-chain via Decentralized Audit Log">
          <span className="font-mono text-[9px] text-text-muted">BLOCKCHAIN</span>
          <div className="flex items-center gap-1 bg-bull/5 border border-bull/20 px-1.5 py-0 rounded-sm">
            <div className="w-1 h-1 rounded-full bg-bull animate-pulse-glow" />
            <span className="font-mono text-[8px] text-bull uppercase tracking-tighter">verified</span>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-text-muted">SESSION</span>
          <span className="font-mono text-[9px] text-terminal-gold">{sessionLabel}</span>
        </div>
        
      </div>
    </div>
  );
}
