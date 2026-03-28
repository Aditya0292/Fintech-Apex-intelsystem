"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { useApex } from "@/context/ApexContext";
import { cn } from "@/lib/utils";
import { Flame, Globe } from "lucide-react";
import { motion } from "framer-motion";

export function MacroNewsFeed() {
  const { newsImpact, newsSentiment } = useApex();

  const news = [
    { title: "FOMC Meeting Minutes Release", time: "2h ago", impact: "HIGH", shock: 82 },
    { title: "ECB President Lagarde Speech", time: "4h ago", impact: "MEDIUM", shock: 45 },
    { title: "US Retail Sales Flash Report", time: "5h ago", impact: "HIGH", shock: 91 },
  ];

  return (
    <GlassCard title="Global Macro" subtitle="NLP Intelligence" className="h-full">
      <div className="flex flex-col h-full gap-4 mt-2">
        
        {/* News Earth Visual - Global Pulse */}
        <div className="relative h-28 w-full flex items-center justify-center">
          <div className="w-24 h-24 relative">
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
            <svg viewBox="0 0 100 100" className="w-full h-full text-primary/40">
              <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 2" />
              <path d="M50 2 A48 48 0 0 1 50 98" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              <path d="M2 50 A48 48 0 0 1 98 50" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
            </svg>
          </div>
          
          <div className="absolute bottom-0 text-center">
             <div className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">Global News Active</div>
          </div>
        </div>

        {/* Shock Value Meter */}
        <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between mx-1">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-white/90">Market Shock</div>
              <div className="text-[8px] font-medium text-primary/60 uppercase tracking-widest leading-none">Distortion Delta</div>
            </div>
          </div>
          <div className="text-xl font-bold text-primary glow-orange tabular-nums">{newsImpact}%</div>
        </div>

        {/* Feed */}
        <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-hide">
          {news.map((item, idx) => (
            <div key={idx} className="group p-3 rounded-2xl bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer border border-border">
              <div className="flex justify-between items-start mb-1 text-[9px] font-bold uppercase tracking-wide">
                <span className="text-primary/60">{item.impact} IMPACT</span>
                <span className="text-muted-foreground">{item.time}</span>
              </div>
              <div className="text-xs font-bold text-foreground line-clamp-1">{item.title}</div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
