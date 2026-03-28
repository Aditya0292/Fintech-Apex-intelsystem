"use client";

import { useApex } from "@/context/ApexContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function OpportunityRunway() {
  const { setups } = useApex();

  return (
    <GlassCard title="Opportunity Runway" subtitle="Alpha Rankings" className="h-full">
      <div className="flex flex-col gap-3 mt-4">
        {setups.map((setup, idx) => (
          <div key={idx} className="group flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden">
            <div className="flex items-center gap-3 relative z-10">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold border transition-transform group-hover:scale-105",
                setup.bias === "BULLISH" ? "border-bull/20 text-bull bg-bull/5" : 
                setup.bias === "BEARISH" ? "border-bear/20 text-bear bg-bear/5" : 
                "border-white/20 text-white/40 bg-white/5"
              )}>
                {setup.confidence}%
              </div>
              <div>
                <div className="text-[11px] font-bold text-foreground tracking-tight uppercase">{setup.symbol}</div>
                <div className="text-[9px] text-muted-foreground font-medium uppercase tracking-wide mt-0.5">{setup.timeframe} Institutional</div>
              </div>
            </div>
            
            <div className="text-right relative z-10">
              <div className={cn(
                "text-[9px] font-bold px-2 py-0.5 rounded-full mb-1 inline-block tracking-widest uppercase",
                setup.bias === "BULLISH" ? "bg-bull/20 text-bull" : 
                setup.bias === "BEARISH" ? "bg-bear/20 text-bear" : 
                "bg-white/10 text-white"
              )}>
                {setup.bias}
              </div>
              <div className="text-[11px] font-semibold text-primary flex items-center justify-end gap-1 tracking-tight tabular-nums">
                RR: {setup.rr}
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
