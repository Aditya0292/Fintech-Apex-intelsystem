import React, { useMemo } from 'react';
import { SMCZone } from '../types/apex';
import { normalizePricesToSVG, normalizePriceToSVG } from '../utils/chartUtils';

interface ChartSVGProps {
  prices: number[];
  obZones: SMCZone[];
  fvgZones: SMCZone[];
  height: number;
  width: number;
}

export default function ChartSVG({ prices, obZones, fvgZones, height, width }: ChartSVGProps) {

  // Grid lines
  const gridLines = [22, 44, 66];

  // Map prices to Y coordinates
  const points = useMemo(() => {
    if (prices.length === 0) return '';
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return prices.map((price, idx) => {
      const x = (idx / (prices.length - 1)) * width;
      const y = normalizePriceToSVG(price, min, max, height);
      return `${x},${y}`;
    }).join(' ');
  }, [prices, height, width]);

  // Last point for dot
  const lastX = width;
  const lastY = prices.length > 0
    ? normalizePriceToSVG(prices[prices.length - 1], Math.min(...prices), Math.max(...prices), height)
    : 0;

  // Area path (close price line to bottom)
  const areaPath = points ? `${points} ${width},${height} 0,${height}` : '';

  // Process Zones
  const renderZone = (zone: SMCZone, index: number, type: 'ob' | 'fvg') => {
    if (prices.length === 0) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    const y1Norm = normalizePriceToSVG(zone.y1, min, max, height);
    const y2Norm = normalizePriceToSVG(zone.y2, min, max, height);

    // Sort coordinates because SVG rect requires top-left y, and positive height
    const topY = Math.min(y1Norm, y2Norm);
    const rectHeight = Math.abs(y2Norm - y1Norm);

    // Fallbacks if height is too small
    const finalHeight = rectHeight < 2 ? 2 : rectHeight;

    const fillAndStroke = type === 'ob'
      ? { fill: 'rgba(200,168,75,0.15)', stroke: 'rgba(200,168,75,0.6)', color: 'var(--gold)' }
      : { fill: 'rgba(59,143,255,0.15)', stroke: 'rgba(59,143,255,0.5)', color: 'var(--blue)' };

    return (
      <g key={`${type}-${index}`}>
        <rect
          x={0}
          y={topY}
          width={width}
          height={finalHeight}
          fill={fillAndStroke.fill}
          stroke={fillAndStroke.stroke}
          strokeWidth="0.5"
        />
        {zone.label && (
          <text
            x="4"
            y={topY - 2}
            fontFamily="monospace"
            fontSize="7"
            fill={fillAndStroke.color}
          >
            {zone.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="w-full relative bg-terminal-bg-panel border border-border rounded-[4px] overflow-hidden" style={{ height }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--green)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {gridLines.map((y, i) => (
          <line key={i} x1="0" y1={y} x2={width} y2={y} stroke="var(--border)" strokeWidth="0.5" />
        ))}

        {/* Zones */}
        {obZones.map((z, i) => renderZone(z, i, 'ob'))}
        {fvgZones.map((z, i) => renderZone(z, i, 'fvg'))}

        {/* Area Fill */}
        {areaPath && (
          <polygon points={areaPath} fill="url(#chartGradient)" />
        )}

        {/* Price Line */}
        {points && (
          <polyline points={points} fill="none" stroke="var(--green)" strokeWidth="1.5" strokeLinejoin="round" />
        )}

        {/* Current Price Dot */}
        {points && <circle cx={lastX} cy={lastY} r="3" fill="var(--green)" />}

        {/* Y-Axis Labels (Dummy) */}
        {points && (
          <>
            <text x="2" y={20} fontFamily="monospace" fontSize="7" fill="var(--text-muted)">{Math.max(...prices).toFixed(2)}</text>
            <text x="2" y={height - 5} fontFamily="monospace" fontSize="7" fill="var(--text-muted)">{Math.min(...prices).toFixed(2)}</text>
          </>
        )}
      </svg>
    </div>
  );
}
