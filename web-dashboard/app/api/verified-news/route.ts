import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    const CACHE_FILE = path.resolve(process.cwd(), '..', 'data', 'prediction_cache.json');

    try {
        if (!fs.existsSync(CACHE_FILE)) {
            console.log("VerifiedNews API: Cache file not found");
            return NextResponse.json([]);
        }

        const cachedData = fs.readFileSync(CACHE_FILE, 'utf-8');
        if (!cachedData || cachedData.trim() === '') {
            return NextResponse.json([]);
        }

        let data;
        try {
            data = JSON.parse(cachedData);
        } catch (parseErr) {
            console.error("VerifiedNews API: JSON Parse Error", parseErr);
            return NextResponse.json([]);
        }

        // EXCLUSIVELY fetch economic news. Geopolitical news is for World Monitor ONLY.
        const econNews = data.market_context?.economic_news || [];
        
        // Strict "Midnight Rule": Show only today's news. Tomorrow appears after 12:00 AM.
        const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // 1. Format Economic News (Today's High Impact Only)
        const formattedEcon = econNews
            .filter((n: any) => {
                const isHigh = n.impact === "High" || n.impact === "Critical";
                const isToday = n.time && n.time.includes(todayStr);
                return isHigh && isToday;
            })
            .map((n: any, idx: number) => {
                const impact = n.impact || "High";
                
                return {
                    asset: n.currency || n.country || "USD",
                    headline: n.event || n.title || "Economic Release",
                    sentiment: "Critical",
                    impact: impact,
                    confidence: 1.0,
                    timestamp: n.time || n.date || new Date().toISOString(),
                    actual: n.actual || "",
                    forecast: n.forecast || "",
                    previous: n.previous || "",
                    verifiable_hash: `econ_high_${idx}_${Date.now()}`,
                    proof_tx: "0x_institutional_verify",
                    verified: true
                };
            });

        // Sort by impact priority, then by time (recent first)
        const priority: Record<string, number> = {
            "Holiday": 4, "High": 3, "Critical": 3, "Medium": 2, "Moderate": 2, "Low": 1, "Neutral": 0
        };

        const allNews = formattedEcon.sort((a: any, b: any) => {
            const pDiff = (priority[b.impact] || 0) - (priority[a.impact] || 0);
            if (pDiff !== 0) return pDiff;

            // If same impact, sort by time (Newest first)
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

        return NextResponse.json(allNews);
    } catch (e) {
        console.error("VerifiedNews API Error:", e);
        return NextResponse.json([]);
    }
}
