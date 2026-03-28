"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const assets = [
  { symbol: "XAUUSD", price: 2154.2, change: 0.24, bias: "BULLISH" },
  { symbol: "EURUSD", price: 1.0842, change: -0.12, bias: "BEARISH" },
  { symbol: "GBPUSD", price: 1.2654, change: 0.08, bias: "BULLISH" },
  { symbol: "USDJPY", price: 149.23, change: 0.02, bias: "NEUTRAL" },
];

export function AssetHeatmap() {
  return (
    <GlassCard title="Asset Heatmap" subtitle="Real-time Bias" className="h-full">
      <div className="grid grid-cols-2 gap-3 mt-6">
        {assets.map((asset, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.02 }}
            className="group relative p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all cursor-pointer overflow-hidden"
          >
            <div className="flex justify-between items-start mb-3 relative z-10">
              <span className="text-[10px] font-bold text-foreground tracking-tight uppercase">{asset.symbol}</span>
              <span className={cn(
                "text-[8px] font-bold px-2 py-0.5 rounded-full border tabular-nums",
                asset.change >= 0 ? "bg-bull/10 text-bull border-bull/20" : "bg-bear/10 text-bear border-bear/20"
              )}>
                {asset.change >= 0 ? "+" : ""}{asset.change}%
              </span>
            </div>
            
            <div className="flex items-end justify-between relative z-10">
              <div className="text-sm font-bold text-foreground tabular-nums tracking-tight">
                {asset.price.toFixed(asset.symbol.includes("JPY") ? 2 : 4)}
              </div>
              <div className={cn(
                "w-2 h-2 rounded-full",
                asset.bias === "BULLISH" ? "bg-bull shadow-[0_0_8px_#00E676]" : 
                asset.bias === "BEARISH" ? "bg-bear shadow-[0_0_8px_#FF5252]" : 
                "bg-white/20"
              )} />
            </div>

            {/* Sparkline Decorative Placeholder */}
            <div className="absolute inset-x-0 bottom-0 h-8 opacity-20 pointer-events-none translate-y-2">
               <svg viewBox="0 0 100 20" className="w-full h-full fill-none stroke-current" style={{ color: asset.change >= 0 ? "#00E676" : "#FF5252" }}>
                  <path d={`M0 10 Q25 ${asset.change >= 0 ? 5 : 15} 50 10 Q75 ${asset.change >= 0 ? 15 : 5} 100 10`} strokeWidth="1.5" />
               </svg>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}
