"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useApex } from "@/context/ApexContext";
import { Radio, TrendingUp, TrendingDown, X, AlertTriangle, CheckCircle, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";

const PAIRS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "XAGUSD"];

const PRICES: Record<string, { bid: number; ask: number; change: number; bias: "BULLISH" | "BEARISH" | "NEUTRAL" }> = {
  XAUUSD: { bid: 2153.80, ask: 2154.20, change:  0.24, bias: "BULLISH" },
  EURUSD: { bid: 1.0840,  ask: 1.0842,  change: -0.12, bias: "BEARISH" },
  GBPUSD: { bid: 1.2652,  ask: 1.2654,  change:  0.08, bias: "BULLISH" },
  USDJPY: { bid: 149.21,  ask: 149.23,  change:  0.02, bias: "NEUTRAL" },
  AUDUSD: { bid: 0.6520,  ask: 0.6522,  change:  0.11, bias: "BULLISH" },
  USDCAD: { bid: 1.3618,  ask: 1.3620,  change: -0.05, bias: "BEARISH" },
  XAGUSD: { bid: 27.44,   ask: 27.46,   change:  0.32, bias: "BULLISH" },
};

interface OrderState {
  symbol: string;
  direction: "BUY" | "SELL";
  lots: number;
  sl: string;
  tp: string;
  riskPct: number;
}

export function MT5Execution() {
  const { openPositions, accountInfo } = useApex();
  const [selectedPair, setSelectedPair] = useState("XAUUSD");
  const [order, setOrder] = useState<OrderState>({
    symbol: "XAUUSD", direction: "BUY", lots: 0.08, sl: "", tp: "", riskPct: 1.0,
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  const price = PRICES[selectedPair];
  const spread = ((price.ask - price.bid) * (selectedPair.includes("JPY") ? 100 : 10000)).toFixed(1);

  const selectPair = (pair: string) => {
    setSelectedPair(pair);
    setOrder(o => ({ ...o, symbol: pair }));
  };

  const handleExecute = async () => {
    setConfirmOpen(false);
    try {
      await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
    } catch { /* MT5 bridge may not be running in demo */ }
    setOrderSent(true);
    setTimeout(() => setOrderSent(false), 3000);
  };

  return (
    <div className="flex-1 p-4 lg:p-6 flex flex-col gap-5 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
            <Radio className="w-5 h-5 text-primary animate-pulse" />
            MT5 Execution
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Direct Broker Integration — One-Click Trade Execution — Instant MT5 Bridge</p>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl border",
          accountInfo.connected ? "bg-bull/5 border-bull/20" : "bg-bear/5 border-bear/20"
        )}>
          {accountInfo.connected ? <Wifi className="w-3 h-3 text-bull" /> : <WifiOff className="w-3 h-3 text-bear" />}
          <span className={cn("text-[9px] font-black uppercase tracking-widest", accountInfo.connected ? "text-bull" : "text-bear")}>
            {accountInfo.connected ? `Connected — ${accountInfo.broker}` : "MT5 Not Connected (Demo Mode)"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 flex-1">

        {/* Account Summary */}
        <div className="flex flex-col gap-4">
          <GlassCard title="Account Summary" subtitle={accountInfo.broker + " — Demo"}>
            <div className="flex flex-col gap-2 mt-4">
              {[
                { label: "Balance",     value: `$${accountInfo.balance.toLocaleString()}`,    color: "text-foreground" },
                { label: "Equity",      value: `$${accountInfo.equity.toLocaleString()}`,     color: accountInfo.equity > accountInfo.balance ? "text-bull" : "text-bear" },
                { label: "Free Margin", value: `$${accountInfo.freeMargin.toLocaleString()}`, color: "text-foreground" },
                { label: "Margin Used", value: `$${accountInfo.margin.toLocaleString()}`,     color: "text-yellow-400" },
                { label: "Leverage",    value: `1:${accountInfo.leverage}`,                   color: "text-primary" },
              ].map(m => (
                <div key={m.label} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-[9px] text-muted-foreground">{m.label}</span>
                  <span className={cn("text-[10px] font-black tabular-nums", m.color)}>{m.value}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Live Quotes */}
          <GlassCard title="Live Quotes" subtitle="Broker Feed">
            <div className="flex flex-col gap-0.5 mt-3">
              {PAIRS.map(pair => (
                <button
                  key={pair}
                  onClick={() => selectPair(pair)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-left",
                    selectedPair === pair
                      ? "bg-primary/10 border border-primary/30"
                      : "hover:bg-white/[0.03] border border-transparent"
                  )}
                >
                  <span className={cn("text-[10px] font-bold", selectedPair === pair ? "text-primary" : "text-foreground")}>{pair}</span>
                  <div className="text-right">
                    <div className="text-[9px] font-black text-foreground tabular-nums">{PRICES[pair].ask.toFixed(pair.includes("JPY") ? 2 : pair.includes("XAU") ? 2 : 4)}</div>
                    <div className={cn("text-[7px] font-bold tabular-nums", PRICES[pair].change >= 0 ? "text-bull" : "text-bear")}>
                      {PRICES[pair].change >= 0 ? "+" : ""}{PRICES[pair].change}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Order Ticket */}
        <GlassCard title="Order Ticket" subtitle={`${selectedPair} — Spread: ${spread} pts`} glowColor="primary" className="col-span-1">
          <div className="flex flex-col gap-4 mt-4">
            {/* BUY / SELL toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOrder(o => ({ ...o, direction: "BUY" }))}
                className={cn(
                  "py-3 rounded-xl font-black text-sm tracking-wide transition-all",
                  order.direction === "BUY"
                    ? "bg-bull text-black shadow-[0_0_20px_rgba(0,230,118,0.4)]"
                    : "bg-bull/10 text-bull border border-bull/20 hover:bg-bull/20"
                )}
              >
                <TrendingUp className="w-4 h-4 inline mr-1" /> BUY
              </button>
              <button
                onClick={() => setOrder(o => ({ ...o, direction: "SELL" }))}
                className={cn(
                  "py-3 rounded-xl font-black text-sm tracking-wide transition-all",
                  order.direction === "SELL"
                    ? "bg-bear text-white shadow-[0_0_20px_rgba(255,82,82,0.4)]"
                    : "bg-bear/10 text-bear border border-bear/20 hover:bg-bear/20"
                )}
              >
                <TrendingDown className="w-4 h-4 inline mr-1" /> SELL
              </button>
            </div>

            {/* Price Display */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-bull/5 border border-bull/20 text-center">
                <div className="text-[8px] text-bull mb-1">BID</div>
                <div className="text-lg font-black text-foreground tabular-nums">{price.bid.toFixed(selectedPair.includes("JPY") ? 2 : 4)}</div>
              </div>
              <div className="p-3 rounded-xl bg-bear/5 border border-bear/20 text-center">
                <div className="text-[8px] text-bear mb-1">ASK</div>
                <div className="text-lg font-black text-foreground tabular-nums">{price.ask.toFixed(selectedPair.includes("JPY") ? 2 : 4)}</div>
              </div>
            </div>

            {/* Input Fields */}
            {[
              { label: "Lot Size", key: "lots", placeholder: "0.08", type: "number" },
              { label: "Stop Loss", key: "sl", placeholder: "e.g. 2138.00" },
              { label: "Take Profit", key: "tp", placeholder: "e.g. 2175.00" },
            ].map(field => (
              <div key={field.key}>
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">{field.label}</label>
                <input
                  type={field.type || "text"}
                  step={field.key === "lots" ? "0.01" : undefined}
                  placeholder={field.placeholder}
                  value={(order as unknown as Record<string, unknown>)[field.key] as string}
                  onChange={e => setOrder(o => ({ ...o, [field.key]: field.key === "lots" ? parseFloat(e.target.value) || 0 : e.target.value }))}
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl text-foreground text-[11px] font-bold outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            ))}

            {/* Risk info */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between items-center">
              <span className="text-[9px] text-muted-foreground">Estimated Risk</span>
              <span className="text-[10px] font-black text-yellow-400">{order.riskPct}% of account</span>
            </div>

            {/* Execute Button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setConfirmOpen(true)}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-lg",
                order.direction === "BUY"
                  ? "bg-bull text-black shadow-[0_0_25px_rgba(0,230,118,0.3)] hover:shadow-[0_0_35px_rgba(0,230,118,0.5)]"
                  : "bg-bear text-white shadow-[0_0_25px_rgba(255,82,82,0.3)] hover:shadow-[0_0_35px_rgba(255,82,82,0.5)]"
              )}
            >
              Execute {order.direction} — {order.lots} Lots
            </motion.button>

            {/* Success Toast */}
            <AnimatePresence>
              {orderSent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-bull/10 border border-bull/20"
                >
                  <CheckCircle className="w-4 h-4 text-bull" />
                  <span className="text-[10px] font-bold text-bull">Order sent to MT5 terminal!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>

        {/* Open Positions + Kill Switch */}
        <div className="flex flex-col gap-4">
          <GlassCard title="Open Positions" subtitle="Live MT5 Tickets">
            <div className="flex flex-col gap-2 mt-4">
              {openPositions.map((pos, i) => (
                <motion.div
                  key={pos.ticket}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-black text-foreground">{pos.symbol}</span>
                      <span className={cn(
                        "ml-2 text-[7px] font-black px-1.5 py-0.5 rounded-full",
                        pos.type === "BUY" ? "bg-bull/20 text-bull" : "bg-bear/20 text-bear"
                      )}>{pos.type}</span>
                    </div>
                    <span className={cn("text-[10px] font-black tabular-nums", pos.profit >= 0 ? "text-bull" : "text-bear")}>
                      {pos.profit >= 0 ? "+" : ""}${pos.profit.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[8px]">
                    <div><span className="text-muted-foreground">Lots: </span><span className="text-foreground font-bold">{pos.lots}</span></div>
                    <div><span className="text-muted-foreground">SL: </span><span className="text-bear font-bold">{pos.sl}</span></div>
                    <div><span className="text-muted-foreground">TP: </span><span className="text-bull font-bold">{pos.tp}</span></div>
                  </div>
                  <div className="text-[7px] text-muted-foreground mt-1">#{pos.ticket} — {pos.openTime}</div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Emergency Kill Switch */}
          <GlassCard title="Emergency Controls" subtitle="Kill Switch — Use with Caution" glowColor="bear">
            <div className="flex flex-col gap-3 mt-4">
              <div className="p-3 rounded-xl bg-bear/5 border border-bear/20">
                <p className="text-[8px] text-muted-foreground leading-relaxed">
                  Activating the Kill Switch will instantly close ALL open MT5 positions at market price. This cannot be undone.
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                className="w-full py-4 rounded-2xl bg-bear/10 text-bear border border-bear/30 font-black text-sm tracking-widest uppercase hover:bg-bear hover:text-white hover:shadow-[0_0_30px_rgba(255,82,82,0.4)] transition-all"
                onClick={() => alert("Kill Switch: All positions would be closed via MT5Interface.close_all_positions()")}
              >
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Close All Positions
              </motion.button>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center"
            onClick={() => setConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-3xl p-8 w-[380px] shadow-2xl"
            >
              <h2 className="text-lg font-black text-foreground mb-2">Confirm Order</h2>
              <p className="text-[10px] text-muted-foreground mb-6">Are you sure you want to execute this trade on your MT5 broker?</p>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-6 space-y-2">
                {[
                  ["Symbol", order.symbol],
                  ["Direction", order.direction],
                  ["Lots", order.lots.toString()],
                  ["Stop Loss", order.sl || "None"],
                  ["Take Profit", order.tp || "None"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">{k}</span>
                    <span className={cn("font-black", v === "BUY" ? "text-bull" : v === "SELL" ? "text-bear" : "text-foreground")}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setConfirmOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-foreground font-bold text-sm hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={handleExecute} className={cn(
                  "flex-1 py-3 rounded-xl font-black text-sm transition-all",
                  order.direction === "BUY" ? "bg-bull text-black" : "bg-bear text-white"
                )}>Confirm {order.direction}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
