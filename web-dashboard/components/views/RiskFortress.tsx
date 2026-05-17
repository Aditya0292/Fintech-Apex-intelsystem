"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Shield, TrendingUp, TrendingDown, RotateCw } from "lucide-react";
import { useApex } from "@/context/ApexContext";
import { useState } from "react";

// ── DATA ─────────────────────────────────────────────────────────────────────

const correlationData = [
  ["",        "XAUUSD", "EURUSD", "GBPUSD", "USDJPY"],
  ["XAUUSD",     1.0,     0.62,     0.54,    -0.71],
  ["EURUSD",    0.62,      1.0,     0.91,    -0.83],
  ["GBPUSD",    0.54,     0.91,      1.0,    -0.76],
  ["USDJPY",   -0.71,    -0.83,    -0.76,      1.0],
];

const drawdownHistory = [
  { date: "Mar 25", dd: 1.2 },
  { date: "Mar 26", dd: 0.8 },
  { date: "Mar 27", dd: 2.1 },
  { date: "Mar 28", dd: 0.4 },
];

const riskRules = [
  { rule: "Max Daily Loss",       limit: "2.00%",  current: "0.42%",  safe: true },
  { rule: "Max Open Positions",   limit: "5",      current: "2",      safe: true },
  { rule: "Max Corr. Exposure",   limit: "70%",    current: "62%",    safe: true },
  { rule: "Max Single Risk",      limit: "1.00%",  current: "0.80%",  safe: true },
  { rule: "Drawdown Safety Mode", limit: "-5.00%", current: "-0.42%", safe: true },
];

function CorrelationCell({ value }: { value: number }) {
  if (value === 1) return <div className="text-center text-[10px] font-black text-foreground/10">1.0</div>;
  const color =
    value > 0.7  ? "text-bear"       :
    value > 0.4  ? "text-yellow-400" :
    value < -0.7 ? "text-blue-400"   :
    "text-bull";
  return <div className={cn("text-center text-[10px] font-institutional font-black tabular-nums", color)}>{value.toFixed(2)}</div>;
}

function CurrencyStrengthMeter() {
  const { liveData, triggerCSMRefresh } = useApex();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Parse live CSM data
  const rawCsm = liveData?.market_context?.csm || { USD: 5, EUR: 5, GBP: 5, JPY: 5, AUD: 5, CAD: 5, CHF: 5, NZD: 5 };
  const currencyStrength = Object.entries(rawCsm).map(([currency, strength]: [string, any]) => ({
    currency,
    strength: parseFloat(strength.toFixed(1)),
    flag: currency === "USD" ? "🇺🇸" : currency === "GBP" ? "🇬🇧" : currency === "AUD" ? "🇦🇺" : currency === "CHF" ? "🇨🇭" : currency === "NZD" ? "🇳🇿" : currency === "CAD" ? "🇨🇦" : currency === "EUR" ? "🇪🇺" : "🇯🇵"
  })).sort((a, b) => b.strength - a.strength);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await triggerCSMRefresh?.();
    } finally {
      setIsRefreshing(false);
    }
  };

  const HeaderExtra = (
    <button 
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={cn(
        "flex items-center gap-2 px-3 py-1 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-all group",
        isRefreshing && "opacity-50 cursor-not-allowed"
      )}
    >
      <RotateCw className={cn("w-3 h-3 text-primary transition-transform duration-700", isRefreshing && "animate-spin")} />
      <span className="text-[9px] font-black uppercase tracking-widest text-primary/80 group-hover:text-primary">Quick Refresh</span>
    </button>
  );

  return (
    <GlassCard 
      title="Currency Strength Meter" 
      subtitle="Institutional Capital Flow Analysis" 
      glowColor="primary"
      headerExtra={HeaderExtra}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-6 mt-6">
        {currencyStrength.map((cur, i) => {
          const isStrong = cur.strength > 6.5;
          const isWeak   = cur.strength < 3.5;
          const barColor = isStrong ? "bg-bull shadow-[0_0_10px_rgba(0,230,118,0.3)]" : isWeak ? "bg-bear shadow-[0_0_10px_rgba(255,82,82,0.3)]" : "bg-primary/40";
          const textColor = isStrong ? "text-bull" : isWeak ? "text-bear" : "text-white/60";
          const progress = (cur.strength / 10) * 100;

          return (
            <motion.div
              key={cur.currency}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col gap-2 group"
            >
              <div className="flex justify-between items-end px-0.5">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black tracking-widest text-foreground/90 uppercase">{cur.currency}</span>
                   <span className="text-[10px] opacity-40">{cur.flag}</span>
                </div>
                <span className={cn("text-[11px] font-institutional font-black tabular-nums tracking-tighter", textColor)}>{cur.strength.toFixed(1)}</span>
              </div>

              <div className="h-[3px] w-full bg-white/[0.03] rounded-full overflow-hidden relative border border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, delay: i * 0.1, ease: "circOut" }}
                  className={cn("h-full rounded-full transition-all duration-700", barColor)}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/[0.04]">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-bull" />
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Expansion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Compression</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-bear" />
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Contraction</span>
          </div>
        </div>
        <div className="text-[9px] font-institutional font-black text-primary/80 uppercase tracking-[0.1em] px-3 py-1 rounded-lg bg-primary/5 border border-primary/10">
          Cycle State: {currencyStrength[0].currency} Momentum Lead
        </div>
      </div>
    </GlassCard>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

export function RiskFortress() {
  const totalRiskPct = 1.2;
  const kellyFraction = 0.23;

  return (
    <div className="flex-1 p-4 lg:p-6 flex flex-col gap-5 overflow-y-auto h-full">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-lg lg:text-xl font-black text-foreground tracking-tight flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            Risk Fortress
          </h1>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Currency Strength · Portfolio Protection · Drawdown Safeguard · Kelly Engine
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bull/5 border border-bull/20">
          <div className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse" />
          <span className="text-[8px] font-black text-bull uppercase tracking-widest">All Clear — Safe Zone</span>
        </div>
      </div>

      {/* ── Row 1: Currency Strength Meter (full width) ── */}
      <div className="flex-shrink-0">
        <CurrencyStrengthMeter />
      </div>

      {/* ── Row 2: 3-col grid (stacks on medium screens) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

        {/* Correlation Matrix */}
        <GlassCard title="Asset Correlation Matrix" subtitle="Exposure Overlap Detection">
          <div className="mt-6 overflow-x-auto custom-scrollbar">
            <table className="w-full text-[10px] border-separate border-spacing-0">
              <thead>
                <tr>
                  {correlationData[0].map((cell, ci) => (
                    <th key={ci} className="px-3 py-3 font-black text-white/20 text-[8px] text-center uppercase tracking-[0.2em] border-b border-white/5">
                      {cell as string}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlationData.slice(1).map((row, ri) => (
                  <tr key={ri} className="group hover:bg-white/[0.02] transition-colors">
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={cn(
                          "px-3 py-3 border-b border-white/[0.03]",
                          ci === 0 ? "font-black text-white/40 text-[8px] text-center uppercase tracking-wider bg-white/[0.01]" : ""
                        )}
                      >
                        {ci === 0
                          ? cell as string
                          : <CorrelationCell value={cell as number} />
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-5 flex flex-wrap gap-4 justify-center">
              <span className="flex items-center gap-2 text-[7px] font-black text-white/20 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-bear" /> High Positive
              </span>
              <span className="flex items-center gap-2 text-[7px] font-black text-white/20 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> High Negative
              </span>
              <span className="flex items-center gap-2 text-[7px] font-black text-white/20 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-bull" /> Optimized
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Kelly Engine */}
        <GlassCard title="Kelly Criterion Engine" subtitle="Optimal Position Sizing">
          <div className="flex flex-col gap-6 mt-6">
            {/* Kelly circle */}
            <div className="p-6 rounded-[2rem] bg-primary/[0.03] border border-primary/10 text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full" />
              <div className="text-[9px] text-primary/40 font-black uppercase tracking-[0.2em] mb-2">Target Exposure</div>
              <div className="text-5xl font-institutional font-black text-primary tabular-nums tracking-tighter">{(kellyFraction * 100).toFixed(0)}%</div>
              <div className="text-[8px] text-white/20 mt-2 uppercase font-bold tracking-widest">Equity Utilization</div>
              <div className="mt-4 text-[10px] font-black text-foreground/60">
                LOT RECOMMENDATION: <span className="text-primary tracking-tighter">0.08 / $10K</span>
              </div>
            </div>

            {/* Portfolio risk bar */}
            <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 shadow-inner">
              <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Risk Distribution</div>
              <div className="space-y-3 mb-4">
                {[
                  { label: "Active Positions", value: "2", color: "text-foreground/80" },
                  { label: "Total Risk Exposed", value: `${totalRiskPct}%`, color: "text-yellow-400" },
                  { label: "Remaining Allowance", value: `${(2 - totalRiskPct).toFixed(1)}%`, color: "text-bull" },
                ].map(m => (
                  <div key={m.label} className="flex justify-between text-[10px] font-bold">
                    <span className="text-white/30 uppercase tracking-tight">{m.label}</span>
                    <span className={cn("tabular-nums", m.color)}>{m.value}</span>
                  </div>
                ))}
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden relative">
                <motion.div
                  animate={{ width: `${(totalRiskPct / 2) * 100}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                  className="h-full bg-gradient-to-r from-bull to-yellow-400 rounded-full"
                />
              </div>
            </div>

            {/* Safety rules */}
            <div className="space-y-1">
              {riskRules.map((rule, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/[0.02] transition-colors">
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-tight">{rule.rule}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-institutional font-black text-foreground/40 tabular-nums tracking-tighter">{rule.current} / {rule.limit}</span>
                    <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(var(--color),0.5)]", rule.safe ? "bg-bull" : "bg-bear")} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Drawdown Safeguard */}
        <GlassCard title="Drawdown Safeguard" subtitle="Equity Protection System" glowColor="primary">
          <div className="flex flex-col gap-6 mt-6">
            {/* DD stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "DAILY_DD",      value: "-0.42%", safe: true },
                { label: "WEEKLY_DD",     value: "-1.20%", safe: true },
                { label: "MAX_LIMIT",     value: "-5.00%", safe: true },
                { label: "SAFEGUARD",     value: "STABLE", safe: true },
              ].map((m, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col items-center justify-center gap-1 shadow-sm">
                  <div className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em]">{m.label}</div>
                  <div className={cn("text-[12px] font-institutional font-black tabular-nums tracking-tighter", m.safe ? "text-bull" : "text-bear")}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Mini bar chart */}
            <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
              <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 text-center">Exposure Volatility (4D)</div>
              <div className="flex items-end gap-3 h-16 px-2">
                {drawdownHistory.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="relative w-full flex flex-col items-center justify-end h-full">
                       <motion.div
                         initial={{ height: 0 }}
                         animate={{ height: `${(d.dd / 2.5) * 100}%` }}
                         transition={{ duration: 1.2, delay: i * 0.1, ease: "circOut" }}
                         className={cn("w-full rounded-t-lg transition-all group-hover:brightness-125 shadow-[0_0_15px_rgba(var(--c),0.2)]", d.dd > 1.5 ? "bg-bear/40" : "bg-bull/40")}
                       />
                    </div>
                    <span className="text-[7px] font-black text-white/20 uppercase tabular-nums">{d.date.split(" ")[1]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safeguard status banner */}
            <div className="p-4 rounded-2xl bg-bull/5 border border-bull/10 flex items-start gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-12 h-12 bg-bull/5 blur-2xl rounded-full" />
              <Shield className="w-5 h-5 text-bull flex-shrink-0 mt-0.5 opacity-50" />
              <div>
                <div className="text-[9px] font-black text-bull uppercase tracking-[0.2em] mb-1">Protection Uplink Active</div>
                <p className="text-[8px] text-white/40 leading-relaxed font-bold tracking-tight uppercase">
                  All systems nominal. Automated liquidation protocol armed at -5% threshold.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

      </div>
    </div>
  );
}
