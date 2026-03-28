"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TerminalContextType {
  hoveredAsset: string | null;
  setHoveredAsset: (asset: string | null) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export function TerminalProvider({ children }: { children: ReactNode }) {
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global listener for CMD+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <TerminalContext.Provider value={{ 
      hoveredAsset, 
      setHoveredAsset, 
      isCommandPaletteOpen, 
      setIsCommandPaletteOpen 
    }}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (!context) throw new Error("useTerminal must be used within a TerminalProvider");
  return context;
}
