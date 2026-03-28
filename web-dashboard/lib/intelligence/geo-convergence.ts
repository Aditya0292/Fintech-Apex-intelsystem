/**
 * Geo Convergence Engine
 * Detects "multi-source convergence zones" — cells where unrelated data streams
 * (conflict hotspots, military flights, satellites, earthquakes) overlap within
 * a geographic 1°×1° grid cell within the last 24 hours.
 *
 * Higher convergence = higher probability of a real-world developing situation.
 */

export type GeoEventType =
  | 'conflict'
  | 'military_flight'
  | 'satellite_overhead'
  | 'earthquake'
  | 'news_cluster';

export interface ConvergenceAlert {
  cellId: string;
  lat: number;     // Cell center
  lng: number;
  types: GeoEventType[];
  totalEvents: number;
  score: number;   // 0 – 100
  label: string;   // Human-readable region name
}

interface GeoCell {
  id: string;
  lat: number;
  lng: number;
  events: Map<GeoEventType, { count: number; lastSeen: Date }>;
}

// ── State ───────────────────────────────────────────────────────────────────
const cells = new Map<string, GeoCell>();
const WINDOW_MS = 24 * 60 * 60 * 1000;
const THRESHOLD = 2; // Min number of distinct event types to trigger alert

// ── Region Labels (rough reverse geocoding) ─────────────────────────────────
const REGIONS: { lat: number; lng: number; name: string; radius: number }[] = [
  { lat: 33.3,  lng: 44.4,  name: 'Baghdad, Iraq',          radius: 4  },
  { lat: 31.5,  lng: 34.5,  name: 'Tel Aviv, Israel',        radius: 3  },
  { lat: 35.7,  lng: 51.4,  name: 'Tehran, Iran',            radius: 4  },
  { lat: 48.4,  lng: 31.2,  name: 'Central Ukraine',         radius: 5  },
  { lat: 50.5,  lng: 30.5,  name: 'Kyiv, Ukraine',           radius: 3  },
  { lat: 10.0,  lng: 114.0, name: 'South China Sea',         radius: 8  },
  { lat: 23.1,  lng: 113.3, name: 'Pearl River Delta, China',radius: 3  },
  { lat: 39.9,  lng: 116.4, name: 'Beijing, China',          radius: 3  },
  { lat: 13.8,  lng: 100.5, name: 'Bangkok, Thailand',       radius: 3  },
  { lat: 1.3,   lng: 103.8, name: 'Singapore Strait',        radius: 3  },
  { lat: 25.3,  lng: 51.5,  name: 'Qatar / Persian Gulf',    radius: 4  },
  { lat: 0.3,   lng: 32.6,  name: 'Kampala, Uganda',         radius: 4  },
  { lat: 15.6,  lng: 32.5,  name: 'Khartoum, Sudan',         radius: 4  },
  { lat: -1.3,  lng: 36.8,  name: 'Nairobi, Kenya',          radius: 4  },
  { lat: 33.7,  lng: -7.4,  name: 'Casablanca, Morocco',     radius: 3  },
  { lat: 40.4,  lng: 49.9,  name: 'Baku, Azerbaijan',        radius: 3  },
  { lat: 43.0,  lng: 41.0,  name: 'Caucasus Region',         radius: 5  },
  { lat: 23.7,  lng: 90.4,  name: 'Dhaka, Bangladesh',       radius: 3  },
  { lat: 28.6,  lng: 77.2,  name: 'New Delhi, India',        radius: 3  },
  { lat: 55.8,  lng: 37.6,  name: 'Moscow, Russia',          radius: 3  },
];

function cellId(lat: number, lng: number): string {
  return `${Math.floor(lat)},${Math.floor(lng)}`;
}

function cellCenter(lat: number, lng: number): { lat: number; lng: number } {
  return { lat: Math.floor(lat) + 0.5, lng: Math.floor(lng) + 0.5 };
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R   = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a   = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getLabel(lat: number, lng: number): string {
  let best: { name: string; dist: number } | null = null;
  for (const r of REGIONS) {
    const d = haversine(lat, lng, r.lat, r.lng);
    if (d <= r.radius && (!best || d < best.dist)) {
      best = { name: r.name, dist: d };
    }
  }
  if (best) return best.name;

  // Regional fallback
  if (lat >= 25 && lat <= 40 && lng >= 25 && lng <= 75) return 'Middle East';
  if (lat >= 30 && lat <= 55 && lng >= 100 && lng <= 145) return 'East Asia';
  if (lat >= 35 && lat <= 70 && lng >= -10 && lng <= 40) return 'Europe';
  if (lat >= 44 && lat <= 75 && lng >= 20 && lng <= 180) return 'Russia/Eurasia';
  if (lat >= -35 && lat <= 35 && lng >= -20 && lng <= 55) return 'Africa';
  if (lat >= -10 && lat <= 25 && lng >= 90 && lng <= 130) return 'Southeast Asia';
  return `${lat.toFixed(1)}°N ${lng.toFixed(1)}°E`;
}

function pruneStale(): void {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [cid, cell] of cells) {
    for (const [type, data] of cell.events) {
      if (data.lastSeen.getTime() < cutoff) cell.events.delete(type);
    }
    if (cell.events.size === 0) cells.delete(cid);
  }
}

// ── Ingestion API ─────────────────────────────────────────────────────────
export function ingestEvent(lat: number, lng: number, type: GeoEventType, when: Date = new Date()): void {
  const id  = cellId(lat, lng);
  const ctr = cellCenter(lat, lng);

  let cell = cells.get(id);
  if (!cell) {
    cell = { id, lat: ctr.lat, lng: ctr.lng, events: new Map() };
    cells.set(id, cell);
  }
  const ex = cell.events.get(type);
  cell.events.set(type, { count: (ex?.count ?? 0) + 1, lastSeen: when });
}

export function ingestConflictHotspots(spots: { lat: number; lng: number }[]): void {
  for (const s of spots) ingestEvent(s.lat, s.lng, 'conflict');
}

export function ingestSatellitePositions(positions: { lat: number; lng: number }[]): void {
  for (const p of positions.slice(0, 30)) { // limit overhead checks
    ingestEvent(p.lat, p.lng, 'satellite_overhead');
  }
}

export function ingestNewsCluster(lat: number, lng: number): void {
  ingestEvent(lat, lng, 'news_cluster');
}

// ── Detection ─────────────────────────────────────────────────────────────
export function detectConvergence(): ConvergenceAlert[] {
  pruneStale();

  const alerts: ConvergenceAlert[] = [];
  for (const cell of cells.values()) {
    if (cell.events.size < THRESHOLD) continue;

    const types = Array.from(cell.events.keys());
    const total = Array.from(cell.events.values()).reduce((s, d) => s + d.count, 0);
    const typeScore  = cell.events.size * 25;
    const countBoost = Math.min(25, total * 2);
    const score      = Math.min(100, typeScore + countBoost);

    alerts.push({
      cellId:      cell.id,
      lat:         cell.lat,
      lng:         cell.lng,
      types,
      totalEvents: total,
      score,
      label:       getLabel(cell.lat, cell.lng),
    });
  }
  return alerts.sort((a, b) => b.score - a.score);
}

export function getCellCount(): number {
  return cells.size;
}

export function clearCells(): void {
  cells.clear();
}
