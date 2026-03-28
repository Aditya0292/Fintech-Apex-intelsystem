"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Shield, TrendingUp, TrendingDown } from "lucide-react";

// ── DATA ─────────────────────────────────────────────────────────────────────

const currencyStrength = [
  { currency: "USD", strength: 72, trend: "up",   flag: "🇺🇸" },
  { currency: "GBP", strength: 61, trend: "up",   flag: "🇬🇧" },
  { currency: "AUD", strength: 55, trend: "up",   flag: "🇦🇺" },
  { currency: "CHF", strength: 50, trend: "flat", flag: "🇨🇭" },
  { currency: "NZD", strength: 44, trend: "down", flag: "🇳🇿" },
  { currency: "CAD", strength: 40, trend: "down", flag: "🇨🇦" },
  { currency: "EUR", strength: 33, trend: "down", flag: "🇪🇺" },
  { currency: "JPY", strength: 22, trend: "down", flag: "🇯🇵" },
];

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

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────────

function CorrelationCell({ value }: { value: number }) {
  if (value === 1) return <div className="text-center text-[10px] font-black text-foreground/20">—</div>;
  const color =
    value > 0.7  ? "text-bear"       :
    value > 0.4  ? "text-yellow-400" :
    value < -0.7 ? "text-blue-400"   :
    "text-bull";
  return <div className={cn("text-center text-[9px] font-bold tabular-nums", color)}>{value.toFixed(2)}</div>;
}

function CurrencyStrengthMeter() {
  const max = Math.max(...currencyStrength.map(c => c.strength));
  return (
    <GlassCard title="Currency Strength Meter" subtitle="8-Major Relative Strength (NLP + Cross-Pair)" glowColor="primary">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 mt-4">
        {currencyStrength.map((cur, i) => {
          const pct = (cur.strength / max) * 100;
          const isStrong = cur.strength >= 55;
          const isWeak   = cur.strength <= 40;
          const barColor = isStrong ? "bg-bull" : isWeak ? "bg-bear" : "bg-yellow-400";
          const textColor = isStrong ? "text-bull" : isWeak ? "text-bear" : "text-yellow-400";
          return (
            <motion.div
              key={cur.currency}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              className="flex items-center gap-3 min-w-0"
            >
              {/* Currency label */}
              <div className="flex items-center gap-1 w-16 flex-shrink-0">
                <span className="text-base leading-none">{cur.flag}</span>
                <span className={cn("text-[10px] font-black tracking-wider", textColor)}>{cur.currency}</span>
              </div>

              {/* Bar */}
              <div className="flex-1 min-w-0">
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.1, delay: i * 0.07, ease: [0.23, 1, 0.32, 1] }}
                    className={cn("h-full rounded-full", barColor)}
                  />
                </div>
              </div>

              {/* Score + trend */}
              <div className="flex items-center gap-1 w-14 flex-shrink-0 justify-end">
                <span className={cn("text-[9px] font-black tabular-nums", textColor)}>{cur.strength}</span>
                {cur.trend === "up"
                  ? <TrendingUp className="w-3 h-3 text-bull flex-shrink-0" />
                  : cur.trend === "down"
                  ? <TrendingDown className="w-3 h-3 text-bear flex-shrink-0" />
                  : <span className="text-[8px] text-muted-foreground">—</span>
                }
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-white/5">
        <span className="flex items-center gap-1.5 text-[8px] text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-bull inline-block" />Strong (&gt;55)
        </span>
        <span className="flex items-center gap-1.5 text-[8px] text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />Neutral (41–54)
        </span>
        <span className="flex items-center gap-1.5 text-[8px] text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-bear inline-block" />Weak (&lt;40)
        </span>
        <span className="ml-auto text-[8px] text-primary font-bold">
          Best Long Pair: USD/JPY · EUR/JPY
        </span>
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
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-[9px] border-separate border-spacing-0">
              <thead>
                <tr className="">
                  {correlationData[0].map((cell, ci) => (
                    <th key={ci} className="px-2 py-2 font-black text-muted-foreground text-[8px] text-center uppercase tracking-wider">
                      {cell as string}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlationData.slice(1).map((row, ri) => (
                  <tr key={ri} className="border-t border-white/5">
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={cn(
                          "px-2 py-2",
                          ci === 0 ? "font-black text-muted-foreground text-[8px] text-center" : ""
                        )}
                      >
                        {ci === 0
                          ? <div className="text-center">{cell as string}</div>
                          : <CorrelationCell value={cell as number} />
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex flex-wrap gap-3 justify-center text-[7px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-bear" /> High Positive (&gt;0.7)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> High Negative (&lt;-0.7)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-bull" /> Low / Safe</span>
            </div>
          </div>
        </GlassCard>

        {/* Kelly Engine */}
        <GlassCard title="Kelly Criterion Engine" subtitle="Optimal Position Sizing">
          <div className="flex flex-col gap-4 mt-4">
            {/* Kelly circle */}
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-center">
              <div className="text-[8px] text-muted-foreground uppercase tracking-widest mb-1">Kelly Fraction</div>
              <div className="text-4xl font-black text-primary tabular-nums">{(kellyFraction * 100).toFixed(0)}%</div>
              <div className="text-[8px] text-muted-foreground mt-1">of Equity Per Trade</div>
              <div className="mt-2 text-[9px] font-bold text-foreground/50">
                → Recommended Lot: <span className="text-primary">0.08</span> on $10K
              </div>
            </div>

            {/* Portfolio risk bar */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-3">Live Portfolio Risk</div>
              <div className="space-y-2 mb-3">
                {[
                  { label: "Active Positions", value: "2", color: "text-foreground" },
                  { label: "Total Risk Exposed", value: `${totalRiskPct}%`, color: "text-yellow-400" },
                  { label: "Remaining Allowance", value: `${(2 - totalRiskPct).toFixed(1)}%`, color: "text-bull" },
                ].map(m => (
                  <div key={m.label} className="flex justify-between text-[9px]">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className={cn("font-bold", m.color)}>{m.value}</span>
                  </div>
                ))}
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${(totalRiskPct / 2) * 100}%` }}
                  transition={{ duration: 1.2 }}
                  className="h-full bg-yellow-400 rounded-full"
                />
              </div>
            </div>

            {/* Safety rules */}
            <div>
              <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">Safety Rules</div>
              {riskRules.map((rule, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                  <span className="text-[8px] text-muted-foreground truncate mr-2">{rule.rule}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[8px] text-foreground/40 tabular-nums">{rule.current}/{rule.limit}</span>
                    <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", rule.safe ? "bg-bull" : "bg-bear")} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Drawdown Safeguard */}
        <GlassCard title="Drawdown Safeguard" subtitle="Equity Protection System" glowColor="primary">
          <div className="flex flex-col gap-4 mt-4">
            {/* DD stats grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Daily DD",      value: "-0.42%", safe: true },
                { label: "Weekly DD",     value: "-1.20%", safe: true },
                { label: "Max DD Limit",  value: "-5.00%", safe: true },
                { label: "Safety Mode",   value: "OFF",    safe: true },
              ].map((m, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                  <div className="text-[7px] text-muted-foreground mb-1">{m.label}</div>
                  <div className={cn("text-sm font-black tabular-nums", m.safe ? "text-bull" : "text-bear")}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Mini bar chart */}
            <div>
              <div className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-2">4-Day DD History</div>
              <div className="flex items-end gap-2 h-14">
                {drawdownHistory.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.dd / 2.5) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className={cn("w-full rounded-t", d.dd > 1.5 ? "bg-bear/50" : "bg-bull/50")}
                    />
                    <span className="text-[6px] text-muted-foreground">{d.date.replace("Mar ", "")}</span>
                    <span className={cn("text-[7px] font-bold", d.dd > 1.5 ? "text-bear" : "text-bull")}>-{d.dd}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safeguard status banner */}
            <div className="p-3 rounded-xl bg-bull/5 border border-bull/20 flex items-start gap-2">
              <Shield className="w-3.5 h-3.5 text-bull flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[8px] font-black text-bull uppercase tracking-widest mb-1">Safeguard Active</div>
                <p className="text-[7px] text-muted-foreground leading-relaxed">
                  All parameters within safe zone. Auto-close triggers at -5% DD. Monitoring 24/7.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

      </div>
    </div>
  );
}
