import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

/**
 * Bootstrap Endpoint: Fast hydration of the entire situational state.
 * - Fetches from a global Redis cache (simulated here).
 * - Serves world hotspots, live feed channels, and current SITREP indices.
 */
export async function GET(req: NextRequest) {
  // Mock data for the situational awareness state
  const bootstrapState = {
    CONFLICT_HOTSPOTS: [
      { id: "ME-01", region: "Middle East", lat: 32.4279, lng: 53.6880, intensity: 0.88, status: "CRITICAL", alerts: ["Drones detected", "Nuclear site monitored"] },
      { id: "EE-02", region: "Eastern Europe", lat: 48.3794, lng: 31.1656, intensity: 0.72, status: "HIGH", alerts: ["Military movement", "Border tension"] },
      { id: "SCS-03", region: "South China Sea", lat: 10.0000, lng: 114.0000, intensity: 0.55, status: "MED", alerts: ["Naval exercise", "Trade route alert"] },
      { id: "AF-04", region: "Africa", lat: 9.1450, lng: 40.4897, intensity: 0.34, status: "LOW", alerts: ["Resource protection", "Stable monitor"] },
    ],
    NEWS_CHANNELS: [
      { id: "BLOOMBERG", name: "Bloomberg TV", url: "https://www.youtube.com/embed/dp8PhLsUcFE", status: "LIVE" },
      { id: "SKYNEWS", name: "Sky News", url: "https://www.youtube.com/embed/9AuqeydY-6A", status: "LIVE" },
      { id: "ALJAZEERA", name: "Al Jazeera", url: "https://www.youtube.com/embed/gCNeDWCI0vo", status: "LIVE" },
    ],
    SITREP_ALERTS: {
      globalDEFCON: 4,
      intelAlerts: [
        { id: "A1", type: "MILITARY", msg: "Satellite detect launch platform movement in Sector 7", time: "14:22:01" },
        { id: "A2", type: "ENERGY", msg: "Cyber breach detected on North Pipeline controller", time: "14:15:33" },
        { id: "A3", type: "MARKET", msg: "Sudden XAU/USD volatility spike on Middle East flash news", time: "14:02:11" },
      ]
    }
  };

  return NextResponse.json(bootstrapState, {
    headers: {
      'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
    }
  });
}
