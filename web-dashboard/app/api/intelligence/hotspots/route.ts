import { NextRequest, NextResponse } from "next/server";
import { upstashRedis } from "@/lib/intelligence/upstash-redis";

// Removed edge runtime to fix Turbopack panic

const MOCK_HOTSPOTS = [
  { id: "ME-01", region: "Middle East", lat: 32.4279, lng: 53.6880, intensity: 0.88, status: "CRITICAL", alerts: ["Drones detected", "Nuclear site monitored"] },
  { id: "EE-02", region: "Eastern Europe", lat: 48.3794, lng: 31.1656, intensity: 0.72, status: "HIGH", alerts: ["Military movement", "Border tension"] },
  { id: "SCS-03", region: "South China Sea", lat: 10.0000, lng: 114.0000, intensity: 0.55, status: "MED", alerts: ["Naval exercise", "Trade route alert"] },
  { id: "AF-04", region: "Africa", lat: 9.1450, lng: 40.4897, intensity: 0.34, status: "LOW", alerts: ["Resource protection", "Stable monitor"] },
];

export async function GET(req: NextRequest) {
  const nasaKey = process.env.NASA_FIRMS_API_KEY;
  
  // 1. Check Redis Cache for high-frequency updates
  const cached = await upstashRedis.get<any[]>("SITUATIONAL_HOTSPOTS");
  if (cached) return NextResponse.json(cached);

  // 2. NASA FIRMS Integration (Satellite Thermal Detection)
  if (nasaKey && nasaKey !== "your_nasa_firms_key_here") {
    try {
      // Fetch VIIRS_SNPP_NRT (Night-time/Near-realtime fire clusters)
      const url = `https://firms.modaps.eosdis.nasa.gov/api/country/json/${nasaKey}/VIIRS_SNPP_NRT/USA/1`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      
      if (resp.ok) {
        const raw = await resp.json();
        const liveNasa = (raw as any[]).slice(0, 20).map((d: any, idx: number) => ({
          id: `NASA-${idx}`,
          region: "Satellite Detection",
          lat: parseFloat(d.latitude),
          lng: parseFloat(d.longitude),
          intensity: Math.min(parseFloat(d.bright_ti4) / 400, 1.0),
          status: parseFloat(d.bright_ti4) > 350 ? "CRITICAL" : "HIGH",
          alerts: ["Thermal anomaly detected by NASA VIIRS", "SITREP: High-confidence thermal signature"]
        }));

        // 3. ACLED Conflict Integration (Ground Reality)
        const acledEmail = process.env.ACLED_EMAIL;
        const acledKey = process.env.ACLED_PASSWORD;
        let liveAcled: any[] = [];

        if (acledEmail && acledKey) {
          try {
            // Fetch verified conflict events from last 24h
            const acledUrl = `https://api.acleddata.com/acled/read/json?email=${acledEmail}&key=${acledKey}&limit=10`;
            const acledResp = await fetch(acledUrl, { signal: AbortSignal.timeout(5000) });
            if (acledResp.ok) {
              const acledData = await acledResp.json();
              liveAcled = (acledData.data || []).map((ev: any) => ({
                id: `ACLED-${ev.event_id_no}`,
                region: ev.country,
                lat: parseFloat(ev.latitude),
                lng: parseFloat(ev.longitude),
                intensity: 0.95,
                status: "CRITICAL",
                alerts: [`SITREP: ${ev.event_type}`, `Verified: ${ev.notes.slice(0, 50)}...`]
              }));
            }
          } catch (acledErr) {
            console.warn("[Hotspots] ACLED deep-sync failed:", acledErr);
          }
        }

        return NextResponse.json([...liveNasa, ...liveAcled, ...MOCK_HOTSPOTS]);
      }
    } catch (err) {
      console.warn("[Hotspots] NASA API sync failed, falling back to mock:", err);
    }
  }

  return NextResponse.json(MOCK_HOTSPOTS);
}
