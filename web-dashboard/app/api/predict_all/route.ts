import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const execAsync = promisify(exec);
export const dynamic = 'force-dynamic'; // No caching

const CACHE_FILE = path.resolve(process.cwd(), '..', 'data', 'prediction_cache.json');
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 Minutes

async function checkAndRebuildScalers() {
    const dataDir = path.resolve(process.cwd(), '..', 'data');
    const scalerPath = path.join(dataDir, 'scaler_features_XAUUSD_1h.pkl'); // Check one key file

    // Simple check: if main scaler missing, assume all missing/corrupt
    if (!fs.existsSync(scalerPath)) {
        console.log("⚠️ Scalers missing. Triggering Auto-Recovery (rebuild_scalers.py)...");
        const scriptPath = path.resolve(process.cwd(), '..', 'tools', 'rebuild_scalers.py');
        try {
            await execAsync(`python "${scriptPath}"`, { cwd: path.resolve(process.cwd(), '..') });
            console.log("✅ Auto-Recovery Complete.");
        } catch (error) {
            console.error("❌ Auto-Recovery Failed:", error);
            // Proceed anyway, predict_all might fail but we tried
        }
    }
}

async function getAIRiskAssessment(newsHeadlines: string[]): Promise<string> {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_key_here') return "SITREP: Groq Intelligence Link Offline.";

    try {
        const prompt = `Analyze these geopolitical headlines and provide a high-conviction 2-sentence tactical risk assessment (MAX 50 words). Format as: 'SITREP: [Summary] // RISK_SCORE: [0-100]'. Headlines: ${newsHeadlines.join(" | ")}`;
        
        const resp = await fetch(GROQ_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3-70b-8192",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.5,
                max_tokens: 100
            })
        });

        if (!resp.ok) throw new Error("Groq API error");
        const data = await resp.json();
        return data.choices[0]?.message?.content || "SITREP: Intelligence data inconclusive.";
    } catch (e) {
        return "SITREP: AI Assessment failed during uplink.";
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const assets = searchParams.get('assets') || 'all';
    const forceRefresh = searchParams.get('refresh') === 'true';

    // 1. AUTO-RECOVERY CHECK
    await checkAndRebuildScalers();

    // 2. CACHE CHECK (Skip if forceRefresh is true)
    if (!forceRefresh && fs.existsSync(CACHE_FILE)) {
        try {
            const stats = fs.statSync(CACHE_FILE);
            const age = Date.now() - stats.mtimeMs;

            if (age < CACHE_DURATION_MS) {
                console.log(`⚡ Serving from Cache (${(age / 1000).toFixed(0)}s old)`);
                const cachedData = fs.readFileSync(CACHE_FILE, 'utf-8');
                return NextResponse.json(JSON.parse(cachedData));
            }
        } catch (e) {
            console.warn("Cache read error, ignoring:", e);
        }
    }

    // 3. READ FROM DAEMON CACHE
    if (!fs.existsSync(CACHE_FILE)) {
        return NextResponse.json(
            { error: "Cache empty. Daemon initializing... please wait 60s." }, 
            { status: 503 }
        );
    }

    try {
        const cachedData = fs.readFileSync(CACHE_FILE, 'utf-8');
        let data = JSON.parse(cachedData);
        
        // 4. ADD AI RISK ASSESSMENT (Groq Integration) - Only if not already present
        if (!data.ai_risk_assessment) {
            try {
                const newsResp = await fetch(`${new URL(request.url).origin}/api/verified-news`);
                const news = await newsResp.json();
                const headlines = news.map((n: any) => n.headline);
                const assessment = await getAIRiskAssessment(headlines);
                data.ai_risk_assessment = assessment;
            } catch (e) {
                console.error("AI Risk Assessment failed", e);
            }
        }
        
        return NextResponse.json(data);
    } catch (e) {
        console.error("Cache Read/Parse Error", e);
        return NextResponse.json({ error: "Failed to read daemon cache." }, { status: 500 });
    }
}
