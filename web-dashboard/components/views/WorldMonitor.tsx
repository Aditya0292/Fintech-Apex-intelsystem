"use client";

import { useEffect, useState, useRef } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Shield, Radio, Activity, Search, LayoutGrid, Layers, AlertCircle, Terminal, Send, Terminal as TerminalIcon } from "lucide-react";

// Intelligence Modules
import { SituationalMap } from "@/components/modules/SituationalMap";
import { PrimaryIntelligenceFeed } from "@/components/modules/PrimaryIntelligenceFeed";
import { WebcamGrid } from "@/components/modules/WebcamGrid";
import { GeopoliticalNewsFeed } from "@/components/modules/GeopoliticalNewsFeed";

const upcomingEvents = [
  { event: "US NFP Report",          time: "Today 18:30 IST",  impact: "HIGH",   expected: "185K" },
  { event: "FOMC Meeting Minutes",   time: "Wed 23:00 IST",    impact: "HIGH",   expected: "-" },
];

const layers = [
  { id: "SITREP", label: "Global Sit-Rep", active: true, color: "bg-primary" },
  { id: "CONFLICT", label: "Conflict Monitor", active: true, color: "bg-bear" },
  { id: "TRADE", label: "Trade Flows", active: false, color: "bg-blue-500" },
  { id: "ENERGY", label: "Energy Grid", active: false, color: "bg-yellow-500" },
];

export function WorldMonitor() {
  const [defcon, setDefcon] = useState(4);
  const [activeLayers, setActiveLayers] = useState<string[]>(["SITREP", "CONFLICT"]);
  const [history, setHistory] = useState([
    { time: "11:32:01", msg: "SESSION_AUTH: GRANTED (Apex_Admin)", type: "system" },
    { time: "11:32:05", msg: "SIG_CONVERGENCE: TARGET ALPHA SYNCED", type: "intel" },
    { time: "11:32:10", msg: "GEO_LAYER: CONFLICT_MONITOR ACTIVE", type: "system" },
  ]);
  const [isConsoleMin, setIsConsoleMin] = useState(true); // Minimized by default as per user request
  const [query, setQuery] = useState("");
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const toggleLayer = (id: string) => {
    setActiveLayers(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]);
  };

  const handleQuery = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      const time = new Date().toLocaleTimeString('en-GB');
      setHistory(prev => [...prev, 
        { time, msg: `USER_QUERY: ${query}`, type: 'system' },
        { time, msg: `ANALYZING: Processing tactical response for "${query}"...`, type: 'intel' }
      ]);
      setQuery("");
      if (isConsoleMin) setIsConsoleMin(false);
    }
  };

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030303] overflow-hidden text-white/90 selection:bg-primary/30">
      
      {/* ── TOP NAV: HUB HEADER ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-b from-black to-transparent border-b border-white/5 z-50">
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.1)]">
                 <Globe className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <div>
                 <h1 className="text-lg font-black uppercase tracking-[0.3em] leading-none mb-1.5">Intelligence Ops</h1>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[8px] font-black text-white/40 tracking-[0.2em] uppercase">V2.8.9 System_Live</span>
                 </div>
              </div>
           </div>
           
           <div className="h-8 w-[1px] bg-white/10" />
           
           <div className="flex items-center gap-6">
              <div 
                className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5 transition-all"
                onClick={() => setDefcon(prev => prev === 1 ? 4 : prev - 1)}
              >
                 <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">DEFCON</span>
                 <div className={cn(
                   "text-[10px] font-black px-2.5 py-0.5 rounded-lg border flex items-center justify-center transition-colors",
                   defcon === 1 ? "bg-bear border-bear/20 text-white" : "text-primary border-primary/20 bg-primary/5"
                 )}>
                   LVL {defcon}
                 </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5">
                 <Radio className="w-3.5 h-3.5 text-primary" />
                 <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">UPLINK_STABLE</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleQuery}
                placeholder="PROMPT INTEL QUERY..." 
                className="bg-white/5 border border-white/10 rounded-2xl px-12 py-3 text-[10px] font-black tracking-widest focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 w-64 transition-all"
              />
           </div>
           <button className="bg-primary hover:bg-primary/90 text-black px-5 py-3 rounded-2xl flex items-center gap-3 transition-all font-black text-xs shadow-[0_0_30px_rgba(var(--primary),0.2)]">
              <Shield className="w-4 h-4" />
              SECURE
           </button>
        </div>
      </div>

      {/* ── CENTRAL HUB AREA ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR: CONTROL CENTER */}
        <div className="w-72 border-r border-white/5 p-6 flex flex-col gap-8 bg-black/40 backdrop-blur-3xl shrink-0">
           <div>
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    <h2 className="text-[11px] font-black uppercase tracking-widest text-white/60">Data Nodes</h2>
                 </div>
                 <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
              </div>
              
              <div className="space-y-2">
                 {layers.map((layer) => (
                   <button
                     key={layer.id}
                     onClick={() => toggleLayer(layer.id)}
                     className={cn(
                       "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all text-left",
                       activeLayers.includes(layer.id) 
                       ? "bg-white/5 border-white/10 shadow-[inset_0_0_15px_rgba(255,255,255,0.02)]" 
                       : "bg-transparent border-transparent opacity-40 hover:opacity-100 hover:bg-white/[0.02]"
                     )}
                   >
                     <div className="flex items-center gap-4">
                        <div className={cn("w-2 h-2 rounded-full", activeLayers.includes(layer.id) ? layer.color : "bg-white/20")} />
                        <span className="text-[10px] font-black uppercase tracking-wider">{layer.label}</span>
                     </div>
                     <AnimatePresence>
                        {activeLayers.includes(layer.id) && (
                          <motion.div 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }} 
                            className="w-4 h-4 bg-primary rounded-lg flex items-center justify-center"
                          >
                             <div className="w-2 h-2 bg-black rounded-sm" />
                          </motion.div>
                        )}
                     </AnimatePresence>
                   </button>
                 ))}
              </div>
           </div>

           <div className="flex-1 flex flex-col justify-end gap-6 overflow-hidden">
              <div className="p-5 rounded-3xl bg-gradient-to-br from-bear/10 to-transparent border border-bear/20 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-bear/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-bear/10 transition-colors" />
                 <div className="flex items-center gap-3 mb-3">
                    <AlertCircle className="w-4 h-4 text-bear animate-bounce" />
                    <span className="text-[10px] font-black text-bear uppercase tracking-[0.1em]">Tactical_Flash</span>
                 </div>
                 <p className="text-[9px] text-white/60 leading-relaxed font-bold tracking-tight">SIG_INT Detect: Cluster Alpha is shifting posture. Defensive sync authorized.</p>
              </div>
           </div>
        </div>

        {/* CORE: HUB INTERFACE */}
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
           {/* Situational HUD */}
           <div className="h-[480px] shrink-0">
              <SituationalMap />
           </div>

           {/* Tactical Data Grid */}
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[450px]">
              <PrimaryIntelligenceFeed />
              <WebcamGrid />
           </div>
        </div>

        {/* RIGHT: MARCO INTEL */}
        <div className="w-[380px] border-l border-white/5 p-6 flex flex-col gap-8 bg-black/40 backdrop-blur-3xl shrink-0">
           <GlassCard title="Event Convergence" subtitle="Macro-Level Impact Tracking" glowColor="primary" className="rounded-3xl border-white/5">
              <div className="flex flex-col gap-3 mt-6">
                 {upcomingEvents.map((ev, i) => (
                   <div key={i} className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all group/ev">
                      <div className="flex-1 min-w-0">
                         <div className="text-[11px] font-black text-white/90 truncate uppercase tracking-tight group-hover/ev:text-primary transition-colors">{ev.event}</div>
                         <div className="text-[9px] text-white/30 mt-1.5 font-bold uppercase">{ev.time}</div>
                         <div className="text-[9px] text-primary/60 mt-1.5 font-black uppercase tracking-tighter">EXPECTED: {ev.expected}</div>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-bear/20 text-bear text-[9px] font-black border border-bear/10 shadow-[0_0_15px_rgba(239,68,68,0.1)]">HIGH</div>
                   </div>
                 ))}
              </div>
           </GlassCard>

            <div className="flex-1 overflow-hidden min-h-[300px] border border-red-500/50">
               <GeopoliticalNewsFeed />
            </div>
        </div>

      </div>

      {/* ── COMMAND CONSOLE: FOOTER HUD ─────────────────────────────────────── */}
      <motion.div 
         animate={{ height: isConsoleMin ? 42 : 220 }}
         className="bg-black border-t border-white/5 flex flex-col z-50 overflow-hidden relative"
      >
         <div 
           className="px-6 py-2.5 bg-white/[0.02] border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
           onClick={() => setIsConsoleMin(!isConsoleMin)}
         >
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                  <TerminalIcon className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Tactical_Action_Center</span>
               </div>
               <div className="h-3 w-[1px] bg-white/10" />
               <div className="flex gap-4">
                  <span className="text-[8px] font-mono text-white/40 tracking-widest uppercase">SYSLOG_V4</span>
                  <span className="text-[8px] font-mono text-white/40 tracking-widest uppercase">LATENCY: 4.2ms</span>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2 text-[8px] font-black text-white/20 uppercase tracking-widest">
                  {isConsoleMin ? "Click to Expand" : "Click to Minimize"}
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),1)]" />
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest underline decoration-2 underline-offset-4">SATELLITE_LINK_STABLE</span>
               </div>
            </div>
         </div>
         
         {!isConsoleMin && (
          <>
            <div className="flex-1 p-4 font-mono overflow-y-auto space-y-1.5 custom-scrollbar bg-[rgba(0,0,0,0.5)]">
               {history.map((log, i) => (
                 <div key={i} className="flex gap-4 text-[10px] animate-in fade-in slide-in-from-left-2 duration-300">
                    <span className="text-white/20 shrink-0">[{log.time}]</span>
                    <span className={cn(
                      "font-bold",
                      log.type === "intel" ? "text-primary" : "text-white/60"
                    )}>
                      {log.msg}
                    </span>
                 </div>
               ))}
               <div ref={consoleEndRef} />
            </div>
            
            <div className="px-6 py-2 bg-black flex justify-between items-center border-t border-white/5">
               <span className="text-[8px] font-black text-white/20 tracking-widest uppercase">Apex_Institutional_V2 // Build_2112</span>
               <div className="flex gap-6">
                  <span className="text-[8px] font-black text-white/40 tracking-widest uppercase hover:text-primary transition-colors cursor-pointer">Protocol_Docs</span>
                  <span className="text-[8px] font-black text-white/40 tracking-widest uppercase hover:text-primary transition-colors cursor-pointer">Security_Logs</span>
               </div>
            </div>
          </>
         )}
      </motion.div>

    </div>
  );
}
