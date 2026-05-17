"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Shield, Globe, MessageSquare, ChevronRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

import { useApex } from "@/context/ApexContext";

export function GeopoliticalNewsFeed() {
  const { liveData } = useApex();
  
  // Use live news from market context, or fallback to an empty list
  const reports = liveData?.market_context?.news || [];

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/5">
      <div className="px-6 py-5 border-b border-white/5 bg-white/[0.01] flex items-center justify-between shrink-0">
         <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-primary" />
            <h3 className="text-[11px] font-black text-white/90 uppercase tracking-[0.2em]">Geopolitical_SitRep</h3>
         </div>
         <div className="flex items-center gap-2">
            <motion.div 
               animate={{ opacity: [1, 0, 1] }}
               transition={{ duration: 1.5, repeat: Infinity }}
               className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),1)]" 
            />
            <span className="text-[9px] font-black text-primary uppercase tracking-widest">Live_Matrix</span>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
         {reports.length > 0 ? reports.map((report: any, i: number) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, x: -10 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: i * 0.05 }}
             className="relative p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 hover:bg-white/[0.04] transition-all group cursor-pointer"
           >
              <div className="flex justify-between items-start mb-2.5">
                 <div className="flex items-center gap-2">
                    <span className={cn(
                       "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                       report.impact === "HIGH" ? "bg-bear/20 text-bear border border-bear/10" : "bg-primary/20 text-primary border border-primary/10"
                    )}>
                       {report.impact === "HIGH" ? "CRITICAL" : "STABLE"}
                    </span>
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest tracking-tighter truncate max-w-[200px]">
                        {report.source || "Global_Intel"}
                    </span>
                 </div>
                 <span className="text-[8px] font-mono text-white/30 uppercase tabular-nums">
                    {report.date ? report.date.split(" ").slice(0, 4).join(" ") : "Active"}
                 </span>
              </div>
              
              <h4 className="text-[12px] text-white/90 font-black tracking-tight mb-2 uppercase group-hover:text-primary transition-colors">
                 {report.event}
              </h4>

              <p className="text-[10px] text-white/40 leading-relaxed font-bold tracking-tight mb-3 line-clamp-3 group-hover:text-white/60 transition-colors">
                 {report.content || "Monitoring satellite imagery and diplomatic traffic for further verification."}
              </p>

              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                       <Activity className="w-3 h-3 text-white/20" />
                       <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Confidence:</span>
                       <span className="text-[8px] font-black uppercase tracking-widest text-primary/60">
                          {report.impact === "HIGH" ? "98% Verified" : "85% Tentative"}
                       </span>
                    </div>
                 </div>
                 <ChevronRight className="w-3.5 h-3.5 text-white/10 group-hover:text-primary transition-colors translate-x-1 group-hover:translate-x-0" />
              </div>

              {/* Decorative Accent */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-8 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
           </motion.div>
         )) : (
            <div className="flex flex-col items-center justify-center h-full opacity-20 py-20">
                <Shield className="w-12 h-12 mb-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Geopolitical Uplink...</span>
            </div>
         )}
      </div>

      <div className="p-4 bg-white/[0.01] border-t border-white/5 text-center shrink-0">
         <button className="text-[9px] font-black text-white/30 hover:text-primary transition-colors uppercase tracking-[0.3em]">
            Export Intelligence Dossier
         </button>
      </div>
    </div>
  );
}
