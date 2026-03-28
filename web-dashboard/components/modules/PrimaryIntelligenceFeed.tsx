"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, AlertCircle, Maximize2, Activity, Shield, Wifi, WifiOff, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

const SOURCES = [
  { id: "SRC-1", label: "GLOBAL FEED ALPHA", embedUrl: "https://www.youtube.com/embed/zE-5jaSc_5Q" },
  { id: "SRC-2", label: "GLOBAL FEED BETA", embedUrl: "https://www.youtube.com/embed/iipR5yUp36o" },
  { id: "SRC-3", label: "GLOBAL FEED GAMMA", embedUrl: "https://www.youtube.com/embed/qXkb91L2-3k" },
];

export function PrimaryIntelligenceFeed() {
  const [activeSource, setActiveSource] = useState(SOURCES[0]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnected(true);
      setIsConnecting(false);
    }, 2000);
  };

  const handleSourceChange = (src: typeof SOURCES[0]) => {
    setActiveSource(src);
    // If already connected, briefly show "reconnecting" animation
    if (isConnected) {
      setIsConnecting(true);
      setTimeout(() => setIsConnecting(false), 800);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050608] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl relative group min-h-[420px]">
      
      {/* ── HEADER ── */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-xl">
               <Activity className="w-3.5 h-3.5 text-primary" />
               <span className="text-[10px] font-black text-primary uppercase tracking-widest">INTEL_FEED</span>
            </div>
            <h3 className="text-[11px] font-black text-white/90 uppercase tracking-widest animate-in fade-in slide-in-from-left-2">{activeSource.label} LIVE</h3>
         </div>

         <div className="flex items-center gap-2 p-1 bg-white/[0.03] border border-white/10 rounded-xl">
            {SOURCES.map(src => (
              <button
                key={src.id}
                onClick={() => handleSourceChange(src)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[9px] font-black transition-all uppercase tracking-wider",
                  activeSource.id === src.id ? "bg-primary text-black" : "text-white/40 hover:text-white/60"
                )}
              >
                {src.id}
              </button>
            ))}
         </div>
      </div>

      {/* ── VIDEO CONTAINER ── */}
      <div className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
         <AnimatePresence mode="wait">
            {!isConnected || isConnecting ? (
              <motion.div 
                key="fallback"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                 {/* Interference Background Asset */}
                 <img 
                   src="/tactical_interference.png" 
                   className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-screen grayscale"
                   alt="Signal Lost"
                 />
                 
                 {/* Error UI Overlay */}
                 <div className="relative z-10 flex flex-col items-center gap-6 p-12 text-center -translate-y-6">
                    <div className="relative">
                       <motion.div 
                         animate={{ 
                           scale: isConnecting ? [1, 1.1, 1] : [1, 1.05, 1],
                           rotate: isConnecting ? [0, 90, 180, 360] : 0
                         }}
                         transition={{ duration: isConnecting ? 1 : 4, repeat: Infinity, ease: "linear" }}
                         className={cn(
                           "w-20 h-20 rounded-full border flex items-center justify-center backdrop-blur-md transition-colors",
                           isConnecting ? "bg-primary/5 border-primary/20" : "bg-bear/5 border-bear/20"
                         )}
                       >
                          {isConnecting ? (
                            <Wifi className="w-10 h-10 text-primary opacity-80" />
                          ) : (
                            <WifiOff className="w-10 h-10 text-bear opacity-80" />
                          )}
                       </motion.div>
                       <div className={cn("absolute inset-0 blur-2xl rounded-full", isConnecting ? "bg-primary/10" : "bg-bear/10")} />
                    </div>
                    
                    <div className="space-y-4">
                       <div>
                          <h4 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-2">
                             {isConnecting ? "Connecting..." : "Signal Lost"}
                          </h4>
                          <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-relaxed">
                             {isConnecting ? "ESTABLISHING_ENCRYPTED_UPLINK // HANDSHAKE_INITIALIZED" : "ENCRYPTED_UPLINK_OFFLINE // MANUAL_OVERRIDE_REQUIRED"}
                          </p>
                       </div>
                       {!isConnecting && (
                          <button 
                            onClick={handleConnect}
                            className="px-8 py-3 bg-primary/20 border-2 border-primary hover:bg-primary text-white hover:text-black font-black uppercase text-[11px] tracking-[0.3em] rounded-xl backdrop-blur-md transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_40px_rgba(var(--primary),0.6)] active:scale-95 z-50 mt-4"
                          >
                             Connect Uplink
                          </button>
                       )}
                    </div>
                 </div>

                 {/* Glitch Scanline */}
                 <motion.div 
                   animate={{ top: ['0%', '100%'] }}
                   transition={{ duration: 0.1, repeat: Infinity, ease: 'linear' }}
                   className="absolute left-0 w-full h-[2px] bg-primary/20 opacity-30 shadow-[0_0_15px_rgba(var(--primary),1)]"
                 />
              </motion.div>
            ) : (
              <motion.div 
                key="video"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 w-full h-full"
              >
                 <iframe 
                   className="w-[102%] h-[102%] -ml-[1%] -mt-[1%] grayscale group-hover:grayscale-0 transition-all duration-1000 contrast-125 pointer-events-auto"
                   src={`${activeSource.embedUrl}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0`}
                   title={activeSource.label}
                   frameBorder="0"

                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   allowFullScreen
                 />
                 {/* Video Overlay Tint */}
                 <div className="absolute inset-0 bg-primary/5 pointer-events-none mix-blend-overlay" />
                 <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.1) 50%)', backgroundSize: '100% 4px' }} />
              </motion.div>
            )}
         </AnimatePresence>

         {/* Corner HUD markers */}
         <div className="absolute top-4 left-4 flex gap-2 z-20">
            <div className="w-4 h-4 border-t-2 border-l-2 border-white/20" />
         </div>
         <div className="absolute top-4 right-4 flex gap-2 z-20">
            <div className="w-4 h-4 border-t-2 border-r-2 border-white/20" />
         </div>
         <div className="absolute bottom-4 left-4 flex gap-2 z-20">
            <div className="w-4 h-4 border-b-2 border-l-2 border-white/20" />
         </div>
         <div className="absolute bottom-4 right-4 flex gap-2 z-20">
            <div className="w-4 h-4 border-b-2 border-r-2 border-white/20" />
         </div>

         {/* Signal Details */}
         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl text-[9px] font-black text-white/50 uppercase tracking-[0.2em] z-20 pointer-events-none">
            UPLINK: <span className="text-primary font-mono">{activeSource.id}_V4_LIVE</span> // BANDWIDTH: <span className="text-bull tabular-nums">1.4 Gbps</span>
         </div>
      </div>

      {/* ── FOOTER DASH ── */}
      <div className="px-6 py-3.5 bg-black/80 backdrop-blur-md flex items-center justify-between border-t border-white/5 z-20">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,1)]", isConnected ? "bg-primary" : "bg-bear")} />
               <span className={cn("text-[9px] font-black uppercase tracking-[0.15em]", isConnected ? "text-primary" : "text-bear")}>
                  {isConnected ? "SAT_UPLINK: SECURE_SYNC_ESTABLISHED" : "WARNING: UNUSUAL COMS DETECTED IN SECTOR 7G"}
               </span>
            </div>
            {isConnected && <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">(98.8% CONFIDENCE)</span>}
         </div>
         <div className="flex items-center gap-4">
            {isConnected && (
               <button 
                 onClick={() => setIsConnected(false)}
                 className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-bear/20 text-bear/60 hover:bg-bear/10 hover:text-bear transition-all"
               >
                  <WifiOff className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-widest">DISCONNECT</span>
               </button>
            )}
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 text-white/40 hover:bg-white/5 hover:text-white transition-all">
               <Maximize2 className="w-3.5 h-3.5" />
               <span className="text-[9px] font-black uppercase tracking-widest">FULL_HUD</span>
            </button>
         </div>
      </div>

    </div>
  );
}
