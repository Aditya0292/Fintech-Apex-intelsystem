"use client";

import React, { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickData, CandlestickSeries } from "lightweight-charts";
import { GlassCard } from "@/components/ui/GlassCard";
import { useApex } from "@/context/ApexContext";

export function SMCDeepDive() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { activeSymbol } = useApex();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255, 255, 255, 0.4)",
        fontSize: 10,
        fontFamily: "Poppins, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.02)" },
        horzLines: { color: "rgba(255, 255, 255, 0.02)" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "rgba(232, 123, 69, 0.5)", width: 1, style: 2 },
        horzLine: { color: "rgba(232, 123, 69, 0.5)", width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.05)",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.05)",
      },
    });

    // In v5.1.0, the correct way is using addSeries with the series constructor
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#00E676",
      downColor: "#FF5252",
      borderVisible: false,
      wickUpColor: "#00E676",
      wickDownColor: "#FF5252",
    });

    // Mock initial data
    const data: CandlestickData[] = [];
    let price = 2150;
    const now = Math.floor(Date.now() / 1000);
    for (let i = 0; i < 100; i++) {
      const open = price + Math.random() * 2 - 1;
      const high = open + Math.random();
      const low = open - Math.random();
      const close = (high + low) / 2 + Math.random() * 2 - 1;
      data.push({
        time: (now - (100 - i) * 3600) as any,
        open,
        high,
        low,
        close,
      });
      price = close;
    }

    candleSeries.setData(data);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [activeSymbol]);

  return (
    <GlassCard title={`SMC Deep Dive: ${activeSymbol}`} subtitle="Institutional Order Flow" className="h-full">
      <div ref={chartContainerRef} className="w-full flex-1" />
      <div className="absolute top-16 left-6 flex gap-4 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-[10px] font-bold text-white/40 uppercase">Order Block</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded bg-primary/20 border border-primary/30" />
          <span className="text-[10px] font-bold text-white/40 uppercase">Fair Value Gap</span>
        </div>
      </div>
    </GlassCard>
  );
}
