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
    verifiable_hash: string;
    proof_tx: string;
    verified: boolean;
}

export default function VerifiedNewsList() {
    const [news, setNews] = useState<VerifiedNews[]>([]);
    const [loading, setLoading] = useState(true);

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
    }, []);

    const getImpactStyle = (impact: string) => {
        switch (impact.toLowerCase()) {
            case "critical": return "text-purple-400 bg-purple-400/10 border-purple-400/20";
            case "high": return "text-orange-400 bg-orange-400/10 border-orange-400/20";
            default: return "text-blue-400 bg-blue-400/10 border-blue-400/20";
        }
    };

    return (
        <GlassCard 
            title="Macro Intelligence" 
            subtitle="Blockchain Verified"
            className="col-span-12 lg:col-span-8 flex flex-col min-h-[480px]"
        >
            {/* Sub-header to separate from title area */}
            <div className="flex justify-between items-center mb-6 pb-2 border-b border-white/5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.4em]">Live Matrix Feed</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[9px] uppercase font-black text-primary tracking-widest font-sans">Blockchain Anchor</span>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex justify-center items-center">
                   <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.3em] animate-pulse">Synchronizing Intelligence...</div>
                </div>
            ) : (
                <div className="flex flex-col gap-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                    {news.length > 0 ? news.map((item, idx) => (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group relative flex flex-col p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all cursor-pointer overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-3 relative z-10">
                                <span className={`text-[10px] font-black tracking-widest uppercase ${item.sentiment === 'Bullish' ? 'text-bull' : 'text-bear'}`}>
                                    {item.asset} // {item.sentiment}
                                </span>
                                <div className="text-[10px] font-bold font-mono text-muted-foreground px-2 py-0.5 rounded bg-black/40 border border-white/5">
                                    CONF: <span className="text-foreground">{(item.confidence * 100).toFixed(0)}%</span>
                                </div>
                            </div>

                            <h3 className="text-[13px] font-medium text-foreground/90 leading-snug mb-4 relative z-10 font-sans tracking-tight pr-4">
                                {item.headline}
                            </h3>

                            <div className="flex justify-between items-center mt-auto relative z-10">
                                <div className="flex items-center gap-4">
                                    <span className={`text-[9px] font-bold tracking-[0.2em] px-2 py-0.5 rounded border ${getImpactStyle(item.impact)}`}>
                                        {item.impact}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground font-mono opacity-50 hidden sm:inline">
                                        HASH: {item.verifiable_hash.substring(0, 8)}
                                    </span>
                                </div>
                                
                                <a 
                                    href={`https://amoy.polygonscan.com/tx/${item.proof_tx}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-2 group/btn"
                                >
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground group-hover/btn:text-primary transition-colors whitespace-nowrap">Verify Proof</span>
                                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover/btn:border-primary/50 group-hover/btn:bg-primary/5 transition-all">
                                        <svg className="w-3.5 h-3.5 text-muted-foreground group-hover/btn:text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </div>
                                </a>
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.div>
                    )) : (
                        <div className="flex-1 flex justify-center items-center text-[10px] text-muted-foreground uppercase tracking-widest uppercase">No verified insights found</div>
                    )}
                </div>
            )}
        </GlassCard>
    );
}
