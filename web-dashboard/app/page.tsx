"use client";

import dynamic from "next/dynamic";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useApex } from "@/context/ApexContext";
import React, { useState, useEffect } from "react";

// ── Strict Dynamic Isolation ────────────────────────────────────────────────
// Deferring ALL dashboard modules to client-only runtime to fix hydration hangs.

const OpportunityRunway = dynamic(() => import("@/components/modules/OpportunityRunway").then(m => m.OpportunityRunway), { ssr: false });
const AssetHeatmap = dynamic(() => import("@/components/modules/AssetHeatmap").then(m => m.AssetHeatmap), { ssr: false });
const TradingViewChart = dynamic(() => import("@/components/TradingViewChart"), { ssr: false });
const MultiTimeframeStatus = dynamic(() => import("@/components/modules/MultiTimeframeStatus").then(m => m.MultiTimeframeStatus), { ssr: false });
const VerifiedNewsList = dynamic(() => import("@/components/VerifiedNewsList"), { ssr: false });
const PipelineStatusBar = dynamic(() => import("@/components/modules/PipelineStatusBar").then(m => m.PipelineStatusBar), { ssr: false });

const WorldMonitor = dynamic(() => import("@/components/views/WorldMonitor").then(m => m.WorldMonitor), {
  loading: () => <div className="flex-1 flex items-center justify-center bg-black text-primary font-black animate-pulse uppercase tracking-widest text-xs">UPLINKING_WORLD_MAP...</div>,
  ssr: false
});

const RiskFortress = dynamic(() => import("@/components/views/RiskFortress").then(m => m.RiskFortress), {
  loading: () => <div className="flex-1 flex items-center justify-center bg-black text-primary font-black animate-pulse uppercase tracking-widest text-xs">MODELING_RISK_LATTICE...</div>,
  ssr: false
});

const VerificationLedger = dynamic(() => import("@/components/views/VerificationLedger").then(m => m.VerificationLedger), {
  loading: () => <div className="flex-1 flex items-center justify-center bg-black text-primary font-black animate-pulse uppercase tracking-widest text-xs">HASHING_LEDGER_CHAIN...</div>,
  ssr: false
});

const MT5Execution = dynamic(() => import("@/components/views/MT5Execution").then(m => m.MT5Execution), {
  loading: () => <div className="flex-1 flex items-center justify-center bg-black text-primary font-black animate-pulse uppercase tracking-widest text-xs">OPENING_MT5_SOCKET...</div>,
  ssr: false
});

const SMCEngineView = dynamic(() => import("@/components/views/SMCEngineView").then(m => m.SMCEngineView), {
  loading: () => <div className="flex-1 flex items-center justify-center bg-black text-primary font-black animate-pulse uppercase tracking-widest text-xs">LOADING_SMC_ENGINE...</div>,
  ssr: false
});

const Opportunities = dynamic(() => import("@/components/views/Opportunities"), {
  loading: () => <div className="flex-1 flex items-center justify-center bg-black text-primary font-black animate-pulse uppercase tracking-widest text-xs">CALIBRATING_TARGET_GRIDS...</div>,
  ssr: false
});

function IntelligenceDashboard() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
      
      <main className="flex-1 p-6 lg:p-8 flex gap-6 overflow-hidden">
        
        {/* Column 1: Alpha Rankings & Synergy (25%) */}
        <div className="flex-[1.2] flex flex-col gap-6 h-full min-w-[300px]">
          <div className="flex-[1.4] min-h-0">
             <OpportunityRunway />
          </div>
          <div className="flex-1 min-h-0">
             <MultiTimeframeStatus />
          </div>
        </div>

        {/* Column 2: Heatmap & Macro News (25%) */}
        <div className="flex-[1.2] flex flex-col gap-6 h-full min-w-[300px]">
          <div className="flex-1 min-h-0">
             <AssetHeatmap />
          </div>
          <div className="flex-[1.4] min-h-0 overflow-y-auto custom-scrollbar">
             <VerifiedNewsList />
          </div>
        </div>

        {/* Column 3: Institutional Chart (50%) */}
        <div className="flex-[2.6] h-full min-h-0 min-w-[500px]">
          <TradingViewChart />
        </div>

      </main>
      
      <PipelineStatusBar />

      <div className="fixed bottom-6 right-10 pointer-events-none opacity-30 select-none">
         <span className="text-[9px] font-bold text-white uppercase tracking-[0.5em]">APEX TRADE AI V2.5.0 ELITE</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { activeTab } = useApex();
  const [mounted, setMounted] = useState(false);

  // HYDRATION GUARD: Prevents any mismatched HTML/JS during the initial hydration
  // which is a common cause of blank white screens in Next.js 16/React 19.
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black text-primary font-black animate-pulse uppercase tracking-widest text-xs">
        INITIALIZING_APEX_SHELL...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
        <DashboardHeader />
        
        <div className="flex-1 overflow-hidden">
          {(activeTab === "dashboard" || activeTab === "analytics") && (
            <IntelligenceDashboard />
          )}
        {activeTab === "opps"      && <Opportunities />}
        {activeTab === "world"     && <WorldMonitor />}
        {activeTab === "risk"      && <RiskFortress />}
        {activeTab === "ledger"    && <VerificationLedger />}
        {activeTab === "execution" && <MT5Execution />}
        {activeTab === "smc"       && <SMCEngineView />}
        </div>
    </div>
  );
}
