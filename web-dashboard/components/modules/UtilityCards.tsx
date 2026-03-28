"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, Activity, ShieldAlert } from "lucide-react";

export function UtilityCards() {
  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      <GlassCard className="h-full flex flex-col justify-between p-4 group" glowColor="bull">
         <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-xl bg-bull/20 flex items-center justify-center text-bull">
               <TrendingUp className="w-4 h-4" />
            </div>
            <div className="text-right">
               <div className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">Momentum</div>
               <div className="text-lg font-bold text-white tabular-nums">+84.2</div>
            </div>
         </div>
         <div className="mt-4">
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                  animate={{ scaleX: 1.2, x: ["-100%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="h-full w-1/2 bg-bull/40 blur-[2px]"
               />
            </div>
            <div className="flex justify-between mt-2">
               <span className="text-[9px] font-bold text-bull uppercase">Strong Buy</span>
               <span className="text-[9px] font-bold text-white/20 tabular-nums">98.4ms</span>
            </div>
         </div>
      </GlassCard>

      <GlassCard className="h-full flex flex-col justify-between p-4 group" glowColor="bear">
         <div className="flex justify-between items-start">
            <div className="w-8 h-8 rounded-xl bg-bear/20 flex items-center justify-center text-bear">
               <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-right">
               <div className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">Risk Index</div>
               <div className="text-lg font-bold text-white tabular-nums">12.4%</div>
            </div>
         </div>
         <div className="mt-4">
            <div className="text-[9px] font-bold text-white/60 mb-2 font-mono">STABILITY SECURE</div>
            <div className="flex gap-1">
               {Array.from({ length: 5 }).map((_, i) => (
                 <div key={i} className={cn("h-1 flex-1 rounded-full", i < 4 ? "bg-bear/60 shadow-[0_0_8px_rgba(255,82,82,0.4)]" : "bg-white/10")} />
               ))}
            </div>
         </div>
      </GlassCard>
    </div>
  );
}
