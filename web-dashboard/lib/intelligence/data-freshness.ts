/**
 * Data Freshness Tracker
 * Monitors every data source in real-time to prevent showing misleading
 * "all-clear" signals when we actually have stale or missing data.
 * Generates structured "Intelligence Gap" warnings.
 */

export type DataSourceId =
  | 'satellites'
  | 'conflict_hotspots'
  | 'news_feed'
  | 'sitrep_alerts'
  | 'news_channels'
  | 'geo_convergence'
  | 'market_data'
  | 'weather'
  | 'earthquake';

export type FreshnessStatus = 'fresh' | 'stale' | 'very_stale' | 'no_data' | 'error';

export interface DataSourceState {
  id: DataSourceId;
  name: string;
  lastUpdate: Date | null;
  lastError: string | null;
  itemCount: number;
  status: FreshnessStatus;
  requiredForRisk: boolean;
  latencyMs?: number;
}

export interface DataFreshnessSummary {
  totalSources: number;
  activeSources: number;
  staleSources: number;
  errorSources: number;
  overallStatus: 'sufficient' | 'limited' | 'insufficient';
  coveragePercent: number;
  oldestUpdate: Date | null;
  newestUpdate: Date | null;
}

// Thresholds
const FRESH_MS    = 15  * 60 * 1000; // 15 minutes
const STALE_MS    = 2   * 60 * 60 * 1000; // 2 hours
const VERY_STALE_MS = 6 * 60 * 60 * 1000; // 6 hours

const SOURCE_META: Record<DataSourceId, { name: string; requiredForRisk: boolean }> = {
  satellites:        { name: 'Orbital Surveillance',  requiredForRisk: true  },
  conflict_hotspots: { name: 'Conflict Hotspots',     requiredForRisk: true  },
  news_feed:         { name: 'Live News Intelligence', requiredForRisk: true  },
  sitrep_alerts:     { name: 'SITREP Alerts',          requiredForRisk: true  },
  news_channels:     { name: 'Channel Directory',      requiredForRisk: false },
  geo_convergence:   { name: 'Geo Convergence Engine', requiredForRisk: true  },
  market_data:       { name: 'Market Data Feed',       requiredForRisk: false },
  weather:           { name: 'Weather Alerts',         requiredForRisk: false },
  earthquake:        { name: 'Seismic Monitor',        requiredForRisk: false },
};

const GAP_MESSAGES: Record<DataSourceId, string> = {
  satellites:        'Orbital surveillance offline — satellite positions unknown',
  conflict_hotspots: 'Conflict hotspot data unavailable — threat map degraded',
  news_feed:         'Live news intelligence offline — breaking events may be missed',
  sitrep_alerts:     'SITREP feed not updating — situational awareness degraded',
  news_channels:     'Channel directory stale — feed metadata may be outdated',
  geo_convergence:   'Geo convergence engine offline — convergence zones undetected',
  market_data:       'Market data feed offline — volatility signals unavailable',
  weather:           'Weather alerts unavailable — severe weather events may be missed',
  earthquake:        'Seismic monitor offline — earthquake events undetected',
};

class DataFreshnessTracker {
  private sources = new Map<DataSourceId, DataSourceState>();
  private listeners = new Set<() => void>();

  constructor() {
    for (const [id, meta] of Object.entries(SOURCE_META)) {
      this.sources.set(id as DataSourceId, {
        id: id as DataSourceId,
        name: meta.name,
        lastUpdate: null,
        lastError: null,
        itemCount: 0,
        status: 'no_data',
        requiredForRisk: meta.requiredForRisk,
      });
    }
  }

  recordUpdate(id: DataSourceId, itemCount = 1, latencyMs?: number): void {
    const source = this.sources.get(id);
    if (!source) return;
    source.lastUpdate = new Date();
    source.itemCount  = (source.itemCount ?? 0) + itemCount;
    source.lastError  = null;
    source.latencyMs  = latencyMs;
    source.status     = this.calcStatus(source);
    this.notify();
  }

  recordError(id: DataSourceId, error: string): void {
    const source = this.sources.get(id);
    if (!source) return;
    source.lastError = error;
    source.status    = 'error';
    this.notify();
  }

  getSource(id: DataSourceId): DataSourceState | undefined {
    const s = this.sources.get(id);
    if (s) s.status = this.calcStatus(s);
    return s;
  }

  getAllSources(): DataSourceState[] {
    return Array.from(this.sources.values()).map(s => ({
      ...s,
      status: this.calcStatus(s),
    }));
  }

  getSummary(): DataFreshnessSummary {
    const all      = this.getAllSources();
    const riskSrcs = all.filter(s => s.requiredForRisk);
    const active   = all.filter(s => ['fresh', 'stale'].includes(s.status));
    const activeR  = riskSrcs.filter(s => ['fresh', 'stale'].includes(s.status));
    const stale    = all.filter(s => ['stale', 'very_stale'].includes(s.status));
    const errors   = all.filter(s => s.status === 'error');
    const updates  = all.filter(s => s.lastUpdate).map(s => s.lastUpdate!.getTime());

    const coverage = riskSrcs.length > 0
      ? Math.round((activeR.length / riskSrcs.length) * 100)
      : 0;

    const overall: DataFreshnessSummary['overallStatus'] =
      coverage >= 75 ? 'sufficient' :
      coverage >= 33 ? 'limited'    : 'insufficient';

    return {
      totalSources:  all.length,
      activeSources: active.length,
      staleSources:  stale.length,
      errorSources:  errors.length,
      overallStatus: overall,
      coveragePercent: coverage,
      oldestUpdate: updates.length ? new Date(Math.min(...updates)) : null,
      newestUpdate: updates.length ? new Date(Math.max(...updates)) : null,
    };
  }

  getIntelGaps(): { source: DataSourceId; message: string; severity: 'critical' | 'warning' }[] {
    return this.getAllSources()
      .filter(s => ['no_data', 'very_stale', 'error'].includes(s.status))
      .map(s => ({
        source: s.id,
        message: GAP_MESSAGES[s.id] ?? `${s.name} data unavailable`,
        severity: (s.requiredForRisk || s.status === 'error') ? 'critical' : 'warning' as 'critical' | 'warning',
      }))
      .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'critical' ? -1 : 1));
  }

  hasCriticalGaps(): boolean {
    return this.getIntelGaps().some(g => g.severity === 'critical');
  }

  /** Human-readable time-since string */
  timeSince(id: DataSourceId): string {
    const s = this.sources.get(id);
    if (!s?.lastUpdate) return 'never';
    const ms = Date.now() - s.lastUpdate.getTime();
    if (ms < 60_000)   return 'just now';
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
    return `${Math.floor(ms / 3_600_000)}h ago`;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private calcStatus(s: DataSourceState): FreshnessStatus {
    if (s.lastError) return 'error';
    if (!s.lastUpdate) return 'no_data';
    const age = Date.now() - s.lastUpdate.getTime();
    if (age < FRESH_MS)      return 'fresh';
    if (age < STALE_MS)      return 'stale';
    if (age < VERY_STALE_MS) return 'very_stale';
    return 'no_data';
  }

  private notify(): void {
    for (const l of this.listeners) {
      try { l(); } catch { /* ignore */ }
    }
  }
}

// Singleton
export const dataFreshness = new DataFreshnessTracker();

// Status helpers
export function freshnessColor(status: FreshnessStatus): string {
  switch (status) {
    case 'fresh':      return '#22d3ee';  // cyan
    case 'stale':      return '#f59e0b';  // amber
    case 'very_stale': return '#f97316';  // orange
    case 'error':      return '#ef4444';  // red
    default:           return '#6b7280';  // gray
  }
}

export function freshnessIcon(status: FreshnessStatus): string {
  switch (status) {
    case 'fresh':      return '●';
    case 'stale':      return '◐';
    case 'very_stale': return '○';
    case 'error':      return '✕';
    default:           return '○';
  }
}
