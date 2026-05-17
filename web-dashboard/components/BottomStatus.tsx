import React, { useState, useEffect } from 'react';
import { getCurrentSession } from '../utils/session';

export default function BottomStatus() {
  const sessionLabel = getCurrentSession();
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/pipeline_health');
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        }
      } catch (e) {
        console.error("Failed to fetch pipeline health", e);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  const accuracy = 71.3;
  const kelly = 0.23;
  const lot = 0.08;
  const atrStop = "18.2";

  // Health indicator logic
  let healthColor = "bg-text-muted";
  let healthText = "RECONNECTING...";
  
  if (health) {
    if (health.status === 'healthy') {
      healthColor = "bg-terminal-green";
      healthText = "HEALTHY";
    } else if (health.status === 'degraded') {
      healthColor = "bg-terminal-amber animate-pulse";
      healthText = health.status_label || "DEGRADED";
    } else if (health.status === 'error' || health.status === 'critical') {
      healthColor = "bg-terminal-red animate-pulse";
      healthText = "CRITICAL FAILURE";
    }
  }

  // Accuracy color logic
  let accColor = "text-terminal-red";
  if (accuracy > 65) accColor = "text-terminal-green";
  else if (accuracy >= 50) accColor = "text-terminal-amber";

  return (
    <div className="h-[22px] w-full bg-terminal-bg-panel border-t border-border flex items-center px-4 shrink-0 overflow-hidden">
      <div className="flex items-center space-x-6 w-full">
        
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-text-muted uppercase">Pipeline</span>
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm bg-black/20 border border-border/40">
            <div className={`w-1.5 h-1.5 rounded-full ${healthColor} shadow-[0_0_5px_rgba(0,0,0,0.5)]`} />
            <span className={`font-mono text-[8px] font-bold tracking-tighter ${health.status === 'healthy' ? 'text-terminal-green' : health.status === 'degraded' ? 'text-terminal-amber' : 'text-text-secondary'}`}>
              {healthText}
            </span>
          </div>
        </div>

        {health?.status === 'degraded' && (
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-sm bg-terminal-amber/5 border border-terminal-amber/20">
             <span className="font-mono text-[8px] text-terminal-amber font-bold animate-pulse">LOCKED: {health.last_valid_signal_min_ago ?? '?'} min ago</span>
          </div>
        )}

        <div className="h-2 w-[1px] bg-border opacity-30" />
        
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-text-muted">MODEL</span>
          <span className="font-mono text-[9px] text-text-secondary">v4.2</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-text-muted">ACCURACY</span>
          <span className={`font-mono text-[9px] ${accColor}`}>{accuracy}%</span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-text-muted">ATR STOP</span>
          <span className="font-mono text-[9px] text-text-secondary">{atrStop} pip</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-text-muted">SESSION</span>
          <span className="font-mono text-[9px] text-terminal-gold uppercase tracking-widest">{sessionLabel}</span>
        </div>
        
      </div>
    </div>
  );
}
