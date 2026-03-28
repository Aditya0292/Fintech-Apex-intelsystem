"use client";

/**
 * SituationalMap — Tactical World Visualizer
 *
 * Renders in real-time:
 *  • SGP4 satellite positions + 15-min orbital trails (updates every 3 s)
 *  • Geo-convergence zones (multi-source hotspots)
 *  • Conflict hotspots with Intel hover cards
 *  • Data Freshness badges per subsystem
 *  • Radar sweep animation
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { globalDataLoader } from "@/lib/intelligence/data-loader";
import { dataFreshness, freshnessColor, freshnessIcon, type FreshnessStatus } from "@/lib/intelligence/data-freshness";
import type { SatellitePosition } from "@/lib/intelligence/satellites";
import { SAT_COLORS } from "@/lib/intelligence/satellites";
import type { ConvergenceAlert } from "@/lib/intelligence/geo-convergence";

// ── Types ────────────────────────────────────────────────────────────────────
interface Hotspot {
  id: string;
  region: string;
  lat: number;
  lng: number;
  intensity: number;
  status: "CRITICAL" | "HIGH" | "MED" | "LOW";
  alerts: string[];
}

interface FeedStatus { id: string; label: string; sourceId: any; }
const FEED_STATUSES: FeedStatus[] = [
  { id: "satellites",  label: "ORBITAL",  sourceId: "satellites"        },
  { id: "hotspots",    label: "THREATS",  sourceId: "conflict_hotspots" },
  { id: "convergence", label: "CONV-ZONES", sourceId: "geo_convergence" },
  { id: "news",        label: "INTEL",    sourceId: "news_feed"         },
];

// ── Coordinate Projection (Equirectangular) ──────────────────────────────────
function project(lat: number, lng: number): { x: string; y: string } {
  return {
    x: `${((lng + 180) * 100) / 360}%`,
    y: `${((90 - lat) * 100) / 180}%`,
  };
}

// ── World Map SVG Paths (simplified continents) ──────────────────────────────
// These are hand-crafted low-poly continent outlines for recognisable geography.
const CONTINENT_PATHS = [
  // North America
  "M 80,95 L 95,80 L 115,75 L 130,70 L 138,65 L 148,60 L 155,75 L 165,82 L 175,88 L 170,100 L 158,112 L 145,125 L 130,140 L 118,148 L 105,145 L 95,138 L 85,125 L 78,110 Z",
  // South America
  "M 120,155 L 130,148 L 145,155 L 150,170 L 150,195 L 145,215 L 135,235 L 120,248 L 108,255 L 98,250 L 95,235 L 100,215 L 108,195 L 112,175 Z",
  // Europe
  "M 298,68 L 315,62 L 330,60 L 345,65 L 360,68 L 370,75 L 365,85 L 350,90 L 335,92 L 320,95 L 308,88 L 298,80 Z",
  // Africa
  "M 295,100 L 320,98 L 345,100 L 360,118 L 370,140 L 370,165 L 360,190 L 348,210 L 330,225 L 310,228 L 295,218 L 282,200 L 278,175 L 280,148 L 285,125 L 285,108 Z",
  // Asia (simplified — large block)
  "M 370,60 L 430,50 L 500,52 L 540,58 L 570,65 L 595,70 L 610,80 L 620,95 L 610,110 L 590,120 L 565,128 L 540,130 L 510,138 L 490,148 L 470,150 L 450,145 L 430,138 L 410,128 L 395,118 L 375,105 L 360,92 L 362,75 Z",
  // Australia
  "M 548,190 L 580,182 L 608,185 L 628,200 L 635,220 L 628,238 L 608,248 L 582,250 L 558,245 L 540,232 L 535,215 L 540,200 Z",
];

export function SituationalMap() {
  const [hotspots,    setHotspots]    = useState<Hotspot[]>([]);
  const [satellites,  setSatellites]  = useState<SatellitePosition[]>([]);
  const [convergence, setConvergence] = useState<ConvergenceAlert[]>([]);
  const [hovered,     setHovered]     = useState<Hotspot | null>(null);
  const [hoveredSat,  setHoveredSat]  = useState<SatellitePosition | null>(null);
  const [statuses,    setStatuses]    = useState<Record<string, FreshnessStatus>>({});

  // Freshness badge updater
  const refreshStatuses = useCallback(() => {
    const next: Record<string, FreshnessStatus> = {};
    for (const f of FEED_STATUSES) {
      next[f.id] = dataFreshness.getSource(f.sourceId)?.status ?? 'no_data';
    }
    setStatuses(next);
  }, []);

  useEffect(() => {
    // Subscribe to data streams
    const unsubH = globalDataLoader.subscribe<Hotspot[]>('CONFLICT_HOTSPOTS', d => setHotspots(Array.isArray(d) ? d : []));
    const unsubS = globalDataLoader.subscribe<SatellitePosition[]>('SATELLITES', d => setSatellites(Array.isArray(d) ? d : []));
    const unsubC = globalDataLoader.subscribe<ConvergenceAlert[]>('CONVERGENCE_ZONES', d => setConvergence(Array.isArray(d) ? d : []));

    // Subscribe to freshness changes
    const unsubF = dataFreshness.subscribe(refreshStatuses);
    refreshStatuses();

    return () => { unsubH(); unsubS(); unsubC(); unsubF(); };
  }, [refreshStatuses]);

  return (
    <div className="relative w-full rounded-3xl border border-white/5 overflow-hidden bg-[#030508] shadow-[0_0_80px_rgba(0,0,0,1)] select-none" style={{ aspectRatio: '21/9' }}>

      {/* ── AMBIENT GRID ────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
        style={{ backgroundImage: 'radial-gradient(circle, #4ade80 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(34,211,238,0.06),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      {/* ── WORLD MAP SVG ───────────────────────────────────────────────────── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 720 360" preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="continent-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="rgba(34,211,238,0.4)" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="map-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(34,211,238,0.12)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0.02)" />
          </linearGradient>
        </defs>
        {CONTINENT_PATHS.map((d, i) => (
          <path
            key={i} d={d}
            fill="url(#map-grad)"
            stroke="rgba(34,211,238,0.4)"
            strokeWidth="0.8"
            strokeLinejoin="round"
            filter="url(#continent-glow)"
            className="transition-all hover:fill-cyan-400/20"
          />
        ))}
        {/* Equator + Prime Meridian */}
        <line x1="0" y1="180" x2="720" y2="180" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        <line x1="360" y1="0" x2="360" y2="360" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        {/* Tropic lines */}
        <line x1="0" y1="130" x2="720" y2="130" stroke="rgba(255,255,255,0.02)" strokeWidth="0.3" strokeDasharray="4,4" />
        <line x1="0" y1="230" x2="720" y2="230" stroke="rgba(255,255,255,0.02)" strokeWidth="0.3" strokeDasharray="4,4" />
      </svg>

      {/* ── RADAR SWEEP ─────────────────────────────────────────────────────── */}
      <motion.div
        animate={{ top: ['-2%', '102%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        className="absolute left-0 w-full h-[1px] pointer-events-none z-10"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.4), transparent)', boxShadow: '0 0 20px rgba(34,211,238,0.3)' }}
      />

      {/* ── SATELLITE ORBITAL TRAILS ─────────────────────────────────────────── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        {satellites.map(sat => {
          if (!sat.trail || sat.trail.length < 2) return null;
          const color = (SAT_COLORS as any)[sat.type] ?? '#fff';
          const pts = sat.trail.map(([lng, lat]) => {
            const x = ((lng + 180) * 100) / 360;
            const y = ((90 - lat) * 100) / 180;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
          }).join(' ');
          return (
            <polyline
              key={`trail-${sat.noradId}`}
              points={pts}
              fill="none"
              stroke={color}
              strokeWidth="0.12"
              strokeOpacity="0.4"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* ── CONVERGENCE ZONES ─────────────────────────────────────────────────── */}
      {convergence.map(zone => {
        const { x, y } = project(zone.lat, zone.lng);
        return (
          <div key={zone.cellId} className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none" style={{ left: x, top: y }}>
            <motion.div
              animate={{ scale: [1, 4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-8 h-8 rounded-full"
              style={{ background: `radial-gradient(circle, rgba(249,115,22,${zone.score / 200}), transparent)`, border: '1px solid rgba(249,115,22,0.3)' }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[5px] font-black text-orange-400 whitespace-nowrap">
              CONV:{zone.score}
            </div>
          </div>
        );
      })}

      {/* ── CONFLICT HOTSPOTS ──────────────────────────────────────────────────── */}
      {hotspots.map(spot => {
        const { x, y } = project(spot.lat, spot.lng);
        const isCrit = spot.status === 'CRITICAL';
        const dotColor = isCrit ? '#ef4444' : spot.status === 'HIGH' ? '#f97316' : '#eab308';
        return (
          <div
            key={spot.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-crosshair group/spot"
            style={{ left: x, top: y }}
            onMouseEnter={() => setHovered(spot)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Pulse ring */}
            <motion.div
              animate={{ scale: [1, 3.5], opacity: [0.7, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full"
              style={{ background: dotColor, opacity: 0.3 }}
            />
            {/* Core dot */}
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 z-10 relative transition-transform group-hover/spot:scale-150"
              style={{ background: dotColor, boxShadow: `0 0 16px ${dotColor}` }}>
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
            </div>
            {/* Coord tag */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 opacity-0 group-hover/spot:opacity-100 transition-opacity bg-black/80 px-1.5 py-0.5 rounded border border-white/10 backdrop-blur-md whitespace-nowrap">
              <span className="text-[7px] font-mono text-white/50">{spot.lat.toFixed(2)}°N {spot.lng.toFixed(2)}°E</span>
            </div>
            {/* Intel Card */}
            <AnimatePresence>
              {hovered?.id === spot.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-9 left-1/2 -translate-x-1/2 w-56 bg-[#0B0D12]/98 border border-white/10 backdrop-blur-2xl p-4 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-50 pointer-events-none"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-[10px] font-black text-white uppercase tracking-wider">{spot.region}</div>
                      <div className="text-[7px] font-mono text-white/30 mt-0.5">SEN: {spot.id}</div>
                    </div>
                    <div className="px-2 py-0.5 rounded-full text-[7px] font-black text-white" style={{ background: dotColor }}>{spot.status}</div>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {spot.alerts.map((a, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <div className="w-1 h-2.5 rounded-full mt-0.5 shrink-0" style={{ background: dotColor }} />
                        <span className="text-[8px] text-white/70 font-medium leading-tight">{a}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-white/5 flex justify-between">
                    <span className="text-[7px] font-black text-cyan-400 uppercase tracking-tighter">INTEL CONVERGENCE</span>
                    <span className="text-[7px] font-black text-white/60">{Math.round(spot.intensity * 100)}%</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* ── SATELLITES ──────────────────────────────────────────────────────────── */}
      {satellites.map(sat => {
        const { x, y } = project(sat.lat, sat.lng);
        const color = SAT_COLORS[sat.type] ?? '#fff';
        return (
          <div
            key={sat.noradId}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-30 cursor-crosshair group/sat"
            style={{ left: x, top: y }}
            onMouseEnter={() => setHoveredSat(sat)}
            onMouseLeave={() => setHoveredSat(null)}
          >
            {/* Satellite dot — small diamond */}
            <div className="w-2 h-2 rotate-45 border transition-transform group-hover/sat:scale-200"
              style={{ background: color, borderColor: `${color}60`, boxShadow: `0 0 8px ${color}` }}
            />
            {/* Sat Info card */}
            <AnimatePresence>
              {hoveredSat?.noradId === sat.noradId && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-5 left-1/2 -translate-x-1/2 w-52 bg-[#0B0D12]/98 border border-white/10 backdrop-blur-2xl p-3 rounded-xl shadow-2xl z-50 pointer-events-none"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-[9px] font-black text-white uppercase tracking-wider truncate pr-2">{sat.name}</div>
                    <div className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase text-white" style={{ background: color }}>
                      {sat.type}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-1 text-[7px] font-mono">
                    <span className="text-white/30">NORAD</span><span className="text-white/70">{sat.noradId}</span>
                    <span className="text-white/30">ALT</span><span className="text-white/70">{sat.alt.toFixed(0)} km</span>
                    <span className="text-white/30">VEL</span><span className="text-white/70">{sat.velocity.toFixed(2)} km/s</span>
                    <span className="text-white/30">INC</span><span className="text-white/70">{sat.inclination.toFixed(1)}°</span>
                    <span className="text-white/30">COUNTRY</span><span className="text-white/70">{sat.country}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* ── BOTTOM STATUS BAR ───────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 px-6 py-3 flex items-center justify-between bg-black/60 backdrop-blur-md border-t border-white/5 z-40">
        <div className="flex items-center gap-4">
          {FEED_STATUSES.map(f => {
            const st = statuses[f.id] ?? 'no_data';
            return (
              <div key={f.id} className="flex items-center gap-1.5">
                <span className="text-[8px]" style={{ color: freshnessColor(st) }}>{freshnessIcon(st)}</span>
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{f.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">
            SATs: {satellites?.length ?? 0} // HOTSPOTS: {hotspots?.length ?? 0} // CONV: {convergence?.length ?? 0}
          </span>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[7px] font-black text-cyan-400 uppercase tracking-widest">LIVE_ORBITAL_PHYSICS</span>
          </div>
        </div>
      </div>

      {/* ── TACTICAL HUD OVERLAY ───────────────────────────────────────────── */}
      <div className="absolute top-6 left-6 z-40 flex flex-col gap-4 pointer-events-none">
         <div className="flex items-center gap-3 px-3 py-1.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,1)] animate-pulse" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">Global Intelligence Layer Active</span>
         </div>
      </div>

      <div className="absolute top-6 right-6 z-40 flex items-center gap-6 px-4 py-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl pointer-events-none">
         <div className="flex flex-col items-end">
            <span className="text-[7px] font-black text-white/30 uppercase tracking-tighter mb-1">Grid Coordinates</span>
            <span className="text-[9px] font-mono text-cyan-400 font-bold tracking-widest">34.05°N // 118.24°W</span>
         </div>
         <div className="h-6 w-[1px] bg-white/10" />
         <div className="flex flex-col items-end">
            <span className="text-[7px] font-black text-white/30 uppercase tracking-tighter mb-1">UTC TIMESTAMP</span>
            <span className="text-[9px] font-mono text-white tracking-widest">{new Date().toISOString().slice(11, 19)}</span>
         </div>
      </div>
    </div>
  );
}
