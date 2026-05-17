
'use client';

import React, { useEffect, useState } from 'react';

interface HealthData {
    status: string;
    last_hot_run_min_ago: number | null;
    last_full_run_min_ago: number | null;
    consecutive_failures: number;
    alert: boolean;
    last_cache_bust: string | null;
}

export const PipelineStatusBar: React.FC = () => {
    const [health, setHealth] = useState<HealthData | null>(null);

    const fetchHealth = async () => {
        try {
            const resp = await fetch('/api/pipeline_health');
            if (resp.ok) {
                const data = await resp.json();
                setHealth(data);
            }
        } catch (e) {
            console.error("Health fetch failed", e);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000); // 30 seconds
        return () => clearInterval(interval);
    }, []);

    if (!health) return null;

    const getStatusColor = () => {
        if (health.alert || health.status === 'critical') return 'text-red-500';
        if (health.status === 'degraded' || (health.last_hot_run_min_ago && health.last_hot_run_min_ago > 30)) return 'text-amber-500';
        return 'text-emerald-500';
    };

    return (
        <div className="flex items-center space-x-6 px-4 py-1 bg-black/40 backdrop-blur-md border-t border-white/10 text-[10px] uppercase tracking-widest font-medium">
            <div className="flex items-center space-x-2">
                <span className="text-white/40">PIPELINE:</span>
                <span className={`flex items-center ${getStatusColor()}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
                    {health.status}
                </span>
            </div>

            <div className="flex items-center space-x-4 border-l border-white/10 pl-4">
                <div className="flex space-x-2">
                    <span className="text-white/40 text-[9px]">HOT:</span>
                    <span className="text-white/80">
                        {health.last_hot_run_min_ago !== null ? `${health.last_hot_run_min_ago}M AGO` : 'N/A'}
                    </span>
                </div>
                <div className="flex space-x-2">
                    <span className="text-white/40 text-[9px]">FULL:</span>
                    <span className="text-white/80">
                        {health.last_full_run_min_ago !== null ? `${health.last_full_run_min_ago}M AGO` : 'N/A'}
                    </span>
                </div>
            </div>

            {health.alert && (
                <div className="flex items-center space-x-2 animate-bounce bg-red-500/20 px-2 py-0.5 rounded border border-red-500/50 ml-auto">
                    <span className="text-red-500">⚠ {health.consecutive_failures} CONSECUTIVE FAILURES</span>
                </div>
            )}
        </div>
    );
};
