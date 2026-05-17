"use client";

import { useEffect, useState, useCallback } from "react";
import { luma } from "@luma.gl/core";
import { webgl2Adapter } from "@luma.gl/webgl";

// Force WebGL2 adapter registration BEFORE any DeckGL usage
// This prevents luma.gl from attempting WebGPU (which causes maxTextureDimension2D crashes)
luma.registerAdapters([webgl2Adapter]);

import Map from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { tacticalMapController } from "@/lib/intelligence/TacticalMapController";
import "maplibre-gl/dist/maplibre-gl.css";

// Institutional Map Configuration
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// ── GPU Error Boundary ─────────────────────────────────────────────────────
// Catches WebGPU/WebGL initialization failures gracefully.
import React from "react";

class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full rounded-3xl bg-[#030508] border border-white/5 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 max-w-md text-center px-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-xl">🌐</span>
            </div>
            <span className="text-[10px] font-black tracking-widest text-primary font-mono uppercase">
              GPU_INIT_FAILED
            </span>
            <p className="text-[9px] text-white/40 leading-relaxed">
              WebGL/WebGPU initialization failed. This typically happens when hardware acceleration
              is disabled or the GPU driver is unavailable.
            </p>
            <p className="text-[8px] text-white/20 font-mono break-all">
              {this.state.error}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 px-4 py-1.5 text-[9px] font-black uppercase tracking-wider bg-primary/20 text-primary rounded-full hover:bg-primary/30 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function WorldMonitorMap() {
  const [mounted, setMounted] = useState(false);
  const [gpuAvailable, setGpuAvailable] = useState(true);
  const [layers, setLayers] = useState<any[]>([]);
  const [viewState, setViewState] = useState(tacticalMapController.getViewState());

  useEffect(() => {
    // Check WebGL availability before attempting to mount DeckGL
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) {
        setGpuAvailable(false);
      }
    } catch {
      setGpuAvailable(false);
    }
    setMounted(true);
  }, []);

  // ── Reactive Controller Subscription ─────────────────────────────────────
  useEffect(() => {
    const unsubscribe = tacticalMapController.subscribe((newLayers, newViewState) => {
      setLayers(newLayers);
      if (newViewState) {
        setViewState((prev) => ({ ...prev, ...newViewState }));
      }
    });
    return unsubscribe;
  }, []);

  // Update controller when user manually interacts with the map
  const onViewStateChange = useCallback(({ viewState: nextViewState }: any) => {
    setViewState(nextViewState);
    tacticalMapController.updateViewState(nextViewState);
  }, []);

  if (!mounted) return (
    <div className="w-full h-full rounded-3xl bg-[#030508] border border-white/5 flex items-center justify-center">
       <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-t border-primary animate-spin" />
          <span className="text-[10px] font-black tracking-widest text-primary font-mono">MAP_INITIALIZING...</span>
       </div>
    </div>
  );

  if (!gpuAvailable) return (
    <div className="w-full h-full rounded-3xl bg-[#030508] border border-white/5 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="text-[10px] font-black tracking-widest text-primary/60 font-mono uppercase">
          WebGL Unavailable
        </span>
        <p className="text-[9px] text-white/30 max-w-xs">
          Enable hardware acceleration in your browser settings to use the tactical map.
        </p>
      </div>
    </div>
  );

  return (
    <MapErrorBoundary>
      <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/5 bg-[#030508]">
        <DeckGL
          viewState={viewState}
          onViewStateChange={onViewStateChange}
          controller={{
            dragRotate: process.env.NEXT_PUBLIC_MAP_MODE === '3d',
            touchRotate: process.env.NEXT_PUBLIC_MAP_MODE === '3d',
            keyboard: true
          }}
          layers={layers}
          useDevicePixels={false}
          _typedArrayManagerProps={{ overAlloc: 1, poolSize: 0 }}
          getTooltip={({ object }: any) => object && {
            html: `
              <div class="bg-black/98 border border-white/10 p-3 rounded-xl backdrop-blur-3xl shadow-2xl ring-1 ring-white/5">
                <div class="text-[10px] font-black text-primary uppercase mb-1 tracking-widest flex items-center gap-2">
                  <div class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                  ${object.region || object.name || "TAC_OBJECT"}
                </div>
                <div class="text-[9px] text-white/60 font-medium leading-relaxed">
                  ${object.alerts ? object.alerts.join('<br/>') : `LAT: ${object.lat?.toFixed(2) || '?'} LNG: ${object.lng?.toFixed(2) || '?'}`}
                </div>
                ${object.status ? `
                  <div class="mt-2 pt-2 border-t border-white/5 flex justify-between items-center">
                    <span class="text-[7px] font-black text-white/30 uppercase tracking-tighter">Status</span>
                    <span class="text-[7px] font-black text-primary uppercase">${object.status}</span>
                  </div>
                ` : ''}
              </div>
            `,
            style: { backgroundColor: 'transparent', padding: '0px' }
          }}
        >
          <Map
            mapStyle={MAP_STYLE}
            reuseMaps
            attributionControl={false}
          />
        </DeckGL>

        {/* Map Control Overlays */}
        <div className="absolute top-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none">
          <div className="px-3 py-1.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            <span className="text-[9px] font-black text-white/80 uppercase tracking-widest">WebGL_Reactive_Registry</span>
          </div>
          <div className="px-3 py-1 bg-black/40 backdrop-blur-sm border border-white/5 rounded-lg text-[8px] font-mono text-white/30 uppercase flex gap-3">
             <span>Z: {viewState.zoom.toFixed(1)}</span>
             <span>P: {viewState.pitch.toFixed(0)}°</span>
             <span>B: {viewState.bearing.toFixed(0)}°</span>
          </div>
        </div>
        
        {/* Visual Depth Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none opacity-40" />
      </div>
    </MapErrorBoundary>
  );
}
