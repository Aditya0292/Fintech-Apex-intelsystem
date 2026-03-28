"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  glowColor?: "primary" | "bull" | "bear";
  noPadding?: boolean;
}

export function GlassCard({ children, title, subtitle, className, glowColor, noPadding }: GlassCardProps) {
  const glowClasses = {
    primary: "after:bg-primary/5 after:shadow-[0_0_40px_rgba(232,123,69,0.1)]",
    bull: "after:bg-bull/5 after:shadow-[0_0_40px_rgba(0,230,118,0.1)]",
    bear: "after:bg-bear/5 after:shadow-[0_0_40px_rgba(255,82,82,0.1)]",
  };

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.002 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "relative rounded-3xl border border-border bg-card/40 backdrop-blur-3xl overflow-hidden group h-full flex flex-col",
        "shadow-2xl shadow-black/20 dark:shadow-black/60",
        glowColor && glowClasses[glowColor],
        className
      )}
    >
      {/* Backlight Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] dark:from-white/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* Header */}
      {(title || subtitle) && (
        <div className={cn("px-6 pt-6 pb-2 relative z-10 flex-shrink-0", noPadding && "px-4 pt-4")}>
          <div className="flex justify-between items-center mb-1 text-center">
             <h3 className="text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase font-sans">
               {title}
             </h3>
          </div>
          {subtitle && (
            <p className="text-[9px] font-bold text-primary/80 uppercase tracking-[0.2em] mt-0.5">{subtitle}</p>
          )}
        </div>
      )}

      {/* Content Container */}
      <div className={cn("px-6 pb-6 pt-2 relative z-10 flex-1 min-h-0 flex flex-col text-foreground", noPadding && "p-0")}>
        {children}
      </div>

      {/* Glass Inner Border */}
      <div className="absolute inset-0 border border-white/5 dark:border-white/[0.02] rounded-3xl pointer-events-none" />
    </motion.div>
  );
}
