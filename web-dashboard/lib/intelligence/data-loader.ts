/**
 * DataLoader v2 — Intelligence Pipeline
 * 
 * Orchestrates multi-source ingestion for:
 * 1. Orbital Surveillance (SGP4)
 * 2. Geo-Convergence (Multi-source events)
 * 3. Real-time Sitrep API
 * 
 * DESIGN: Safe hydration pattern to prevent bundle hangs in Next.js Dev.
 */
import { globalScheduler } from './refresh-scheduler';
import {
  startPropagationLoop,
  updateTLEs,
  type SatellitePosition,
} from './satellites';
import { dataFreshness } from './data-freshness';
import type { DataSourceId } from './data-freshness';
import {
  detectConvergence,
  ingestConflictHotspots,
  ingestSatellitePositions,
} from './geo-convergence';

type Listener<T> = (data: T) => void;

interface StreamEntry {
  data: unknown;
  listeners: Listener<unknown>[];
  failCount: number;
}

export class DataLoader {
  private streams = new Map<string, StreamEntry>();
  private satCleanup: (() => void) | null = null;
  private isHydrated = false;

  constructor() {
    // Constructor is nobackup-op to speed up module evaluation
  }

  /**
   * Safe Hydration: Starts the background engine only when called from 
   * a client component's useEffect.
   */
  public hydrate() {
    if (this.isHydrated || typeof window === 'undefined') return;
    this.isHydrated = true;

    console.log("[DataLoader] Initializing Intelligence Engine...");

    // 1. Burst Hydration
    this.pull('BOOTSTRAP', '/api/intelligence/bootstrap', 0);

    // 2. Start Satellite Physics (Deferred 1s to prioritize UI render)
    setTimeout(() => this.startSatellites(), 1000);

    // 3. Register Continuous Streams
    setTimeout(() => {
      this.registerStream('CONFLICT_HOTSPOTS', '/api/intelligence/hotspots', 20000);
      this.registerStream('NEWS_FEED', '/api/verified-news', 60000);
      this.registerStream('SITREP_ALERTS', '/api/intelligence/sitrep', 10000);
      this.registerStream('MARITIME', '/api/intelligence/maritime', 30000);
      this.registerStream('AVIATION', '/api/intelligence/aviation', 45000);
    }, 500);
  }

  private async startSatellites() {
    const onPositions = (positions: SatellitePosition[]) => {
      this.push('SATELLITES', positions);
      dataFreshness.recordUpdate('satellites', positions.length);
      ingestSatellitePositions(positions);
      
      const zones = detectConvergence();
      this.push('CONVERGENCE_ZONES', zones);
      if (zones.length > 0) dataFreshness.recordUpdate('geo_convergence', zones.length);
    };

    try {
      this.satCleanup = await startPropagationLoop(onPositions, 5000);
    } catch (err) {
      console.warn("[DataLoader] Orbital engine failed to start:", err);
    }
  }

  private registerStream(id: string, url: string, intervalMs: number) {
    globalScheduler.register(id, async () => {
      await this.pull(id, url);
    }, intervalMs);
    this.pull(id, url);
  }

  private async pull(id: string, url: string, delayMs = 0): Promise<void> {
    if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));

    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      if (id === 'BOOTSTRAP') {
        Object.entries(data as Record<string, unknown>).forEach(([k, v]) => this.push(k, v));
      } else {
        if (id === 'CONFLICT_HOTSPOTS' && Array.isArray(data)) ingestConflictHotspots(data);
        this.push(id, data);
      }

      const dsId = id.toLowerCase() as DataSourceId;
      if (this.isKnownSource(dsId)) {
         dataFreshness.recordUpdate(dsId, Array.isArray(data) ? data.length : 1);
      }
    } catch (err) {
      const dsId = id.toLowerCase() as DataSourceId;
      if (this.isKnownSource(dsId)) dataFreshness.recordError(dsId, String(err));
    }
  }

  private push(id: string, data: unknown): void {
    if (data == null) return;
    let entry = this.streams.get(id);
    if (!entry) {
      entry = { data: null, listeners: [], failCount: 0 };
      this.streams.set(id, entry);
    }
    entry.data = data;
    entry.listeners.forEach(cb => { try { cb(data); } catch { /* fail-safe */ } });
  }

  public subscribe<T>(id: string, listener: Listener<T>): () => void {
    // Automatically trigger hydration on first subscriber
    this.hydrate();

    let entry = this.streams.get(id);
    if (!entry) {
      entry = { data: null, listeners: [], failCount: 0 };
      this.streams.set(id, entry);
    }
    entry.listeners.push(listener as Listener<unknown>);
    if (entry.data != null) { try { listener(entry.data as T); } catch { /* skip */ } }

    return () => { entry!.listeners = entry!.listeners.filter(l => l !== listener); };
  }

  public get<T>(id: string): T | undefined { return this.streams.get(id)?.data as T; }

  public destroy(): void {
    this.satCleanup?.();
  }

  private isKnownSource(id: string): id is DataSourceId {
    const known: DataSourceId[] = ['satellites','conflict_hotspots','news_feed','sitrep_alerts','news_channels','geo_convergence', 'maritime'];
    return known.includes(id as DataSourceId);
  }
}

export const globalDataLoader = new DataLoader();
