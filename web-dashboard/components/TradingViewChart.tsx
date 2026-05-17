"use client";

import React, { useEffect, useRef } from "react";
import { GlassCard } from "./ui/GlassCard";
import { useApex } from "@/context/ApexContext";

export default function TradingViewChart() {
  const container = useRef<HTMLDivElement>(null);
  const { activeSymbol } = useApex();

  useEffect(() => {
    if (!container.current) return;

    // Clean up any existing children to prevent duplicate widgets on re-render
    while (container.current.firstChild) {
        container.current.removeChild(container.current.firstChild);
    }

    // Map common symbols to OANDA for consistency
    const tvSymbol = `OANDA:${activeSymbol}`;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: "15",
      timezone: "Asia/Kolkata",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      backgroundColor: "#16161E", // Match the Matte Charcoal theme exactly
      gridColor: "rgba(42, 42, 42, 0.3)",
      container_id: "tradingview_advanced_chart",
      hide_side_toolbar: false,
      details: false,
      hotlist: false,
      calendar_events: false,
      show_popup_button: true,
      popup_width: "1000",
      popup_height: "650"
    });
    container.current.appendChild(script);
  }, [activeSymbol]);

  return (
    <GlassCard noPadding className="flex-1 min-h-[500px] h-full overflow-hidden relative border-[#1e1e1e]">
        <div className="absolute bottom-4 right-4 z-10 flex gap-2 pointer-events-none">
            <div className="px-2 py-0.5 rounded-full bg-apex-cyan/10 border border-apex-cyan/30 flex items-center gap-1.5 backdrop-blur-md opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-apex-cyan animate-pulse"></div>
                <span className="text-[10px] uppercase font-bold text-apex-cyan tracking-wider">Live Feed</span>
            </div>
        </div>
        <div id="tradingview_advanced_chart" ref={container} className="w-full h-full" />
    </GlassCard>
  );
}
