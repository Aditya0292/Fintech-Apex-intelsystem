"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Shield, Radio, Activity, Search, LayoutGrid, Layers, AlertCircle, Terminal, Send, Terminal as TerminalIcon, Info, X, ChevronDown, Monitor, Zap, Radiation, Crosshair, Map, Anchor, Plane } from "lucide-react";
import { useApex } from "@/context/ApexContext";

// Intelligence Modules
import { WorldMonitorMap } from "@/components/modules/WorldMonitorMap";
import { PrimaryIntelligenceFeed } from "@/components/modules/PrimaryIntelligenceFeed";
import { WebcamGrid } from "@/components/modules/WebcamGrid";
import { GeopoliticalNewsFeed } from "@/components/modules/GeopoliticalNewsFeed";
import { TacticalLayerProvider, useTacticalLayers } from "@/context/TacticalLayerContext";
import { LayerId } from "@/lib/intelligence/LayerRegistry.config";

const upcomingEvents = [
  { event: "US NFP Report",          time: "Today 18:30 IST",  impact: "HIGH",   expected: "185K" },
  { event: "FOMC Meeting Minutes",   time: "Wed 23:00 IST",    impact: "HIGH",   expected: "-" },
];

const layers = [
  { id: "SITREP" as LayerId, label: "Global Sit-Rep", icon: <Globe className="w-3.5 h-3.5" />, color: "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" },
  { id: "CONFLICT" as LayerId, label: "Conflict Monitor", icon: <Zap className="w-3.5 h-3.5" />, color: "bg-bear shadow-[0_0_8px_rgba(239,68,68,0.5)]" },
  { id: "NUCLEAR" as LayerId, label: "Nuclear Site Watch", icon: <Radiation className="w-3.5 h-3.5" />, color: "bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.5)]" },
  { id: "MILITARY_BASES" as LayerId, label: "Military Bases", icon: <Shield className="w-3.5 h-3.5" />, color: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" },
  { id: "SATELLITES" as LayerId, label: "Orbital Tracks", icon: <Monitor className="w-3.5 h-3.5" />, color: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" },
  { id: "TRADE" as LayerId, label: "Trade Flow Arcs", icon: <Activity className="w-3.5 h-3.5" />, color: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" },
  { id: "MARITIME" as LayerId, label: "Maritime Monitor", icon: <Anchor className="w-3.5 h-3.5" />, color: "bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]" },
  { id: "AVIATION" as LayerId, label: "Aviation Monitor", icon: <Plane className="w-3.5 h-3.5" />, color: "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" },
  { id: "IRAN_FOCUS" as LayerId, label: "Iran Theater", icon: <Map className="w-3.5 h-3.5" />, color: "bg-red-500/40" },
  { id: "UKRAINE_FOCUS" as LayerId, label: "Ukraine Theater", icon: <Map className="w-3.5 h-3.5" />, color: "bg-orange-500/40" },
];

const timeframes = ["1h", "6h", "24h", "48h", "7d", "All"];

function WorldMonitorContent() {
  const { liveData } = useApex();
  const [defcon, setDefcon] = useState(4);
  const { activeLayerIds, toggleLayer } = useTacticalLayers();
  const [activeTimeframe, setActiveTimeframe] = useState("7d");
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState([
    { time: "11:32:01", msg: "SESSION_AUTH: GRANTED (Apex_Admin)", type: "system" },
    { time: "11:32:05", msg: "WEBGL_ENGINE: SHADER_PIPELINE_STABLE", type: "intel" },
    { time: "11:32:10", msg: "GEO_LAYER: MAPLIBRE_UPLINK ACTIVE", type: "system" },
  ]);
  const [isConsoleMin, setIsConsoleMin] = useState(true);
  const [isLayersOpen, setIsLayersOpen] = useState(true);
  const [intelMode, setIntelMode] = useState<'tactical' | 'visual'>('tactical');
  const [query, setQuery] = useState("");
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const filteredLayers = useMemo(() => {
    return layers.filter(l => l.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

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

  // Handle 'Full Variant' Auto-Activation
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_VARIANT === 'full') {
      const eliteLayers: LayerId[] = ["SITREP", "CONFLICT", "NUCLEAR", "TRADE", "MARITIME", "AVIATION", "IRAN_FOCUS", "UKRAINE_FOCUS"];
      eliteLayers.forEach(id => {
        if (!activeLayerIds.includes(id)) toggleLayer(id);
      });
      
      const time = new Date().toLocaleTimeString('en-GB');
      setHistory(prev => [...prev, { 
        time, 
        msg: "VARIANT_LOAD: ELITE_INTELLIGENCE_LAYERS_ACTIVATED", 
        type: "intel" 
      }]);
    }
  }, []); // Run once on mount

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030303] overflow-hidden text-white/90 selection:bg-primary/30">
      
      {/* ── TOP NAV: HUB HEADER ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-5 bg-gradient-to-b from-black/80 to-transparent border-b border-white/5 z-[100] backdrop-blur-md">
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.1)]">
                 <Globe className="w-5 h-5 text-primary animate-pulse" />
              </div>
              <div>
                 <h1 className="text-lg font-black uppercase tracking-[0.3em] leading-none mb-1.5 font-institutional">Intelligence Ops</h1>
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),1)]" />
                    <span className="text-[8px] font-black text-white/40 tracking-[0.2em] uppercase leading-none">V2.9.0 Multi_Layer_Engine</span>
                 </div>
              </div>
           </div>
           
           <div className="h-8 w-[1px] bg-white/10" />
           
           <div className="flex items-center gap-6">
              <div 
                className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/5 transition-all group"
                onClick={() => setDefcon(prev => prev === 1 ? 4 : prev - 1)}
              >
                 <span className="text-[9px] font-black text-white/30 uppercase tracking-widest group-hover:text-white/60">DEFCON</span>
                 <div className={cn(
                   "text-[10px] font-black px-2.5 py-0.5 rounded-lg border flex items-center justify-center transition-all",
                   defcon === 1 ? "bg-bear border-bear/20 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "text-primary border-primary/20 bg-primary/5 shadow-[0_0_10px_rgba(var(--primary),0.05)]"
                 )}>
                   LVL {defcon}
                 </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/5">
                 <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
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
                className="bg-white/5 border border-white/10 rounded-2xl px-12 py-3 text-[10px] font-black tracking-widest focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 w-72 transition-all placeholder:text-white/10"
              />
           </div>
           <button className="bg-primary hover:bg-primary/90 text-black px-6 py-3 rounded-2xl flex items-center gap-3 transition-all font-black text-[11px] shadow-[0_0_30px_rgba(var(--primary),0.2)] active:scale-95">
              <Shield className="w-4 h-4" />
              SECURE_LINK
           </button>
        </div>
      </div>

      {/* ── CENTRAL HUB AREA: 100% WATERFALL LAYOUT ─────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* CORE: HUB INTERFACE (Full Screen Map Background) */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
           
           {/* THE TACTICAL MAP (100% Height) */}
           <div className="absolute inset-0 z-0">
              <WorldMonitorMap />
           </div>

           {/* ── OVERLAY: TIMEFRME SELECTOR (Top Left) ───────────────────────── */}
           <div className="absolute top-8 left-8 z-[100] flex bg-black/60 backdrop-blur-3xl border border-white/10 rounded-xl p-1.5 shadow-2xl ring-1 ring-white/5">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setActiveTimeframe(tf)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all",
                    activeTimeframe === tf 
                    ? "bg-primary text-black shadow-[0_0_15px_rgba(var(--primary),0.4)]" 
                    : "text-white/40 hover:text-white/80 hover:bg-white/5"
                  )}
                >
                  {tf}
                </button>
              ))}
           </div>

           {/* ── OVERLAY: FLOATING LAYER REGISTRY (Left Multi-Panel) ─────────── */}
           <div className="absolute top-24 left-8 z-[100] w-72 flex flex-col gap-4 pointer-events-none">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] pointer-events-auto ring-1 ring-white/5"
              >
                 <div 
                   className="p-5 border-b border-white/5 flex items-center justify-between cursor-default transition-none"
                   onClick={() => setIsLayersOpen(!isLayersOpen)}
                 >
                    <div className="flex items-center gap-3">
                       <Layers className="w-4 h-4 text-primary" />
                       <span className="text-[11px] font-black uppercase tracking-widest text-white/80">Intelligence Layers</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-white/20 transition-transform duration-500", !isLayersOpen && "-rotate-180")} />
                 </div>
                 
                 <motion.div
                   animate={{ height: isLayersOpen ? "auto" : 0 }}
                   className="overflow-hidden"
                 >
                    <div className="p-3 border-b border-white/5 bg-white/[0.02]">
                       <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
                          <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search layers..." 
                            className="w-full bg-black/40 border border-white/5 rounded-xl pl-9 py-2 text-[9px] font-black focus:outline-none focus:border-primary/20 transition-all placeholder:text-white/10 uppercase tracking-widest"
                          />
                       </div>
                    </div>

                    <div className="max-h-[360px] overflow-y-auto p-2 custom-scrollbar space-y-1">
                       {filteredLayers.map((layer) => (
                         <button
                           key={layer.id}
                           onClick={() => toggleLayer(layer.id)}
                           className={cn(
                             "w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-none",
                             activeLayerIds.includes(layer.id) 
                             ? "bg-white/[0.04] border-white/10" 
                             : "bg-transparent border-transparent opacity-40"
                           )}
                         >
                           <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center transition-all bg-black/40 border border-white/5 text-white/40",
                                activeLayerIds.includes(layer.id) && "text-white border-white/20 shadow-lg"
                              )}>
                                {layer.icon}
                              </div>
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-wide transition-all",
                                activeLayerIds.includes(layer.id) ? "text-white" : "text-white/40"
                              )}>{layer.label}</span>
                           </div>
                           <div className={cn(
                             "w-4 h-4 rounded-lg flex items-center justify-center transition-all",
                             activeLayerIds.includes(layer.id) ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "bg-white/5"
                           )}>
                              <div className={cn("w-1.5 h-1.5 rounded-sm bg-black", !activeLayerIds.includes(layer.id) && "hidden")} />
                           </div>
                         </button>
                       ))}
                    </div>
                 </motion.div>
                 
                  <div className="p-4 bg-primary/5 border-t border-white/5 flex items-center justify-between">
                     <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em]">Institutional Command • Apex_OS</span>
                     <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-primary/30" />
                        <span className="text-[7px] font-black text-primary/60 uppercase tracking-widest">Active_Uplink</span>
                     </div>
                  </div>
               </motion.div>
            </div>

           {/* ── OVERLAY: TACTICAL LEGEND (Bottom Left) ─────────────────────────── */}
           <div className="absolute bottom-10 left-8 z-[100] pointer-events-none">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-black/40 backdrop-blur-3xl border border-white/10 px-6 py-2.5 rounded-full flex items-center gap-6 shadow-3xl ring-1 ring-white/5 pointer-events-auto"
              >
                 <div className="flex items-center gap-3">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Legend</span>
                    <div className="h-3 w-[1px] bg-white/5 mx-1" />
                 </div>
                 
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 rounded-full bg-bear shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                       <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">High Alert</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                       <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Elevated</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                       <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Monitoring</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[9px] border-b-blue-500" />
                       <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Military Base</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Radiation className="w-3.5 h-3.5 text-yellow-500" />
                       <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Nuclear</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Anchor className="w-3.5 h-3.5 text-cyan-400" />
                       <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Maritime</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Plane className="w-3.5 h-3.5 text-yellow-400" />
                       <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">Aviation</span>
                    </div>
                 </div>
              </motion.div>
           </div>

           {/* ── OVERLAY: DATA PANELS (Expanded Intelligence Desk) ─────────────────────────── */}
           <div className="absolute top-8 right-8 z-[100] w-[650px] h-[calc(100%-120px)] flex flex-col gap-6 pointer-events-none">
              
              {/* ── INTELLIGENCE HUB: MODE SWITCHER ── */}
              <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl p-1.5 flex items-center gap-1 shadow-2xl pointer-events-auto ring-1 ring-white/5 shrink-0">
                 <button 
                   onClick={() => setIntelMode('tactical')}
                   className={cn(
                     "flex-1 flex items-center justify-center gap-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                     intelMode === 'tactical' ? "bg-primary text-black shadow-lg" : "text-white/40 hover:text-white/60 hover:bg-white/5"
                   )}
                 >
                    <Globe className="w-3.5 h-3.5" />
                    Tactical_Sitrep
                 </button>
                 <button 
                   onClick={() => setIntelMode('visual')}
                   className={cn(
                     "flex-1 flex items-center justify-center gap-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                     intelMode === 'visual' ? "bg-primary text-black shadow-lg" : "text-white/40 hover:text-white/60 hover:bg-white/5"
                   )}
                 >
                    <Monitor className="w-3.5 h-3.5" />
                    Visual_Uplink
                 </button>
              </div>

              <AnimatePresence mode="wait">
                {intelMode === 'tactical' ? (
                  <motion.div 
                    key="tactical"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-4 h-full pointer-events-auto"
                  >
                     <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-3xl ring-1 ring-white/5 shrink-0">
                        <div className="flex items-center justify-between mb-6">
                           <h2 className="text-lg font-black uppercase tracking-[0.3em] text-primary/80">Geopolitical_Sitrep</h2>
                           <Zap className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                        <div className="space-y-4">
                            {(liveData?.market_context?.news?.length > 0 ? liveData.market_context.news.slice(0, 3) : []).map((ev: any, i: number) => (
                              <div key={i} className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex justify-between items-center transition-none cursor-default">
                                <div className="min-w-0 pr-6">
                                   <div className="text-sm font-black text-white/90 uppercase tracking-tight leading-snug">{ev.event}</div>
                                   <div className="text-[10px] text-white/20 mt-2 uppercase font-black tracking-widest">{ev.date || "Active Now"}</div>
                                </div>
                                <div className={cn(
                                    "text-[10px] font-black px-4 py-1.5 rounded-xl tracking-tighter uppercase shrink-0",
                                    ev.impact === "HIGH" ? "bg-bear/10 border border-bear/20 text-bear shadow-glow-bear" : "bg-primary/10 border border-primary/20 text-primary shadow-glow-primary"
                                )}>
                                    {ev.impact}
                                </div>
                              </div>
                            ))}
                            {(!liveData?.market_context?.news || liveData.market_context.news.length === 0) && (
                                <div className="p-8 text-center border border-white/5 rounded-2xl bg-white/[0.01]">
                                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">No Critical Events Detected</div>
                                    <div className="text-[8px] text-white/10 mt-1 uppercase">Monitoring Global Feeds...</div>
                                </div>
                            )}
                         </div>
                      </div>

                    <div className="flex flex-col gap-3 flex-1 overflow-hidden">
                       <div className="px-4 py-3 bg-bear/10 border border-bear/20 rounded-2xl flex items-center gap-3 relative overflow-hidden shrink-0">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-bear/5 rounded-full blur-2xl" />
                          <AlertCircle className="w-4 h-4 text-bear animate-bounce shrink-0" />
                          <p className="text-[9px] font-bold text-white/60 leading-tight">SIG_INT DETECT: IRANIAN_AIRSPACE shift detected. Nuclear layer updated.</p>
                       </div>
                       <div className="flex-1 overflow-hidden rounded-[2rem] border border-white/5">
                          <GeopoliticalNewsFeed />
                       </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="visual"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-6 h-full pointer-events-auto overflow-y-auto custom-scrollbar pr-2"
                  >
                    <div className="shrink-0">
                       <PrimaryIntelligenceFeed />
                    </div>
                    <div className="flex flex-col gap-4">
                       <div className="px-6 py-2 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <Monitor className="w-4 h-4 text-primary" />
                             <h3 className="text-[11px] font-black text-white/90 uppercase tracking-[0.2em]">Surveillance_Matrix</h3>
                          </div>
                          <span className="text-[8px] font-black text-white/20 uppercase">4_Active_Streams</span>
                       </div>
                       <WebcamGrid />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>

        </div>
      </div>

      {/* ── COMMAND CONSOLE: FOOTER HUD ─────────────────────────────────────── */}
      <motion.div 
         animate={{ height: isConsoleMin ? 42 : 220 }}
         className="bg-black/90 border-t border-white/5 flex flex-col z-[200] overflow-hidden relative backdrop-blur-3xl"
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
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest underline decoration-2 underline-offset-4 tracking-[0.2em]">SATELLITE_LINK_STABLE</span>
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
               <span className="text-[8px] font-black text-white/20 tracking-widest uppercase">Apex_Institutional_V2 // Build_2901</span>
               <div className="flex gap-6">
                  <span className="text-[8px] font-black text-white/40 tracking-widest uppercase hover:text-primary transition-colors cursor-pointer tracking-tighter">Protocol_Docs</span>
                  <span className="text-[8px] font-black text-white/40 tracking-widest uppercase hover:text-primary transition-colors cursor-pointer tracking-tighter">Security_Logs</span>
               </div>
            </div>
          </>
         )}
      </motion.div>

    </div>
  );
}

export function WorldMonitor() {
  return (
    <TacticalLayerProvider>
      <WorldMonitorContent />
    </TacticalLayerProvider>
  );
}
