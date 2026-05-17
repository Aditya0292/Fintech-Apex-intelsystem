"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { tacticalMapController } from "@/lib/intelligence/TacticalMapController";
import { LayerId } from "@/lib/intelligence/LayerRegistry.config";

interface TacticalLayerContextType {
  activeLayerIds: LayerId[];
  toggleLayer: (id: LayerId) => void;
  setActiveLayers: (ids: LayerId[]) => void;
}

const TacticalLayerContext = createContext<TacticalLayerContextType | undefined>(undefined);

export function TacticalLayerProvider({ children }: { children: React.ReactNode }) {
  const [activeLayerIds, setActiveLayerIds] = useState<LayerId[]>(["SITREP", "CONFLICT", "SATELLITES"]);

  // Synchronize state with singleton controller
  useEffect(() => {
    tacticalMapController.setActiveLayers(activeLayerIds);
  }, [activeLayerIds]);

  const toggleLayer = useCallback((id: LayerId) => {
    setActiveLayerIds((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  }, []);

  const setActiveLayers = useCallback((ids: LayerId[]) => {
    setActiveLayerIds(ids);
  }, []);

  return (
    <TacticalLayerContext.Provider value={{ activeLayerIds, toggleLayer, setActiveLayers }}>
      {children}
    </TacticalLayerContext.Provider>
  );
}

export function useTacticalLayers() {
  const context = useContext(TacticalLayerContext);
  if (context === undefined) {
    throw new Error("useTacticalLayers must be used within a TacticalLayerProvider");
  }
  return context;
}
