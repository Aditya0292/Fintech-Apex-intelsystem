"use client";

import React from "react";

export function BackgroundEffects() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
      {/* Static Glows - Replaced Motion with Stable CSS */}
      <div 
        className="absolute top-[10%] left-[15%] w-[45rem] h-[45rem] bg-primary/15 blur-[150px] rounded-full mix-blend-screen opacity-50"
      />
      
      <div 
        className="absolute bottom-[5%] right-[5%] w-[55rem] h-[55rem] bg-bull/10 blur-[180px] rounded-full mix-blend-screen opacity-50"
      />

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
        style={{ 
          backgroundImage: `radial-gradient(circle at 1.5px 1.5px, var(--foreground) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />
      
      {/* Grainy Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
