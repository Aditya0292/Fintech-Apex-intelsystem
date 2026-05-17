import { globalDataLoader } from "./data-loader";
import { createTacticalLayer, LayerId } from "./LayerRegistry.config";

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
  transitionDuration?: number;
  transitionInterpolator?: any;
};

type Listener = (layers: any[], viewState?: ViewState) => void;

class TacticalMapController {
  private listeners: Listener[] = [];
  private activeLayerIds: LayerId[] = [
    "SITREP", 
    "CONFLICT", 
    "SATELLITES", 
    "IRAN_FOCUS", 
    "UKRAINE_FOCUS", 
    "NUCLEAR", 
    "TRADE"
  ];
  private layerData: Map<LayerId, any[]> = new Map();
  private currentViewState: ViewState = {
    longitude: 25,
    latitude: 35,
    zoom: 2.2, // Slightly more zoomed in for better focus
    pitch: 45, // More tactical pitch as seen in reference
    bearing: 0,
  };

  private geojsonCache: Map<string, any> = new Map();
  private time: number = 0;
  private animationFrameId: number | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.initIntelligenceStreams();
      this.loadHighFidelityGeoJSON();
      this.initMockTrajectories();
      this.startAnimationLoop();
    }
  }

  private startAnimationLoop() {
    const loop = (timestamp: number) => {
      this.time = timestamp;
      this.notify();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  private initIntelligenceStreams() {
    // 1. Conflict Hotspots (Glow/Auto-Pan Focus)
    globalDataLoader.subscribe<any[]>("CONFLICT_HOTSPOTS", (data) => {
      this.updateLayerData("CONFLICT", data);
      
      // Separate Nuclear and Bases if detected in metadata
      const nuclear = data.filter(d => d.type === 'NUCLEAR' || d.alerts?.some((a: string) => a.toLowerCase().includes('nuclear')));
      const bases = data.filter(d => d.type === 'BASE' || d.alerts?.some((a: string) => a.toLowerCase().includes('military')));
      
      if (nuclear.length) this.updateLayerData("NUCLEAR", nuclear);
      if (bases.length) this.updateLayerData("MILITARY_BASES", bases);
    });

    // 2. Satellites
    globalDataLoader.subscribe<any[]>("SATELLITES", (data) => {
      this.updateLayerData("SATELLITES", data);
    });

    // 3. Situational Alerts
    globalDataLoader.subscribe<any[]>("SITREP_ALERTS", (data) => {
      this.updateLayerData("SITREP", data);
    });

    // 4. Maritime Surveillance (Global Vessels)
    globalDataLoader.subscribe<any[]>("MARITIME", (data) => {
      this.updateLayerData("MARITIME", data);
    });

    // 5. Aviation Surveillance (Air Traffic)
    globalDataLoader.subscribe<any[]>("AVIATION", (data) => {
      this.updateLayerData("AVIATION", data);
    });
  }

  private async loadHighFidelityGeoJSON() {
    try {
      // Fetch world borders to filter for focus countries
      const response = await fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson");
      const worldGeo = await response.json();
      
      const iran = worldGeo.features.find((f: any) => f.properties.ISO_A3 === "IRN");
      const ukraine = worldGeo.features.find((f: any) => f.properties.ISO_A3 === "UKR");
      
      if (iran) this.updateLayerData("IRAN_FOCUS", [iran]);
      if (ukraine) this.updateLayerData("UKRAINE_FOCUS", [ukraine]);
    } catch (err) {
      console.warn("[TacticalMap] Failed to load focus GeoJSON layers:", err);
    }
  }

  private initMockTrajectories() {
    // Adding Elite trade/projectile paths to match reference visual
    const mockArcs = [
      { source: [35.1, 39.0], target: [100.1, 35.0] }, // Middle East to Asia
      { source: [44.0, 50.0], target: [10.0, 52.0] },  // Russia to Europe
      { source: [120.0, 25.0], target: [140.0, 35.0] }, // Asia Pacific flow
    ];
    this.updateLayerData("TRADE", mockArcs);
  }

  public updateLayerData(id: LayerId, data: any[]) {
    this.layerData.set(id, data);
    this.notify();
  }

  public setActiveLayers(ids: LayerId[]) {
    this.activeLayerIds = ids;
    this.notify();
  }

  public updateViewState(viewState: ViewState) {
    this.currentViewState = { ...this.currentViewState, ...viewState };
  }

  private performAutoPan(lng: number, lat: number) {
    this.currentViewState = {
      ...this.currentViewState,
      longitude: lng,
      latitude: lat,
      zoom: 6,
      transitionDuration: 2500,
    };
    this.notify();
  }

  public subscribe(cb: Listener) {
    this.listeners.push(cb);
    this.notify();
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    const activeLayers = this.activeLayerIds
      .map((id) => {
        const data = this.layerData.get(id) || [];
        return createTacticalLayer(id, data, this.time);
      })
      .filter(Boolean);

    this.listeners.forEach((l) => l(activeLayers, this.currentViewState));
  }

  public getViewState() {
    return this.currentViewState;
  }
}

export const tacticalMapController = new TacticalMapController();
