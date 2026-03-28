"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { globalDataLoader } from "@/lib/intelligence/data-loader";

interface Camera {
  id: string;
  name: string;
  url: string;
  lat: number;
  lng: number;
  status: "LIVE" | "ARCHIVE";
  signal: number;
  fps: number;
}

export function WebcamGrid() {
  const [cameras, setCameras] = useState<Camera[]>([
    { id: "C1", name: "Tehran Operational Center", url: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=800", lat: 35.689, lng: 51.389, status: "LIVE", signal: 94, fps: 24 },
    { id: "C2", name: "Tel Aviv Coastal Observation", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800", lat: 32.085, lng: 34.781, status: "LIVE", signal: 88, fps: 30 },
    { id: "C3", name: "Kyiv Strategic Radar Hub", url: "https://images.unsplash.com/photo-1561501900-3701fa1a0959?w=800", lat: 50.450, lng: 30.523, status: "LIVE", signal: 72, fps: 15 },
    { id: "C4", name: "Sector 7G Monitor", url: "/tactical_interference.png", lat: 10.000, lng: 114.000, status: "LIVE", signal: 45, fps: 12 },
  ]);

  return (
    <div className="grid grid-cols-2 gap-4">
      {cameras.map((cam, i) => (
        <motion.div 
          key={cam.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="relative aspect-video rounded-3xl border border-white/5 overflow-hidden group hover:border-primary/40 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-[#0A0A0B]"
        >
          {/* Main Feed Content */}
          <div className="absolute inset-0">
             <img 
               src={cam.url} 
               alt={cam.name} 
               className="w-full h-full object-cover grayscale brightness-50 contrast-125 transition-all group-hover:grayscale-0 group-hover:brightness-100 duration-700" 
             />
             {/* Surveillance Overlay Pattern */}
             <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all" />
             <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(0,0,0,0.3) 50%)', backgroundSize: '100% 4px' }} />
          </div>

          {/* ── TOP OVERLAY EXTRAS ──────────────────────────────────────────────── */}
          <div className="absolute top-3 left-3 flex items-center gap-2 z-10 w-[90%] overflow-hidden">
             <div className="flex shrink-0 items-center gap-1.5 px-2 py-0.5 rounded-sm bg-bear/90 backdrop-blur-md border border-bear/20 shadow-lg">
                <motion.div 
                   animate={{ opacity: [1, 0, 1] }}
                   transition={{ duration: 1, repeat: Infinity }}
                   className="w-1 h-1 rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,1)]" 
                />
                <span className="text-[7px] font-black text-white uppercase tracking-widest">LIVE</span>
             </div>
             
             <div className="px-2 py-0.5 rounded-sm bg-black/80 backdrop-blur-md border border-white/10 text-[7px] font-black text-white/60 uppercase tracking-widest truncate">
                ID-{cam.id} // SIG: {cam.signal}%
             </div>
          </div>

          {/* ── SIGNAL STRENGTH BARS (Tactical Eye Candy) ─────────────────────── */}
          <div className="absolute top-3 right-3 flex items-end gap-0.5 h-3 pointer-events-none">
             {[1,2,3,4,5].map(v => (
               <div 
                 key={v} 
                 className={`w-0.5 rounded-full transition-all ${v <= (cam.signal/20) ? 'bg-primary shadow-[0_0_5px_rgba(var(--primary),1)]' : 'bg-white/10'}`}
                 style={{ height: `${v * 20}%` }}
               />
             ))}
          </div>

          {/* ── BOTTOM INFO HUD ───────────────────────────────────────────────── */}
          <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-1.5 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
             <div className="flex justify-between items-end gap-2">
                <div className="flex-1 min-w-0">
                   <div className="text-[9px] font-black text-white uppercase truncate tracking-tight mb-0.5 leading-none">{cam.name}</div>
                   <div className="text-[7px] font-mono text-primary/60 tracking-widest truncate">
                      GEO: {cam.lat.toFixed(3)}N {cam.lng.toFixed(3)}E
                   </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                   <div className="text-[7px] font-black text-white uppercase bg-white/10 px-1 py-0.5 rounded-[2px] tracking-widest">V4_SYNC</div>
                   <div className="text-[7px] font-mono text-white/60 tabular-nums">{cam.fps} FPS</div>
                </div>
             </div>
             
             {/* Decorative Scanline Bar */}
             <div className="w-full h-[1px] bg-white/5 overflow-hidden rounded-full">
                <motion.div 
                   animate={{ x: ['-100%', '100%'] }}
                   transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                   className="w-1/3 h-full bg-primary/40 shadow-[0_0_10px_rgba(var(--primary),1)]"
                />
             </div>
          </div>
          
          {/* Scanning Line Animation (Vertical) */}
          <motion.div 
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 w-full h-[1px] bg-white/5 opacity-50 z-20 pointer-events-none"
          />
        </motion.div>
      ))}
    </div>
  );
}
