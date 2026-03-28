"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Shield, Globe, MessageSquare, ChevronRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const INTEL_REPORTS = [
  { id: 1, type: "WAR", topic: "SOUTHERN BUFFER ZONE", content: "Satellite confirms mobile artillery battery relocation toward Sector 4.", impact: "CRITICAL", time: "2m ago" },
  { id: 2, type: "GEO", topic: "GLOBAL ENERGY GRID", content: "Cyber-reconnaissance detected targeting key LNG terminals in the Gulf.", impact: "HIGH", time: "12m ago" },
  { id: 3, type: "INTEL", topic: "NATO STRATEGIC PIVOT", content: "Intercepted diplomatic cables suggest a shift in defensive postures for Q3.", impact: "MODERATE", time: "28m ago" },
  { id: 4, type: "WAR", topic: "URBAN ENCLOSURE B", content: "UAV reconnaissance shows unusual frequency of signal jamming in domestic hubs.", impact: "HIGH", time: "44m ago" },
  { id: 5, type: "GEO", topic: "UNREST INDICATOR", content: "Neural confidence of civil escalation in Tier 2 cities has risen to 92%.", impact: "CRITICAL", time: "1h ago" },
];

export function GeopoliticalNewsFeed() {
  return (
    <div className="flex flex-col h-full bg-[#050608] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
      <div className="px-6 py-5 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
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
         {INTEL_REPORTS.map((report, i) => (
           <motion.div 
             key={report.id}
             initial={{ opacity: 0, x: -10 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: i * 0.1 }}
             className="relative p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 hover:bg-white/[0.04] transition-all group cursor-pointer"
           >
              <div className="flex justify-between items-start mb-2.5">
                 <div className="flex items-center gap-2">
                    <span className={cn(
                       "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                       report.type === "WAR" ? "bg-bear/20 text-bear border border-bear/10" :
                       report.type === "GEO" ? "bg-primary/20 text-primary border border-primary/10" :
                       "bg-white/10 text-white/40 border border-white/5"
                    )}>
                       {report.type}
                    </span>
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{report.topic}</span>
                 </div>
                 <span className="text-[8px] font-mono text-white/20 uppercase">{report.time}</span>
              </div>
              
              <p className="text-[10px] text-white/70 leading-relaxed font-bold tracking-tight mb-3">
                 {report.content}
              </p>

              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                       <Activity className="w-3 h-3 text-white/20" />
                       <span className="text-[8px] font-black text-white/20 uppercase">IMPACT:</span>
                       <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest",
                          report.impact === "CRITICAL" ? "text-bear animate-pulse" :
                          report.impact === "HIGH" ? "text-orange-400" :
                          "text-primary/60"
                       )}>
                          {report.impact}
                       </span>
                    </div>
                 </div>
                 <ChevronRight className="w-3.5 h-3.5 text-white/10 group-hover:text-primary transition-colors translate-x-1 group-hover:translate-x-0" />
              </div>

              {/* Decorative Accent */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-8 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
           </motion.div>
         ))}
      </div>

      <div className="p-4 bg-white/[0.01] border-t border-white/5 text-center">
         <button className="text-[9px] font-black text-white/30 hover:text-primary transition-colors uppercase tracking-[0.3em]">
            Export Full Dossier
         </button>
      </div>
    </div>
  );
}
