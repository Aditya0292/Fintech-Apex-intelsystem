"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { globalDataLoader } from "@/lib/intelligence/data-loader";

interface Channel {
  id: string;
  name: string;
  url: string;
  status: "LIVE" | "ARCHIVE";
}

export function LiveIntelligenceFeed() {
  const [channels, setChannels] = useState<Channel[]>([
    { id: "SKY", name: "Sky News Live", url: "https://www.youtube.com/embed/9AuqeydY-6A", status: "LIVE" },
    { id: "ALJ", name: "Al Jazeera English", url: "https://www.youtube.com/embed/gCNeDWCI0vo", status: "LIVE" },
    { id: "TRT", name: "TRT World Feed", url: "https://www.youtube.com/embed/S2qTidXkueM", status: "LIVE" },
  ]);
  const [activeChannel, setActiveChannel] = useState<Channel>(channels[0]);

  return (
    <div className="flex flex-col h-full bg-[#050505] rounded-3xl border border-white/5 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
      {/* ── HEADER HUD ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-bear/10 border border-bear/20">
             <div className="w-1.5 h-1.5 rounded-full bg-bear animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
             <span className="text-[9px] font-black text-bear uppercase tracking-[0.2em]">INTEL_FEED</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <h3 className="text-[10px] font-black text-white/80 uppercase tracking-widest truncate">
            {activeChannel.name}
          </h3>
        </div>
        
        {/* Channel Switcher */}
        <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
           {channels.map((chan) => (
             <button
               key={chan.id}
               onClick={() => setActiveChannel(chan)}
               className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${
                 activeChannel.id === chan.id 
                 ? "bg-primary text-black shadow-[0_0_15px_rgba(var(--primary),0.5)]" 
                 : "bg-white/5 text-white/40 border border-transparent hover:bg-white/10"
               }`}
             >
               {chan.id}
             </button>
           ))}
        </div>
      </div>

      {/* ── VIDEO INTERFACE ─────────────────────────────────────────────────── */}
      <div className="flex-1 relative aspect-video bg-black overflow-hidden group">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChannel.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute inset-0"
          >
            <iframe
              src={`${activeChannel.url}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0`}
              className="w-full h-full pointer-events-none grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000"
              allow="autoplay; encrypted-media"
            />
          </motion.div>
        </AnimatePresence>

        {/* ── TECHNICAL ANALYSIS OVERLAYS ───────────────────────────────────── */}
        <div className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-700">
           {/* Scan Targets */}
           <div className="absolute top-10 left-10 w-24 h-24 border-t-2 border-l-2 border-primary/40 rounded-tl-xl" />
           <div className="absolute top-10 right-10 w-24 h-24 border-t-2 border-r-2 border-primary/40 rounded-tr-xl" />
           <div className="absolute bottom-10 left-10 w-24 h-24 border-b-2 border-l-2 border-primary/40 rounded-bl-xl" />
           <div className="absolute bottom-10 right-10 w-24 h-24 border-b-2 border-r-2 border-primary/40 rounded-br-xl" />

           {/* Data Readout Panels */}
           <div className="absolute top-6 left-6 space-y-2">
              <div className="px-2 py-1 bg-black/80 border border-primary/20 text-[7px] font-mono text-primary flex items-center gap-2">
                 <div className="w-1 h-1 bg-primary animate-pulse rounded-full" />
                 ANALYSIS_MODE: ACTIVE
              </div>
              <div className="px-2 py-1 bg-black/80 border border-white/5 text-[7px] font-mono text-white/40 flex items-center justify-between w-32">
                 <span>OVR_SIG_V3</span>
                 <span>99.2%</span>
              </div>
           </div>

           {/* Vertical Scan Bar */}
           <motion.div 
             animate={{ left: ['0%', '100%'] }}
             transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
             className="absolute top-0 w-[1px] h-full bg-primary/20 shadow-[0_0_20px_rgba(var(--primary),1)] z-10"
           />
        </div>

        {/* ── INTELLIGENCE TICKER ────────────────────────────────────────────── */}
        <div className="absolute bottom-0 left-0 w-full bg-[#050505]/95 backdrop-blur-3xl border-t border-white/5 py-3 px-6 overflow-hidden">
           <motion.div 
             animate={{ x: ['100%', '-100%'] }}
             transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
             className="whitespace-nowrap text-[9px] font-black text-primary/80 uppercase tracking-[0.2em] space-x-16"
           >
             <span>• SIG_INT_ALERT: UNUSUAL COMS DETECTED IN SECTOR 7G (94% CONFIDENCE)</span>
             <span>• GEO_CONVERGENCE: MULTI-SATELLITE SYNC ACHIEVED ON TARGET ALPHA</span>
             <span>• MARKET_IMPACT: SUDDEN VOLATILITY CLUSTER ON OIL FUTURES (WTI Spike)</span>
             <span>• SYSTEM_HEALTH: ALL TACTICAL NODES OPERATING WITHIN MARGINS</span>
           </motion.div>
        </div>
      </div>
    </div>
  );
}
