import React from 'react';

const DUMMY_TICKERS = [
  { symbol: 'XAUUSD', price: '2745.50', change: '+12.4' },
  { symbol: 'EURUSD', price: '1.0945', change: '-0.0012' },
  { symbol: 'GBPUSD', price: '1.2650', change: '+0.0034' },
  { symbol: 'USDJPY', price: '150.25', change: '-0.45' },
  { symbol: 'BTCUSD', price: '64500.00', change: '+1250' },
  { symbol: 'US30', price: '42100.5', change: '-45.5' },
];

export default function Topbar() {
  const timeStr = "12:45:00 UTC"; // Placeholder

  return (
    <div className="h-full w-full bg-terminal-bg-panel border-b border-border flex items-center justify-between px-3 overflow-hidden">
      
      {/* LEFT: Branding */}
      <div className="flex items-center gap-2 w-[220px] shrink-0">
        <span className="font-mono text-[11px] font-bold tracking-[0.3em] text-foreground select-none">TERMINAL://APEX</span>
        <span className="font-mono text-[9px] text-terminal-gold opacity-60 font-bold px-1.5 py-0.5 rounded-[1px] bg-terminal-gold/10">V4.2</span>
      </div>

      {/* CENTER: Ticker */}
      <div className="flex-1 overflow-hidden group">
        <style>{`
          @keyframes tickerScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-ticker {
            animation: tickerScroll 30s linear infinite;
          }
          .group:hover .animate-ticker {
            animation-play-state: paused;
          }
        `}</style>
        
        <div className="flex w-max animate-ticker">
          {/* First Set */}
          <div className="flex items-center space-x-6 pr-6">
            {DUMMY_TICKERS.map((t, i) => (
              <div key={`t1-${i}`} className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-terminal-gold">{t.symbol}</span>
                <span className="font-mono text-[10px] text-white">{t.price}</span>
                <span className={`font-mono text-[10px] ${t.change.startsWith('+') ? 'text-terminal-green' : 'text-terminal-red'}`}>
                  {t.change}
                </span>
              </div>
            ))}
          </div>
          {/* Duplicate Set for infinite scroll */}
          <div className="flex items-center space-x-6">
            {DUMMY_TICKERS.map((t, i) => (
              <div key={`t2-${i}`} className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-terminal-gold">{t.symbol}</span>
                <span className="font-mono text-[10px] text-white">{t.price}</span>
                <span className={`font-mono text-[10px] ${t.change.startsWith('+') ? 'text-terminal-green' : 'text-terminal-red'}`}>
                  {t.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Status */}
      <div className="flex items-center justify-end gap-3 w-[180px] shrink-0">
        <div className="flex items-center gap-2">
           <style>{`
            @keyframes pulseGlow {
              0% { opacity: 1; }
              50% { opacity: 0.4; }
              100% { opacity: 1; }
            }
            .animate-pulse-fast {
              animation: pulseGlow 2s ease-in-out infinite;
            }
          `}</style>
          <div 
            className="w-[6px] h-[6px] rounded-full bg-terminal-green animate-pulse-fast"
            style={{ boxShadow: '0 0 6px var(--green)' }}
          />
          <span className="font-mono text-[9px] text-text-muted">LIVE: MT5</span>
        </div>
        <div className="font-mono text-[10px] text-text-secondary">{timeStr}</div>
      </div>

    </div>
  );
}
