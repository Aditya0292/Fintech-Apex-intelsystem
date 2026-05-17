"use client";

import React from "react";
import { motion } from "framer-motion";
import { useApex } from "@/context/ApexContext";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { 
  Zap, 
  Target, 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle,
  Search,
  RefreshCw,
  Cpu,
  BarChart3
} from "lucide-react";

export default function Opportunities() {
  const { liveData, isScanning, triggerScan } = useApex();
  
  const opportunities = liveData?.ranking || [];
  
  return (
    <div className="flex-1 flex flex-col h-full bg-[#030303] overflow-hidden text-white/90 selection:bg-primary/30">
      
      {/* ── HEADER: SCAN CONTROL CENTER ───────────────────────────────────── */}
      <div className="px-10 py-10 bg-gradient-to-b from-primary/5 to-transparent border-b border-white/5 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
         
         <div className="relative z-10 flex items-end justify-between">
            <div className="flex flex-col gap-4">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-glow-primary">
                     <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                     <h1 className="text-3xl font-black uppercase tracking-[0.2em] leading-none mb-2">Alpha_Opportunity_Hub</h1>
                     <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-bull/10 border border-bull/20">
                           <div className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse" />
                           <span className="text-[8px] font-black text-bull uppercase tracking-widest">Neural_Uplink_Active</span>
                        </div>
                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em]">Build_V8.9.2_Elite</span>
                     </div>
                  </div>
               </div>
               
               <p className="max-w-xl text-xs font-bold text-white/40 leading-relaxed uppercase tracking-tight">
                  Engage the global neural network to scan all liquid assets for high-probability SMC confluences and institutional order flow anomalies.
               </p>
            </div>

            <button 
               onClick={triggerScan}
               disabled={isScanning}
               className={cn(
                  "relative group px-10 py-5 rounded-2xl overflow-hidden transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                  isScanning 
                    ? "bg-white/5 border border-white/10" 
                    : "bg-primary border border-primary shadow-[0_0_40px_hsla(var(--primary),0.3)] hover:shadow-[0_0_60px_hsla(var(--primary),0.5)]"
               )}
            >
               <div className="relative z-10 flex items-center gap-4">
                  {isScanning ? (
                    <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <Cpu className="w-5 h-5 text-black" />
                  )}
                  <span className={cn(
                     "text-sm font-black uppercase tracking-[0.2em]",
                     isScanning ? "text-primary" : "text-black"
                  )}>
                     {isScanning ? "Scanning_Neural_Lattice..." : "Engage_Global_Scan"}
                  </span>
               </div>
               
               {/* Animated Background Overlay */}
               {!isScanning && (
                 <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
               )}
            </button>
         </div>
      </div>

      {/* ── GRID: ACTIVE OPPORTUNITIES ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
         <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
            
            {opportunities.length > 0 ? opportunities.map((opp: any, i: number) => (
              <motion.div
                key={opp.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard className="group relative overflow-hidden">
                   {/* Background Rank Indicator */}
                   <div className="absolute top-[-20px] right-[-20px] text-[120px] font-black text-white/[0.02] leading-none select-none pointer-events-none">
                      0{i+1}
                   </div>

                   <div className="p-8">
                      <div className="flex items-center justify-between mb-8">
                         <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-xl font-black text-primary group-hover:border-primary/40 transition-colors">
                               {opp.symbol ? opp.symbol.slice(0, 3) : "???"}
                            </div>
                            <div>
                               <h3 className="text-xl font-black uppercase tracking-widest">{opp.symbol}</h3>
                               <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Confidence:</span>
                                  <span className="text-[9px] font-black text-primary uppercase tracking-widest">{Math.round(opp.confidence * 100)}%</span>
                               </div>
                            </div>
                         </div>
                         
                         <div className={cn(
                            "px-4 py-1.5 rounded-xl border font-black text-[10px] uppercase tracking-[0.1em]",
                            opp.bias === "BULLISH" 
                              ? "bg-bull/10 border-bull/20 text-bull shadow-[0_0_15px_hsla(var(--bull),0.1)]" 
                              : opp.bias === "BEARISH"
                                ? "bg-bear/10 border-bear/20 text-bear shadow-[0_0_15px_hsla(var(--bear),0.1)]"
                                : "bg-white/5 border-white/10 text-white/40 shadow-none"
                         )}>
                            {opp.bias}
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                         <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                            <span className="block text-[8px] font-black text-white/20 uppercase tracking-widest mb-1.5">Alpha_Signal</span>
                            <span className="text-xs font-black uppercase text-white/90 tracking-tight">{opp.reason || "SMC_CONFLUENCE"}</span>
                         </div>
                         <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                            <span className="block text-[8px] font-black text-white/20 uppercase tracking-widest mb-1.5">Risk_Profile</span>
                            <span className="text-xs font-black uppercase text-white/90 tracking-tight">{opp.risk_score || "LOW_TACTICAL"}</span>
                         </div>
                      </div>

                      <div className="space-y-3 mb-8">
                         <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                            <span className="text-white/30">Entry_Zone</span>
                            <span className="text-white/90 font-mono tracking-widest">SCANNING...</span>
                         </div>
                         <div className="h-1 w-full bg-white/[0.03] rounded-full overflow-hidden">
                            <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${opp.confidence * 100}%` }}
                               className="h-full bg-primary shadow-[0_0_10px_hsla(var(--primary),0.5)]" 
                            />
                         </div>
                      </div>

                      <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/40 transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 group/btn">
                         Initiate_Tactical_Deployment
                         <TrendingUp className="w-3 h-3 text-primary group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                      </button>
                   </div>
                </GlassCard>
              </motion.div>
            )) : (
               <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-20">
                  <Search className="w-20 h-20 mb-8 animate-pulse text-primary" />
                  <h2 className="text-2xl font-black uppercase tracking-[0.4em]">Grid_Empty_No_Opportunities</h2>
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em]">Engage the global scan to populate intelligence matrix.</p>
               </div>
            )}

         </div>
      </div>

      {/* ── FOOTER: SYSTEM STATUS ─────────────────────────────────────────── */}
      <div className="px-10 py-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
               <Cpu className="w-4 h-4 text-white/20" />
               <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Compute_Units: 128_GPU_NODES</span>
            </div>
            <div className="flex items-center gap-3">
               <ShieldCheck className="w-4 h-4 text-bull/40" />
               <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Verification: HASH_SECURE</span>
            </div>
         </div>
         
         <div className="flex items-center gap-4">
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Session_Uptime: 04:12:34</span>
            <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-glow-primary" />
         </div>
      </div>

    </div>
  );
}
