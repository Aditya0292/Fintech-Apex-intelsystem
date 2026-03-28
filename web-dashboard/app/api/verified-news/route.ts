import { NextResponse } from 'next/server';

// In a real production app, this would query the Python backend or a database
// For the hackathon demo, we provide high-impact, realistic verified insights
// that demonstrate the Blockchain Proof Layer.

const VERIFIED_NEWS = [
    {
        asset: "XAUUSD",
        headline: "US Core PCE Inflation Matches Estimates; Gold Firm",
        sentiment: "Bullish",
        impact: "High",
        confidence: 0.88,
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        verifiable_hash: "3a7b8c...90f1",
        proof_tx: "0x8fa1b4d32a9c1e7f6b5d4a3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a",
        verified: true
    },
    {
        asset: "EURUSD",
        headline: "ECB Signals Potential Rate Cut in Upcoming Quarter",
        sentiment: "Bearish",
        impact: "High",
        confidence: 0.92,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        verifiable_hash: "1f2e3d...4c5b",
        proof_tx: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
        verified: true
    },
    {
        asset: "USDJPY",
        headline: "Bank of Japan Unexpectedly Alters Yield Curve Control",
        sentiment: "Bullish",
        impact: "Critical",
        confidence: 0.96,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
        verifiable_hash: "5a6b7c...8d9e",
        proof_tx: "0x0f1e2d3c4b5a69788796a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4",
        verified: true
    }
];

export async function GET() {
    return NextResponse.json(VERIFIED_NEWS);
}
