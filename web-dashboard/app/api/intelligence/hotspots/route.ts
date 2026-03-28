import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const hotspots = [
    { id: "ME-01", region: "Middle East", lat: 32.4279, lng: 53.6880, intensity: 0.88, status: "CRITICAL", alerts: ["Drones detected", "Nuclear site monitored"] },
    { id: "EE-02", region: "Eastern Europe", lat: 48.3794, lng: 31.1656, intensity: 0.72, status: "HIGH", alerts: ["Military movement", "Border tension"] },
    { id: "SCS-03", region: "South China Sea", lat: 10.0000, lng: 114.0000, intensity: 0.55, status: "MED", alerts: ["Naval exercise", "Trade route alert"] },
    { id: "AF-04", region: "Africa", lat: 9.1450, lng: 40.4897, intensity: 0.34, status: "LOW", alerts: ["Resource protection", "Stable monitor"] },
  ];

  return NextResponse.json(hotspots);
}
