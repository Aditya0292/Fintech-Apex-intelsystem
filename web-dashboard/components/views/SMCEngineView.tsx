"use client";

import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useApex } from "@/context/ApexContext";
import { motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════════════
   SMC Engine V8 — Institutional Smart Money Concepts Dashboard
   ═══════════════════════════════════════════════════════════════════════════ */

interface SMCData {
  confluence_long: number;
  confluence_short: number;
  setup_quality: number;
  structure: "UPTREND" | "DOWNTREND" | "CONSOLIDATION";
  premium_discount: number;
  sweep_detected: boolean;
  sweep_direction: "HIGH" | "LOW" | "NONE";
  kelly_base: number;
  kelly_adjusted: number;
  conflict: boolean;
  ob_bullish: boolean;
  ob_bearish: boolean;
  fvg_bullish: boolean;
  fvg_bearish: boolean;
  bos_confirmed: boolean;
  choch_confirmed: boolean;
  active_zones: { type: string; zone: string; freshness: number; side: "BULL" | "BEAR" }[];
}

const MOCK_SMC: Record<string, SMCData> = {
  XAUUSD: {
    confluence_long: 0.72, confluence_short: 0.15, setup_quality: 0.72,
    structure: "UPTREND", premium_discount: -0.65,
    sweep_detected: true, sweep_direction: "LOW",
    kelly_base: 2.0, kelly_adjusted: 2.0, conflict: false,
    ob_bullish: true, ob_bearish: false,
    fvg_bullish: true, fvg_bearish: false,
    bos_confirmed: true, choch_confirmed: false,
    active_zones: [
      { type: "OB", zone: "2730.50 – 2738.20", freshness: 1.0, side: "BULL" },
      { type: "FVG", zone: "2740.10 – 2742.60", freshness: 0.75, side: "BULL" },
      { type: "LIQ", zone: "2755.00 EQH", freshness: 0.5, side: "BEAR" },
    ],
  },
  EURUSD: {
    confluence_long: 0.30, confluence_short: 0.58, setup_quality: 0.58,
    structure: "DOWNTREND", premium_discount: 0.45,
    sweep_detected: false, sweep_direction: "NONE",
    kelly_base: 2.0, kelly_adjusted: 2.0, conflict: false,
    ob_bullish: false, ob_bearish: true,
    fvg_bullish: false, fvg_bearish: true,
    bos_confirmed: true, choch_confirmed: false,
    active_zones: [
      { type: "OB", zone: "1.0865 – 1.0872", freshness: 0.75, side: "BEAR" },
      { type: "FVG", zone: "1.0830 – 1.0841", freshness: 1.0, side: "BEAR" },
    ],
  },
  GBPUSD: {
    confluence_long: 0.55, confluence_short: 0.30, setup_quality: 0.55,
    structure: "CONSOLIDATION", premium_discount: -0.10,
    sweep_detected: false, sweep_direction: "NONE",
    kelly_base: 2.0, kelly_adjusted: 2.0, conflict: false,
    ob_bullish: true, ob_bearish: true,
    fvg_bullish: false, fvg_bearish: false,
    bos_confirmed: false, choch_confirmed: true,
    active_zones: [
      { type: "OB", zone: "1.2640 – 1.2652", freshness: 0.5, side: "BULL" },
    ],
  },
  USDJPY: {
    confluence_long: 0.40, confluence_short: 0.45, setup_quality: 0.40,
    structure: "DOWNTREND", premium_discount: 0.30,
    sweep_detected: true, sweep_direction: "HIGH",
    kelly_base: 2.0, kelly_adjusted: 1.0, conflict: true,
    ob_bullish: false, ob_bearish: true,
    fvg_bullish: false, fvg_bearish: true,
    bos_confirmed: false, choch_confirmed: false,
    active_zones: [
      { type: "OB", zone: "149.80 – 150.10", freshness: 1.0, side: "BEAR" },
      { type: "LIQ", zone: "150.50 EQH", freshness: 0.75, side: "BEAR" },
    ],
  },
};

const ASSETS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY"];

/* ── Reusable Sub-Components ───────────────────────────────────────────── */

function SignalPill({ label, active, bull }: { label: string; active: boolean; bull?: boolean }) {
  if (!active) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest bg-white/[0.02] text-muted-foreground/30 border border-white/[0.03]">
        {label}
      </span>
    );
  }
  const color = bull
    ? "bg-bull/10 text-bull border-bull/20 shadow-[0_0_15px_rgba(0,230,118,0.05)]"
    : "bg-bear/10 text-bear border-bear/20 shadow-[0_0_15px_rgba(255,82,82,0.05)]";
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${bull ? "bg-bull" : "bg-bear"} shadow-sm`} />
      {label}
    </span>
  );
}

function ConfluenceBar({ long, short }: { long: number; short: number }) {
  const neutral = Math.max(0, 1 - long - short);
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end px-0.5">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Long</span>
          <span className="text-sm font-black tabular-nums text-bull">{(long * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-baseline gap-2 text-right">
          <span className="text-sm font-black tabular-nums text-bear">{(short * 100).toFixed(0)}%</span>
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">Short</span>
        </div>
      </div>
      <div className="h-2 w-full bg-white/[0.03] rounded-full flex overflow-hidden ring-1 ring-white/5 p-[1px]">
        <motion.div
          className="h-full bg-gradient-to-r from-bull to-bull/60 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${long * 100}%` }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        />
        <div className="h-full" style={{ width: `${neutral * 100}%` }} />
        <motion.div
          className="h-full bg-gradient-to-l from-bear to-bear/60 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${short * 100}%` }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        />
      </div>
    </div>
  );
}

function FreshnessBar({ value, bull }: { value: number; bull: boolean }) {
  const bars = 4;
  const filled = Math.round(value * bars);
  return (
    <div className="flex items-center gap-[3px]">
      {[...Array(bars)].map((_, j) => (
        <div
          key={j}
          className={`w-[4px] h-4 rounded-[1px] transition-all duration-500 ${
            j < filled
              ? bull ? "bg-bull shadow-[0_0_8px_rgba(0,230,118,0.3)]" : "bg-bear shadow-[0_0_8px_rgba(255,82,82,0.3)]"
              : "bg-white/[0.05]"
          }`}
        />
      ))}
    </div>
  );
}

/* ── Asset Card ────────────────────────────────────────────────────────── */

function AssetSMCCard({ symbol, d }: { symbol: string; d: SMCData }) {
  const qualityColor =
    d.setup_quality > 0.65 ? "text-bull" :
    d.setup_quality > 0.4 ? "text-primary" :
    "text-muted-foreground";

  const structIcon = d.structure === "UPTREND" ? "↑" : d.structure === "DOWNTREND" ? "↓" : "◆";
  const structColor =
    d.structure === "UPTREND" ? "text-bull" :
    d.structure === "DOWNTREND" ? "text-bear" :
    "text-primary";

  const zoneLabel = d.premium_discount < -0.2 ? "DISCOUNT" : d.premium_discount > 0.2 ? "PREMIUM" : "EQUILIBRIUM";
  const zoneColor = d.premium_discount < -0.2 ? "text-bull" : d.premium_discount > 0.2 ? "text-bear" : "text-primary/60";

  return (
    <GlassCard className="p-4 rounded-2xl">
      <div className="space-y-4">

        {/* ─── Row 1: Header (Minimal) ─── */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-black tracking-[0.2em] text-foreground uppercase">{symbol}</h3>
            <span className={`text-[10px] font-black uppercase tracking-widest ${structColor}`}>
              {structIcon} {d.structure}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[7px] font-black uppercase text-white/20 tracking-widest">Quality</span>
            <span className={`text-base font-black tabular-nums leading-none ${qualityColor}`}>
              {(d.setup_quality * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* ─── Row 2: Confluence (Tight) ─── */}
        <div className="flex items-center gap-3 bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
           <div className="flex-1 h-1.5 bg-bull/10 rounded-full overflow-hidden">
             <motion.div initial={{ width: 0 }} animate={{ width: `${d.confluence_long * 100}%` }} className="h-full bg-bull" />
           </div>
           <span className="text-[9px] font-black tabular-nums text-white/30">VS</span>
           <div className="flex-1 h-1.5 bg-bear/10 rounded-full overflow-hidden flex justify-end">
             <motion.div initial={{ width: 0 }} animate={{ width: `${d.confluence_short * 100}%` }} className="h-full bg-bear" />
           </div>
        </div>

        {/* ─── Row 3: Signal Pills (Small) ─── */}
        <div className="flex flex-wrap gap-1.5">
          <SignalPill label="OB" active={d.ob_bullish || d.ob_bearish} bull={d.ob_bullish} />
          <SignalPill label="FVG" active={d.fvg_bullish || d.fvg_bearish} bull={d.fvg_bullish} />
          <SignalPill label="BOS" active={d.bos_confirmed} bull />
          <SignalPill label="CHoCH" active={d.choch_confirmed} bull />
        </div>

        {/* ─── Row 4: Premium / Discount (Minimal Slider) ─── */}
        <div className="bg-white/[0.01] p-3 rounded-xl border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Zone Position</span>
            <span className={`text-[9px] font-black uppercase tracking-widest ${zoneColor}`}>{zoneLabel}</span>
          </div>
          <div className="relative h-1 w-full bg-white/5 rounded-full">
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-glow-primary"
              initial={{ left: "50%" }}
              animate={{ left: `${50 + d.premium_discount * 50}%` }}
              style={{ marginLeft: "-4px" }}
            />
          </div>
        </div>

        {/* ─── Row 5: Active Zones (High Density) ─── */}
        <div className="space-y-1.5">
          {d.active_zones.slice(0, 2).map((z, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white/[0.02] border border-white/5 transition-none">
              <span className={`text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded ${z.side === "BULL" ? "text-bull bg-bull/5" : "text-bear bg-bear/5"}`}>
                {z.type}
              </span>
              <span className="text-[10px] font-mono text-white/40 tracking-tight">{z.zone}</span>
              <FreshnessBar value={z.freshness} bull={z.side === "BULL"} />
            </div>
          ))}
        </div>

        {/* ─── Row 6: Sizing (Minimal) ─── */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
           <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Kelly Sizing</span>
           <span className={`text-xs font-black tabular-nums ${d.conflict ? "text-primary" : "text-foreground"}`}>
             {d.kelly_adjusted}%
           </span>
        </div>
      </div>
    </GlassCard>
  );
}

/* ── Main View ─────────────────────────────────────────────────────────── */

export function SMCEngineView() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">

      {/* Header Section (Minimalist) */}
      <div className="px-10 py-8 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow-primary" />
          <h1 className="text-[10px] font-black uppercase tracking-[0.5em] text-foreground opacity-60">
            SMC Institutional Engine <span className="text-primary/40 ml-2">V8.2</span>
          </h1>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>
      </div>

      {/* Cards Grid (Compact) */}
      <div className="flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-w-[1600px] mx-auto">
          {ASSETS.map((symbol) => (
            <motion.div
              key={symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: ASSETS.indexOf(symbol) * 0.1 }}
            >
              <AssetSMCCard symbol={symbol} d={MOCK_SMC[symbol]} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
