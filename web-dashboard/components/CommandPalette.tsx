"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: string) => void;
  assets: string[];
}

export default function CommandPalette({ isOpen, onClose, onSelect, assets }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredAssets = assets.filter(a => a.toLowerCase().includes(query.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Panel */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-lg bg-bg2 border border-border shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[6px] overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center gap-3">
              <span className="font-mono text-[10px] text-terminal-gold font-bold">CMD&gt;</span>
              <input 
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Asset, Symbol or Command..."
                className="flex-1 bg-transparent border-none outline-none font-sans text-[14px] text-text-primary placeholder:text-text-muted"
              />
            </div>
            
            <div className="max-h-[300px] overflow-y-auto p-2">
              {filteredAssets.length > 0 ? (
                filteredAssets.map(asset => (
                  <button
                    key={asset}
                    onClick={() => { onSelect(asset); onClose(); }}
                    className="w-full text-left px-3 py-2.5 rounded-[4px] hover:bg-terminal-bg-hover flex justify-between items-center group transition-colors"
                  >
                    <span className="font-mono text-[12px] font-bold text-text-secondary group-hover:text-terminal-gold">{asset}</span>
                    <span className="font-mono text-[10px] text-text-muted group-hover:text-text-secondary">GO TO WORKSPACE</span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-text-muted font-mono text-[10px]">NO RESULTS MATCHING "{query.toUpperCase()}"</div>
              )}
            </div>
            
            <div className="bg-bg1 p-2 border-t border-border flex justify-between items-center font-mono text-[9px] text-text-muted px-4">
              <span>ESC TO CLOSE</span>
              <span>ENTER TO SELECT</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
