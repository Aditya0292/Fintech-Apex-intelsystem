"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link2, CheckCircle, ExternalLink, Search } from "lucide-react";
import { useState } from "react";

const signals = [
  { id: "APX-2026-0042", time: "2026-03-27 14:22", symbol: "XAUUSD", bias: "BUY",  conf: 88, status: "WIN",  pnl: "+$48.20", txHash: "0xf9a3...d71e", verified: true },
  { id: "APX-2026-0041", time: "2026-03-27 11:05", symbol: "EURUSD", bias: "SELL", conf: 72, status: "WIN",  pnl: "+$21.50", txHash: "0x2b8c...a3f2", verified: true },
  { id: "APX-2026-0040", time: "2026-03-26 18:30", symbol: "GBPUSD", bias: "BUY",  conf: 65, status: "LOSS", pnl: "-$12.00", txHash: "0x7c4e...88b1", verified: true },
  { id: "APX-2026-0039", time: "2026-03-26 09:00", symbol: "USDJPY", bias: "SELL", conf: 79, status: "WIN",  pnl: "+$33.75", txHash: "0x1a2d...c9f0", verified: true },
  { id: "APX-2026-0038", time: "2026-03-25 16:45", symbol: "XAUUSD", bias: "BUY",  conf: 91, status: "WIN",  pnl: "+$67.10", txHash: "0x4d5b...7f3a", verified: true },
  { id: "APX-2026-0037", time: "2026-03-25 10:20", symbol: "GBPUSD", bias: "SELL", conf: 58, status: "LOSS", pnl: "-$9.50",  txHash: "0x8e6a...2c1b", verified: true },
  { id: "APX-2026-0036", time: "2026-03-24 20:15", symbol: "EURUSD", bias: "BUY",  conf: 82, status: "WIN",  pnl: "+$29.00", txHash: "0xa7f1...5e8d", verified: true },
  { id: "APX-2026-0035", time: "2026-03-24 13:00", symbol: "XAUUSD", bias: "BUY",  conf: 76, status: "WIN",  pnl: "+$41.30", txHash: "0x3c9d...b4f7", verified: true },
];

const stats = [
  { label: "Total Signals",    value: "42",   color: "text-foreground" },
  { label: "Anchored On-Chain",value: "42",   color: "text-bull" },
  { label: "Win Rate",         value: "75%",  color: "text-bull" },
  { label: "Avg Confidence",   value: "76.4%",color: "text-primary" },
  { label: "Verified Wins",    value: "31",   color: "text-bull" },
  { label: "Verified Losses",  value: "11",   color: "text-bear" },
];

export function VerificationLedger() {
  const [search, setSearch] = useState("");
  const filtered = signals.filter(s =>
    s.symbol.includes(search.toUpperCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.txHash.includes(search)
  );

  return (
    <div className="flex-1 p-4 lg:p-6 flex flex-col gap-5 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
            <Link2 className="w-5 h-5 text-primary" />
            Verification Ledger
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Blockchain-Anchored Signal History — Polygon Amoy Testnet — Immutable Proof</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bull/5 border border-bull/20">
          <CheckCircle className="w-3 h-3 text-bull" />
          <span className="text-[9px] font-black text-bull uppercase tracking-widest">All 42 Signals Verified On-Chain</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 flex-shrink-0">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="p-3 rounded-2xl bg-card/40 backdrop-blur-xl border border-border text-center"
          >
            <div className="text-[8px] text-muted-foreground mb-1 uppercase tracking-wider">{s.label}</div>
            <div className={cn("text-lg font-black tabular-nums", s.color)}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Search & Table */}
      <GlassCard title="Signal History" subtitle="Click any signal to view on Polygon Explorer" className="flex-1">
        {/* Search */}
        <div className="flex items-center gap-2 mt-4 mb-4 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-[11px]">
          <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by symbol, ID, or TX hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-foreground placeholder-muted-foreground outline-none flex-1 text-[10px]"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[9px]">
            <thead>
              <tr className="border-b border-white/5">
                {["Signal ID", "Time", "Symbol", "Direction", "Confidence", "Status", "P&L", "TX Hash", "Proof"].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[8px] font-black text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((sig, i) => (
                <motion.tr
                  key={sig.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  <td className="px-3 py-2.5 font-mono text-muted-foreground">{sig.id}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{sig.time}</td>
                  <td className="px-3 py-2.5 font-bold text-foreground">{sig.symbol}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[7px] font-black",
                      sig.bias === "BUY" ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"
                    )}>{sig.bias}</span>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-primary font-bold">{sig.conf}%</td>
                  <td className="px-3 py-2.5">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[7px] font-black",
                      sig.status === "WIN" ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"
                    )}>{sig.status}</span>
                  </td>
                  <td className={cn("px-3 py-2.5 font-black tabular-nums", sig.pnl.startsWith("+") ? "text-bull" : "text-bear")}>{sig.pnl}</td>
                  <td className="px-3 py-2.5 font-mono text-muted-foreground text-[8px]">{sig.txHash}</td>
                  <td className="px-3 py-2.5">
                    <a
                      href={`https://www.oklink.com/amoy/tx/${sig.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-bull hover:text-bull/80 transition-colors group-hover:scale-105"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CheckCircle className="w-3 h-3" />
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
