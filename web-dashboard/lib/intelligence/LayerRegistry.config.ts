import { ScatterplotLayer, LineLayer, ArcLayer, GeoJsonLayer } from "@deck.gl/layers";
import { SAT_COLORS } from "./satellites";

export type LayerId = 
  | 'SITREP' 
  | 'CONFLICT' 
  | 'SATELLITES' 
  | 'NUCLEAR' 
  | 'MILITARY_BASES'
  | 'IRAN_FOCUS' 
  | 'UKRAINE_FOCUS' 
  | 'TRADE'
  | 'PIPELINES'
  | 'UNDERSEA_CABLES'
  | 'MARITIME'
  | 'AVIATION';

export interface LayerConfig {
  id: LayerId;
  type: 'scatterplot' | 'line' | 'arc' | 'geojson';
  color: [number, number, number, number];
  glow: boolean;
  blending: 'additive' | 'normal';
}

export const LAYER_REGISTRY: Record<LayerId, LayerConfig> = {
  SITREP: { id: 'SITREP', type: 'scatterplot', color: [34, 211, 238, 140], glow: true, blending: 'additive' },
  CONFLICT: { id: 'CONFLICT', type: 'scatterplot', color: [239, 68, 68, 180], glow: true, blending: 'additive' },
  NUCLEAR: { id: 'NUCLEAR', type: 'scatterplot', color: [234, 179, 8, 220], glow: true, blending: 'additive' },
  MILITARY_BASES: { id: 'MILITARY_BASES', type: 'scatterplot', color: [59, 130, 246, 200], glow: false, blending: 'normal' },
  SATELLITES: { id: 'SATELLITES', type: 'scatterplot', color: [255, 255, 255, 200], glow: false, blending: 'normal' },
  IRAN_FOCUS: { id: 'IRAN_FOCUS', type: 'geojson', color: [239, 68, 68, 80], glow: false, blending: 'normal' },
  UKRAINE_FOCUS: { id: 'UKRAINE_FOCUS', type: 'geojson', color: [249, 115, 22, 60], glow: false, blending: 'normal' },
  TRADE: { id: 'TRADE', type: 'arc', color: [249, 115, 22, 120], glow: true, blending: 'additive' },
  PIPELINES: { id: 'PIPELINES', type: 'line', color: [16, 185, 129, 100], glow: false, blending: 'normal' },
  UNDERSEA_CABLES: { id: 'UNDERSEA_CABLES', type: 'line', color: [139, 92, 246, 80], glow: false, blending: 'normal' },
  MARITIME: { id: 'MARITIME', type: 'scatterplot', color: [34, 211, 238, 200], glow: true, blending: 'additive' },
  AVIATION: { id: 'AVIATION', type: 'scatterplot', color: [234, 179, 8, 200], glow: true, blending: 'additive' }
};

/**
 * Tactical Layer Factory
 * Generates Elite-fidelity Deck.gl layers based on the registry.
 */
export const createTacticalLayer = (id: LayerId, data: any[], time: number = 0) => {
  const config = LAYER_REGISTRY[id];
  if (!config) return null;

  switch (id) {
    case 'CONFLICT':
    case 'SITREP':
      return new ScatterplotLayer({
        id: `layer-${id}`,
        data,
        getPosition: (d: any) => [d.lng, d.lat],
        getFillColor: (d: any) => {
          if (d.status === "CRITICAL") {
            // High-fidelity GPU pulsing: normalizes sin wave to 0-1, modulates alpha aggressively
            const alpha = 80 + ((Math.sin(time / 200) + 1) / 2) * 175;
            return [239, 68, 68, alpha];
          }
          return config.color;
        },
        updateTriggers: {
          getFillColor: [time] // Deckgl natively updates the memory buffer without react re-renders
        },
        getRadius: (d: any) => (d.intensity || 1) * 30000,
        radiusMinPixels: 7,
        radiusMaxPixels: 80,
        stroked: true,
        getLineColor: [255, 255, 255, 100],
        lineWidthMinPixels: 1,
        pickable: true,
        parameters: { depthTest: false, blend: true, blendFunc: [1, 1] } // GL_ONE, GL_ONE additive blending
      });

    case 'NUCLEAR':
    case 'MILITARY_BASES':
      return new ScatterplotLayer({
        id: `layer-${id}`,
        data,
        getPosition: (d: any) => [d.lng, d.lat],
        getFillColor: config.color,
        getRadius: 20000,
        radiusMinPixels: 10,
        radiusMaxPixels: 20,
        stroked: true,
        getLineColor: [255, 255, 255, 150],
        lineWidthMinPixels: 2,
        pickable: true
      });

    case 'MARITIME':
      return new ScatterplotLayer({
        id: `layer-MARITIME`,
        data,
        getPosition: (d: any) => [d.lng, d.lat],
        getFillColor: [34, 211, 238, 200],
        getRadius: 12000,
        radiusMinPixels: 8,
        radiusMaxPixels: 15,
        stroked: true,
        getLineColor: [255, 255, 255, 150],
        lineWidthMinPixels: 1,
        pickable: true,
        parameters: { depthTest: false, blend: true, blendFunc: [1, 1] }
      });

    case 'AVIATION':
      return new ScatterplotLayer({
        id: `layer-AVIATION`,
        data,
        getPosition: (d: any) => [d.lng, d.lat],
        getFillColor: [234, 179, 8, 200], // Amber/Yellow
        getRadius: 10000,
        radiusMinPixels: 8,
        radiusMaxPixels: 18,
        stroked: true,
        getLineColor: [255, 255, 255, 180],
        lineWidthMinPixels: 1,
        pickable: true,
        parameters: { depthTest: false, blend: true, blendFunc: [1, 1] }
      });

    case 'IRAN_FOCUS':
    case 'UKRAINE_FOCUS':
      return new GeoJsonLayer({
        id: `layer-${id}`,
        data,
        filled: true,
        getFillColor: (d: any) => {
          // Dynamic Zone Intensity Logic
          const intensity = d.properties?.intensity || 50;
          const alpha = Math.min(255, 20 + (intensity * 2)); // 15%+ Base transparency matching intensity
          return [config.color[0], config.color[1], config.color[2], alpha];
        },
        stroked: true,
        getLineColor: [config.color[0], config.color[1], config.color[2], 255],
        getLineWidth: 1,
        lineWidthUnits: 'pixels',
        lineWidthMinPixels: 1,
        pickable: true
      });

    case 'TRADE':
      return new ArcLayer({
        id: `layer-TRADE`,
        data,
        getSourcePosition: (d: any) => d.source,
        getTargetPosition: (d: any) => d.target,
        getSourceColor: [249, 115, 22, 40],
        getTargetColor: [249, 115, 22, 200],
        getWidth: 3,
        widthMinPixels: 1,
        parameters: { depthTest: false, blend: true, blendFunc: [1, 1] }
      });

    case 'SATELLITES':
      return new ScatterplotLayer({
        id: `layer-SATELLITES`,
        data,
        getPosition: (s: any) => [s.lng, s.lat],
        getFillColor: (s: any) => {
           const hex = (SAT_COLORS as any)[s.type] || "#ffffff";
           const r = parseInt(hex.slice(1, 3), 16);
           const g = parseInt(hex.slice(3, 5), 16);
           const b = parseInt(hex.slice(5, 7), 16);
           return [r, g, b, 200];
        },
        getRadius: 15000,
        radiusMinPixels: 5,
        radiusMaxPixels: 10,
        stroked: true,
        getLineColor: [255, 255, 255, 120]
      });

    default:
      return null;
  }
};
