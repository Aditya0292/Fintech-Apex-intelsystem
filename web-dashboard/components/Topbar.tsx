import { useApex } from '@/context/ApexContext';
import { Activity, Clock, Zap } from 'lucide-react';

const DUMMY_TICKERS = [
  { symbol: 'XAUUSD', price: '2745.50', change: '+12.4' },
  { symbol: 'EURUSD', price: '1.0945', change: '-0.0012' },
  { symbol: 'GBPUSD', price: '1.2650', change: '+0.0034' },
  { symbol: 'USDJPY', price: '150.25', change: '-0.45' },
  { symbol: 'BTCUSD', price: '64500.00', change: '+1250' },
  { symbol: 'US30', price: '42100.5', change: '-45.5' },
];

export default function Topbar() {
  const { isScanning, triggerScan, scanInterval, setScanInterval } = useApex();
  const timeStr = new Date().getUTCHours() + ":" + String(new Date().getUTCMinutes()).padStart(2, '0') + " UTC";

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

      {/* RIGHT: Status & Controls */}
      <div className="flex items-center justify-end gap-4 px-4 shrink-0 border-l border-border/50 bg-black/20 h-full">
        
        {/* Frequency Selector */}
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-text-muted" />
          <select 
            value={scanInterval}
            onChange={(e) => setScanInterval(Number(e.target.value))}
            className="bg-transparent border-none text-[9px] font-mono font-bold text-terminal-gold focus:ring-0 cursor-pointer hover:text-white transition-colors uppercase outline-none"
          >
            <option value={5} className="bg-terminal-bg-panel">Interval: 5M</option>
            <option value={10} className="bg-terminal-bg-panel">Interval: 10M</option>
            <option value={15} className="bg-terminal-bg-panel">Interval: 15M</option>
            <option value={30} className="bg-terminal-bg-panel">Interval: 30M</option>
          </select>
        </div>

        {/* Scan Button */}
        <button 
          onClick={triggerScan}
          disabled={isScanning}
          className={`flex items-center gap-2 px-3 py-1 rounded-[1px] transition-all group ${
            isScanning 
            ? 'bg-terminal-gold/20 cursor-wait' 
            : 'bg-terminal-green/10 hover:bg-terminal-green/20'
          }`}
        >
          <Zap className={`w-3 h-3 ${isScanning ? 'text-terminal-gold animate-pulse' : 'text-terminal-green'}`} />
          <span className={`font-mono text-[9px] font-black uppercase tracking-widest ${
            isScanning ? 'text-terminal-gold' : 'text-terminal-green'
          }`}>
            {isScanning ? 'SCANNING...' : 'TRIGGER SCAN'}
          </span>
        </button>

        {/* Live Indicator */}
        <div className="flex items-center gap-2 border-l border-border/30 pl-4">
          <div 
            className={`w-[6px] h-[6px] rounded-full bg-terminal-green ${!isScanning && 'animate-pulse'}`}
            style={{ boxShadow: isScanning ? 'none' : '0 0 8px var(--green)' }}
          />
          <span className="font-mono text-[9px] text-text-muted font-bold tracking-tight">OS: READY</span>
        </div>
      </div>

    </div>
  );
}
