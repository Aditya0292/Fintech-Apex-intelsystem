import React from 'react';
import { SignalData } from '../types/apex';

interface SignalTableProps {
  signals: SignalData[];
}

import { useTerminal } from '../context/TerminalContext';

export default function SignalTable({ signals }: SignalTableProps) {
  const { hoveredAsset, setHoveredAsset } = useTerminal();

  return (
    <div className="w-full bg-terminal-bg-panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex px-4 pb-2 pt-3 border-b border-border text-[9px] font-mono tracking-[0.08em] text-text-muted uppercase shrink-0">
        <div className="w-[85px] shrink-0">Asset</div>
        <div className="w-[60px] shrink-0">Signal</div>
        <div className="w-[85px] shrink-0">Entry</div>
        <div className="w-[130px] shrink-0">TP/SL</div>
        <div className="w-[50px] shrink-0">RR</div>
        <div className="flex-1">Confidence</div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto w-full pb-2">
        {signals.map((sig, i) => {

          let sigColor = 'text-terminal-amber';
          if (sig.signal === 'BUY') sigColor = 'text-terminal-green';
          else if (sig.signal === 'SELL') sigColor = 'text-terminal-red';

          let confColor = 'bg-terminal-blue';
          if (sig.confidence > 75) confColor = 'bg-terminal-green';
          else if (sig.confidence >= 50) confColor = 'bg-terminal-amber';

          const isWait = sig.signal === 'WAIT';
          const valClass = isWait ? 'text-text-muted' : 'text-text-secondary';
          const isHovered = hoveredAsset === sig.asset;

          return (
            <div
              key={`${sig.asset}-${i}`}
              onMouseEnter={() => setHoveredAsset(sig.asset)}
              onMouseLeave={() => setHoveredAsset(null)}
              className={`flex items-center px-4 py-[10px] border-b-[0.5px] border-border/40 hover:bg-terminal-bg-hover transition-colors font-mono text-[10px] cursor-crosshair
                ${isHovered ? 'bg-terminal-gold/5 border-terminal-gold/20' : ''}
                ${(!isWait && sig.confidence > 80) ? (sig.signal === 'BUY' ? 'flash-green' : 'flash-red') : ''}
              `}
            >
              <div className="w-[85px] shrink-0 font-bold text-terminal-gold">{sig.asset}</div>
              <div className={`w-[60px] shrink-0 font-bold ${sigColor}`}>{sig.signal}</div>
              <div className={`w-[85px] shrink-0 ${valClass}`}>
                {isWait ? '-' : sig.entry.toFixed(isWait ? 0 : (sig.asset.includes('JPY') ? 2 : 4))}
              </div>
              <div className={`w-[130px] shrink-0 ${valClass}`}>
                {isWait ? '-/-' : `${sig.tp.toFixed(sig.asset.includes('JPY') ? 2 : 4)} / ${sig.sl.toFixed(sig.asset.includes('JPY') ? 2 : 4)}`}
              </div>
              <div className={`w-[50px] shrink-0 ${valClass}`}>{isWait ? '-' : sig.rr}</div>

              {/* Confidence Bar */}
              <div className="flex-1 min-w-0 flex items-center pr-2">
                <div className="h-[3px] w-full max-w-[400px] bg-terminal-bg-track rounded-full overflow-hidden">
                  <div
                    className={`h-full ${confColor} transition-all duration-800 ease-out`}
                    style={{ width: `${sig.confidence}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
