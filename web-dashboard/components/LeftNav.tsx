import { useTerminal } from '../context/TerminalContext';

export default function LeftNav({ activeView, onViewChange }: { activeView: string, onViewChange: (view: string) => void }) {
  const { hoveredAsset, setHoveredAsset } = useTerminal();
  const navItems = [
    'Workspace',
    'Signal Runner',
    'Network Graph',
    'Historical Logs',
    'Settings'
  ];

  return (
    <div className="flex flex-col h-full w-full select-none">
      {/* SCROLLABLE NAV */}
      <div className="flex-1 overflow-y-auto px-1 py-4 flex flex-col gap-0.5 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <div className="px-3 mb-2 font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase opacity-60">System_Nodes</div>

        {navItems.map(item => {
          const isActive = activeView === item;
          return (
            <button
              key={item}
              onClick={() => onViewChange(item)}
              className={`w-full text-left flex items-center px-3 py-1.5 font-sans text-[12px] group
                ${isActive
                  ? 'border-l-[2px] border-terminal-gold bg-terminal-bg-hover text-text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-terminal-bg-hover border-l-[2px] border-transparent'}
              `}
            >
              {item}
            </button>
          );
        })}
      </div>

      {/* ACTIVE ASSETS QUICK-VIEW */}
      <div className="px-1 py-4 border-t border-border mt-auto">
        <div className="px-3 mb-3 font-mono text-[9px] tracking-[0.12em] text-text-muted uppercase">Active Assets</div>
        <div className="space-y-3">
          {[
            { asset: 'XAUUSD', price: '2745.52', change: '+0.42%', color: 'text-terminal-green', bar: 75 },
            { asset: 'EURUSD', price: '1.0945', change: '-0.12%', color: 'text-terminal-red', bar: 40 },
          ].map(sub => {
            const isHovered = hoveredAsset === sub.asset;
            return (
              <div
                key={sub.asset}
                onMouseEnter={() => setHoveredAsset(sub.asset)}
                onMouseLeave={() => setHoveredAsset(null)}
                className={`px-3 flex flex-col cursor-pointer transition-colors py-1
                  ${isHovered ? 'bg-terminal-bg-hover' : 'hover:bg-terminal-bg-hover'}
                `}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-mono text-[10px] font-bold ${isHovered ? 'text-white' : 'text-terminal-gold'}`}>{sub.asset}</span>
                  <span className={`font-mono text-[10px] ${sub.color}`}>{sub.price}</span>
                </div>
                <div className="h-[2px] w-full bg-terminal-bg-track rounded-full overflow-hidden">
                  <div className={`h-full ${sub.color === 'text-terminal-green' ? 'bg-terminal-green' : 'bg-terminal-red'}`} style={{ width: `${sub.bar}%` }} />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="font-mono text-[8px] text-text-muted">ATR RANGE</span>
                  <span className="font-mono text-[8px] text-text-secondary">{sub.change}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FIXED BOTTOM: Engine Status */}
      <div className="p-4 border-t border-border/40 bg-terminal-bg-panel/50 backdrop-blur-md shrink-0">
        <div className="flex justify-between items-center mb-1">
          <span className="font-mono text-[10px] text-text-muted tracking-widest">LIVE_ENGINE_V4</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse shadow-[0_0_8px_rgba(0,208,132,0.6)]" />
            <span className="font-mono text-[10px] text-terminal-green font-bold">ONLINE</span>
          </div>
        </div>
        <div className="flex justify-between items-center opacity-60">
          <span className="font-mono text-[10px] text-text-muted tracking-tighter">NY_LATENCY</span>
          <span className="font-mono text-[10px] text-text-secondary font-bold">14ms</span>
        </div>
      </div>
    </div>
  );
}
