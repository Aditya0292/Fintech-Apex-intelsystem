"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./ui/GlassCard";

interface VerifiedNews {
    asset: string;
    headline: string;
    sentiment: string;
    impact: string;
    confidence: number;
    timestamp: string;
    actual: string;
    forecast: string;
    previous: string;
    verifiable_hash: string;
    proof_tx: string;
    verified: boolean;
}

export default function VerifiedNewsList() {
    const [news, setNews] = useState<VerifiedNews[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCompact, setIsCompact] = useState(false);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch("/api/verified-news");
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setNews(data);
                    }
                }
            } catch (error) {
                console.error("AI Intelligence fetch failed:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
        const interval = setInterval(fetchNews, 60000); // Refresh every minute for live actuals
        return () => clearInterval(interval);
    }, []);

    const getImpactStyle = (impact: string) => {
        return "text-red-500 bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
    };

    return (
        <GlassCard 
            title="Macro Intelligence" 
            subtitle="High Impact High Volatility"
            className="col-span-12 lg:col-span-8 flex flex-col min-h-[480px]"
        >
            {/* Sub-header to separate from title area */}
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/5">
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.4em]">Live Matrix Feed</span>
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,1)]" />
                        <span className="text-[7px] text-white/30 uppercase font-black tracking-widest">SMC_CONVERGENCE: ENABLED</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsCompact(!isCompact)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${isCompact ? 'bg-red-500/20 border-red-500/40 text-white' : 'bg-white/5 border-white/10 text-muted-foreground'} group/combat`}
                    >
                        <div className={`w-2 h-2 rounded-full ${isCompact ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`} />
                        <span className="text-[9px] uppercase font-black tracking-widest">{isCompact ? 'Compact ON' : 'Compact OFF'}</span>
                    </button>
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[9px] uppercase font-black text-primary tracking-widest font-sans">Blockchain Anchor</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex justify-center items-center">
                   <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.3em] animate-pulse">Synchronizing Intelligence...</div>
                </div>
            ) : (
                <div className="flex flex-col gap-2 overflow-y-auto px-1 pb-4 flex-1 custom-scrollbar">
                    {news.length > 0 ? news.map((item, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`group relative flex flex-col ${isCompact ? 'p-2.5' : 'p-4'} rounded-2xl bg-white/[0.02] border border-white/5 transition-none cursor-default overflow-hidden`}
                        >
                            <div className="grid grid-cols-12 gap-4 items-center relative z-10">
                                {/* Left Side: Asset & Headline */}
                                <div className="col-span-12 lg:col-span-5 flex items-center gap-4">
                                    <span className="text-[10px] font-black tracking-widest uppercase text-red-500 min-w-[40px]">
                                        {item.asset}
                                    </span>
                                    <span className="text-[11px] font-bold text-foreground/90 font-sans tracking-tight line-clamp-1 flex-1">
                                        {item.headline}
                                    </span>
                                </div>
                                
                                {/* Right Side: Data Columns & Time */}
                                <div className="col-span-12 lg:col-span-7 flex items-center justify-between gap-6">
                                    <div className="flex items-center gap-6 text-center">
                                        <div className="flex flex-col min-w-[60px]">
                                            <span className="text-[7px] text-white/30 uppercase font-bold mb-0.5 tracking-tighter">Actual</span>
                                            <span className={`text-[10px] font-black ${item.actual ? 'text-red-500' : 'text-white/10'}`}>{item.actual || '---'}</span>
                                        </div>
                                        <div className="flex flex-col min-w-[60px]">
                                            <span className="text-[7px] text-white/30 uppercase font-bold mb-0.5 tracking-tighter">Forecast</span>
                                            <span className="text-[10px] font-black text-white/60">{item.forecast || '---'}</span>
                                        </div>
                                        <div className="flex flex-col min-w-[60px]">
                                            <span className="text-[7px] text-white/30 uppercase font-bold mb-0.5 tracking-tighter">Previous</span>
                                            <span className="text-[10px] font-black text-white/40">{item.previous || '---'}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-[9px] font-bold font-mono text-muted-foreground px-2 py-0.5 rounded bg-black/40 border border-white/5">
                                            {item.timestamp.includes(':') ? item.timestamp.split(' ').pop() : 'TENTATIVE'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!isCompact && (
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <span className={`text-[8px] font-black tracking-[0.2em] px-2 py-0.5 rounded border ${getImpactStyle(item.impact)}`}>
                                            {item.impact}
                                        </span>
                                        <span className="text-[8px] text-white/20 font-mono uppercase tracking-[0.1em]">
                                            Institutional Consensus Score: <span className="text-white/40">{(item.confidence * 100).toFixed(0)}%</span>
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <span className="text-[7px] font-black text-white/10 uppercase tracking-[0.2em]">{item.timestamp}</span>
                                    </div>
                                </div>
                            )}

                            {/* Hover Backdrop disabled */}
                            <div className="absolute inset-[1px] bg-gradient-to-br from-red-500/10 to-transparent opacity-0 transition-none rounded-[calc(1rem-1px)] pointer-events-none z-0" />
                        </motion.div>
                    )) : (
                        <div className="flex-1 flex justify-center items-center text-[10px] text-muted-foreground uppercase tracking-widest">No high-impact insights found</div>
                    )}
                </div>
            )}
        </GlassCard>
    );
}
