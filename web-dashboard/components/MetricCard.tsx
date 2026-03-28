import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  badgeText: string;
  badgeColor: string; // Tailwnd color name (e.g., 'terminal-green')
  accentColor: string; // Hex color for top bar (e.g., '#c8a84b')
  isValueSignal?: boolean; // If true, colors the value based on string (BUY/SELL)
  subLabel?: string;
}

export default function MetricCard({ label, value, badgeText, badgeColor, accentColor, isValueSignal = false, subLabel }: MetricCardProps) {
  
  let valueColor = 'text-foreground';
  let valueSize = 'text-[20px]';

  if (isValueSignal && typeof value === 'string') {
    valueSize = 'text-[16px]';
    if (value === 'BUY') valueColor = 'text-terminal-green';
    else if (value === 'SELL') valueColor = 'text-terminal-red';
    else if (value === 'WAIT') valueColor = 'text-terminal-amber';
  }

  // Map Tailwind badge color var to actual CSS variable for inline style if needed, 
  // but using generic class mapping here for ease.
  const badgeStyle = {
    backgroundColor: `rgba(var(--${badgeColor.replace('terminal-', '')}-rgb, 0,0,0), 0.1)`, // Simplified for Next
    borderColor: `rgba(var(--${badgeColor.replace('terminal-', '')}-rgb, 0,0,0), 0.25)`,
  };

  const [isPulsing, setIsPulsing] = React.useState(false);

  React.useEffect(() => {
    setIsPulsing(true);
    const timer = setTimeout(() => setIsPulsing(false), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={`bg-terminal-bg-card border border-border rounded-[4px] relative overflow-hidden h-[80px] p-[10px] px-[14px] flex flex-col justify-center transition-all ${isPulsing ? 'animate-pulse-quick border-terminal-gold/50' : ''}`}>
      {/* Top Accent Bar */}
      <div 
        className="absolute top-0 left-0 w-full h-[2px]" 
        style={{ backgroundColor: accentColor }}
      />
      
      <div className="font-mono text-[9px] text-text-muted tracking-[0.1em] uppercase mb-[4px]">
        {label}
      </div>
      
      <div className={`font-mono font-bold ${valueSize} ${valueColor} leading-none mb-1`}>
        {value}
      </div>
      
      <div className="flex items-center justify-between mt-auto">
        <div 
          className="border rounded-[2px] px-[6px] py-[2px] font-mono text-[9px] leading-none"
          style={{ 
            color: `var(--${badgeColor.replace('terminal-', '')})`,
            backgroundColor: `color-mix(in srgb, var(--${badgeColor.replace('terminal-', '')}) 10%, transparent)`,
            borderColor: `color-mix(in srgb, var(--${badgeColor.replace('terminal-', '')}) 25%, transparent)`
          }}
        >
          {badgeText}
        </div>
        {subLabel && (
          <span className="font-mono text-[8px] text-text-muted uppercase tracking-tighter">
            {subLabel}
          </span>
        )}
      </div>
    </div>
  );
}
