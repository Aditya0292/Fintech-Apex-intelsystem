import { NextRequest, NextResponse } from "next/server";

// Removed edge runtime to fix Turbopack panic

const MOCK_FLIGHTS = [
  { id: "A-01", flight: "TK-412", type: "CARGO", lat: 35.2, lng: 33.3, status: "EN_ROUTE", alerts: ["Eastern Med Hub"] },
  { id: "A-02", flight: "EK-201", type: "SCHEDULED", lat: 25.2, lng: 55.3, status: "EN_ROUTE", alerts: ["Persian Gulf Corridor"] },
  { id: "A-03", flight: "LX-99", type: "MIL_TRANSIT", lat: 50.1, lng: 8.6, status: "EN_ROUTE", alerts: ["Ramstein Corridor"] },
];

/**
 * Aviation Intelligence Route
 * Integrates AviationStack live flight tracking.
 */
export async function GET(req: NextRequest) {
  const avKey = process.env.AVIATIONSTACK_API_KEY;

  if (avKey && avKey !== "your_aviation_key_here") {
    try {
      // Fetch live flights focusing on global transit hubs
      // Max 50 tracking items for 60FPS dashboard stability
      const url = `http://api.aviationstack.com/v1/flights?access_key=${avKey}&limit=50`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      
      if (resp.ok) {
        const raw = await resp.json();
        const live = (raw.data || []).filter((f: any) => f.live).map((f: any, i: number) => ({
          id: `AV-${i}`,
          flight: f.flight?.iata || "N/A",
          type: f.flight?.icao ? "SCHEDULED" : "CARGO",
          lat: parseFloat(f.live.latitude),
          lng: parseFloat(f.live.longitude),
          status: "LIVE_SYNC",
          lastUpdate: new Date().toISOString()
        }));

        return NextResponse.json(live.length > 0 ? live : MOCK_FLIGHTS);
      }
    } catch (err) {
      console.warn("[Aviation] API sync failed, falling back to mock:", err);
    }
  }

  return NextResponse.json(MOCK_FLIGHTS);
}
