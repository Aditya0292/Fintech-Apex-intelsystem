"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import { useApex } from "@/context/ApexContext";

export function MultiTimeframeStatus() {
  const { activeSymbol, liveData } = useApex();
  
  let tfs = [
    { label: "1D", status: "NEUTRAL", value: 50 },
    { label: "4H", status: "NEUTRAL", value: 50 },
    { label: "1H", status: "NEUTRAL", value: 50 },
  ];
  
  if (liveData && liveData.assets && liveData.assets[activeSymbol]) {
      const preds = liveData.assets[activeSymbol].predictions || {};
      tfs = [
        { 
          label: "1D", 
          status: preds["Daily"]?.signal?.toUpperCase() || "NEUTRAL", 
          value: preds["Daily"]?.confidence ? Math.round(preds["Daily"].confidence * 100) : 50 
        },
        { 
          label: "4H", 
          status: preds["4 Hour"]?.signal?.toUpperCase() || "NEUTRAL", 
          value: preds["4 Hour"]?.confidence ? Math.round(preds["4 Hour"].confidence * 100) : 50 
        },
        { 
          label: "1H", 
          status: preds["1 Hour"]?.signal?.toUpperCase() || "NEUTRAL", 
          value: preds["1 Hour"]?.confidence ? Math.round(preds["1 Hour"].confidence * 100) : 50 
        },
      ];
  }
  return (
    <GlassCard title="MTF Alignment" subtitle="Timeframe Synergy" className="h-full">
      <div className="flex flex-col gap-6 mt-6">
        {tfs.map((tf, idx) => (
          <div key={idx} className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-medium tracking-wide">
              <span className="text-white/40 uppercase">{tf.label} BIAS</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[8px] font-bold tabular-nums",
                tf.status === "BULLISH" ? "bg-bull/10 text-bull" : 
                tf.status === "BEARISH" ? "bg-bear/10 text-bear" : 
                "bg-white/5 text-white/60"
              )}>
                {tf.status}
              </span>
            </div>
            
            <div className="h-1 lg:h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${tf.value}%` }}
                transition={{ duration: 1.5, delay: 0.2 * idx }}
                className={cn(
                  "h-full rounded-full relative",
                  tf.status === "BULLISH" ? "bg-bull shadow-[0_0_10px_#00E676]" : 
                  tf.status === "BEARISH" ? "bg-bear shadow-[0_0_10px_#FF5252]" : 
                  "bg-white/20"
                )}
              />
            </div>
          </div>
        ))}
        
        <div className="mt-4 pt-6 border-t border-white/5 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-medium text-white/40 uppercase tracking-wide">Global Confluence</span>
            <span className="text-xs font-bold text-primary glow-orange animate-pulse">MODERATE</span>
          </div>
          <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-around">
             <div className="text-center">
                <div className="text-[10px] font-medium text-white/40 uppercase">Long</div>
                <div className="text-sm font-bold text-bull tabular-nums tracking-tight">42%</div>
             </div>
             <div className="w-[1px] h-8 bg-white/5" />
             <div className="text-center">
                <div className="text-[10px] font-medium text-white/40 uppercase">Short</div>
                <div className="text-sm font-bold text-bear tabular-nums tracking-tight">38%</div>
             </div>
             <div className="w-[1px] h-8 bg-white/5" />
             <div className="text-center">
                <div className="text-[10px] font-medium text-white/40 uppercase">Neutral</div>
                <div className="text-sm font-bold text-white/40 tabular-nums tracking-tight">20%</div>
             </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
