import { NewsEvent, NewsCombatStatus } from '../types/apex';
 
 interface NewsFeedProps {
   news: NewsEvent[];
   combatStatus: NewsCombatStatus | null;
 }

export default function NewsFeed({ news, combatStatus }: NewsFeedProps) {

  // Format timestamp nicely
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    const minsAgo = Math.floor((Date.now() - d.getTime()) / 60000);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    if (minsAgo < 60) return `${timeStr} · ${minsAgo}m ago`;
    const hoursAgo = Math.floor(minsAgo / 60);
    return `${timeStr} · ${hoursAgo}h ago`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="font-mono text-[9px] tracking-[0.1em] font-bold text-text-secondary mb-3 uppercase px-[14px]">Macro Flow</div>
      
      {/* COMBAT MODE BANNER */}
      {combatStatus?.combat_mode && (
        <div className="mx-[14px] mb-4 bg-terminal-red/10 border border-terminal-red/30 rounded-[3px] p-3 animate-pulse shadow-[0_0_15px_rgba(var(--red-rgb),0.15)]">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] font-bold text-terminal-red tracking-wider uppercase">🔴 News Combat Active</span>
            <span className="font-mono text-[8px] text-terminal-red/70">5S POLLING</span>
          </div>
          <div className="font-sans text-[11px] text-text-primary font-medium">
            Monitoring: {combatStatus.active_event?.title || 'High Impact Release'}
          </div>
          <div className="mt-2 h-[2px] bg-terminal-red/20 w-full rounded-full overflow-hidden">
            <div className="h-full bg-terminal-red w-1/3 animate-loading-slide" />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-[14px] pb-4 space-y-4">
        {news.map(item => {
          
          let badgeClass = 'text-terminal-green bg-[rgba(var(--green-rgb,0,208,132),0.1)] border border-[rgba(var(--green-rgb),0.2)]';
          if (item.impact === 'HIGH') badgeClass = 'text-terminal-red bg-[rgba(var(--red-rgb,232,57,74),0.1)] border border-[rgba(var(--red-rgb),0.2)]';
          else if (item.impact === 'MED') badgeClass = 'text-terminal-amber bg-[rgba(var(--amber-rgb,245,166,35),0.1)] border border-[rgba(var(--amber-rgb),0.2)]';

          // Opacity fade for low influence
          const opacityStyle = (item.decay && item.decay < 0.1) ? { opacity: 0.4 } : {};

          return (
            <div 
              key={item.id} 
              className="flex flex-col gap-2 group cursor-pointer transition-all duration-200 border-l-[2px] border-transparent hover:border-terminal-gold/40 pl-3 -ml-3"
              style={opacityStyle}
            >
              {/* Meta row */}
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] text-text-muted select-none opacity-80">{formatTime(item.timestamp)}</span>
                <span className={`font-mono text-[8.5px] font-bold px-[6px] py-[2.5px] rounded-[1.5px] leading-none uppercase tracking-tighter ${badgeClass} shadow-[0_0_10px_rgba(var(--${item.impact === 'HIGH' ? 'red' : item.impact === 'MED' ? 'amber' : 'green'}-rgb),0.1)]`}>
                  {item.impact}
                </span>
                {item.decay !== undefined && (
                  <span className="font-mono text-[9px] text-terminal-gold font-bold opacity-60">
                    [{item.decay.toFixed(2)}]
                  </span>
                )}
              </div>
              
              {/* Headline */}
              <div className="flex gap-2.5 items-start">
                <div className={`w-[2.5px] h-full self-stretch rounded-full shrink-0 opacity-40 ${item.impact === 'HIGH' ? 'bg-terminal-red' : item.impact === 'MED' ? 'bg-terminal-amber' : 'bg-terminal-green'}`} />
                <div className="font-sans text-[12.5px] font-medium text-text-secondary leading-[1.4] line-clamp-3 group-hover:text-text-primary transition-colors tracking-tight">
                  {item.headline}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
