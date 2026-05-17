"use client";

import { useApex } from "@/context/ApexContext";
import { Search, Bell, User, Cpu, Clock, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const { isScanning, triggerScan, scanInterval, setScanInterval, isAutoScanEnabled, setIsAutoScanEnabled } = useApex();

  return (
    <header className="h-24 flex items-center justify-between px-10 bg-background/10 backdrop-blur-md border-b border-white/5 relative z-40 flex-shrink-0 transition-colors duration-500">
      {/* AI COMMAND BAR */}
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
             <Cpu className="text-primary w-5 h-5 animate-pulse" />
          </div>
          <span className="text-[10px] font-black tracking-[0.3em] text-foreground uppercase opacity-40 group-hover:opacity-80 transition-opacity">System Active</span>
        </div>
        
        {/* INTELLIGENCE PULSE MATRIX */}
        <div className="flex items-center gap-6 bg-muted/10 border border-white/5 rounded-2xl px-6 py-2 shadow-inner">
          
          {/* Toggle */}
          <div className="flex items-center gap-3 pr-6 border-r border-white/5">
            <span className={cn("text-[9px] font-black uppercase tracking-widest transition-colors", isAutoScanEnabled ? "text-primary" : "text-white/20")}>
              Auto-Pulse
            </span>
            <button 
              onClick={() => setIsAutoScanEnabled(!isAutoScanEnabled)}
              className={cn(
                "w-10 h-5 rounded-full relative transition-all duration-500",
                isAutoScanEnabled ? "bg-primary/40 shadow-[0_0_10px_rgba(232,123,69,0.2)]" : "bg-white/5"
              )}
            >
              <div className={cn(
                "absolute top-1 w-3 h-3 rounded-full transition-all duration-500",
                isAutoScanEnabled ? "left-6 bg-primary shadow-glow-primary" : "left-1 bg-white/20"
              )} />
            </button>
          </div>

          {/* Interval */}
          <div className="flex items-center gap-3 pr-6 border-r border-white/5">
            <Clock className="w-3.5 h-3.5 text-white/20" />
            <select 
              value={scanInterval}
              onChange={(e) => setScanInterval(Number(e.target.value))}
              className="bg-transparent border-none text-[10px] font-black text-foreground uppercase tracking-widest focus:ring-0 cursor-pointer hover:text-primary transition-colors outline-none"
            >
              <option value={5} className="bg-terminal-bg-panel">Every 5M</option>
              <option value={10} className="bg-terminal-bg-panel">Every 10M</option>
              <option value={15} className="bg-terminal-bg-panel">Every 15M</option>
              <option value={30} className="bg-terminal-bg-panel">Every 30M</option>
            </select>
          </div>

          {/* Manual Trigger */}
          <button 
            onClick={triggerScan}
            disabled={isScanning}
            className={cn(
              "flex items-center gap-3 px-4 py-1.5 rounded-xl transition-all group",
              isScanning ? "bg-primary/10 cursor-wait" : "hover:bg-white/5"
            )}
          >
            <Zap className={cn("w-3.5 h-3.5", isScanning ? "text-primary animate-pulse" : "text-white/40 group-hover:text-primary")} />
            <span className={cn("text-[10px] font-black uppercase tracking-widest", isScanning ? "text-primary" : "text-white/60 group-hover:text-foreground")}>
              {isScanning ? "Uplinking Data..." : "Trigger Pulse"}
            </span>
          </button>
        </div>
      </div>

      {/* ACTION CLUSTER */}
      <div className="flex items-center gap-8">
        <div className="hidden xl:flex flex-col items-end gap-1 border-r border-border pr-8">
           <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none">
             <div className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse shadow-glow-bull" />
             NYSE SESSION
           </div>
           <span className="text-[10px] font-bold text-foreground opacity-60 tabular-nums uppercase tracking-widest mt-1">14:52:10 EST</span>
        </div>

        <div className="flex items-center gap-5">
          <button className="w-12 h-12 rounded-2xl border border-border bg-muted/20 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/20 transition-all relative group overflow-hidden">
            <Bell className="w-5 h-5 relative z-10" />
            <div className="absolute top-3.5 right-3.5 w-2 h-2 bg-primary rounded-full shadow-glow-primary z-20 border-2 border-background" />
            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors" />
          </button>
          
          <div className="flex items-center gap-4 cursor-pointer group p-1 rounded-2xl transition-all">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-black text-foreground uppercase tracking-wider leading-none group-hover:text-primary transition-colors">Institutional Pro</div>
              <div className="text-[8px] font-bold text-primary uppercase tracking-[0.2em] mt-1.5 opacity-80">Tier 1 Access</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 flex items-center justify-center group-hover:scale-105 transition-all shadow-glow-primary relative overflow-hidden">
               <User className="text-primary w-6 h-6 z-10" />
               <div className="absolute inset-0 bg-primary/10" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
