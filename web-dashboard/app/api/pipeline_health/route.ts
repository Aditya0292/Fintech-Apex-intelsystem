
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    const dataDir = path.resolve(process.cwd(), '..', 'data');
    const healthPath = path.join(dataDir, 'pipeline_health.json');
    const bustPath = path.join(dataDir, 'cache_bust.json');

    try {
        let healthData: {
            status: string;
            status_label?: string;
            last_hot_run_min_ago: number | null;
            last_full_run_min_ago: number | null;
            last_valid_signal_min_ago?: number | null;
            consecutive_failures: number;
            alert: boolean;
            recent_runs: any[];
        } = {
            status: 'unknown',
            status_label: 'Initializing...',
            last_hot_run_min_ago: null,
            last_full_run_min_ago: null,
            last_valid_signal_min_ago: null,
            consecutive_failures: 0,
            alert: false,
            recent_runs: []
        };

        if (fs.existsSync(healthPath)) {
            const rawHealth = fs.readFileSync(healthPath, 'utf-8');
            const state = JSON.parse(rawHealth);
            
            const now = Date.now();
            
            const calcAge = (isoStr: string | null) => {
                if (!isoStr) return null;
                return Math.round((now - new Date(isoStr).getTime()) / 60000);
            };

            healthData = {
                ...healthData,
                last_hot_run_min_ago: calcAge(state.last_hot),
                last_full_run_min_ago: calcAge(state.last_full),
                last_valid_signal_min_ago: calcAge(state.last_valid),
                consecutive_failures: state.consec_fail || 0,
                alert: state.consec_fail >= 3,
                status: state.status_msg ? state.status_msg.toLowerCase().split(' ')[0] : 'unknown',
                status_label: state.status_msg || 'Unknown'
            };
        }

        let cacheBust = null;
        if (fs.existsSync(bustPath)) {
            cacheBust = JSON.parse(fs.readFileSync(bustPath, 'utf-8'));
        }

        return NextResponse.json({
            ...healthData,
            last_cache_bust: cacheBust?.busted_at || null
        });

    } catch (error) {
        console.error("Pipeline Health API Error:", error);
        return NextResponse.json({ status: 'error', message: "Failed to read health state" }, { status: 500 });
    }
}
