import React, { ReactNode } from 'react';

interface TerminalShellProps {
  topbar: ReactNode;
  leftNav: ReactNode;
  rightPanel: ReactNode;
  bottomStatus: ReactNode;
  children: ReactNode;
}

export default function TerminalShell({
  topbar,
  leftNav,
  rightPanel,
  bottomStatus,
  children
}: TerminalShellProps) {
  return (
    <div className="grid h-screen w-full grid-rows-[32px_1fr_22px] bg-background text-foreground overflow-hidden">
      {/* Topbar spans all columns */}
      <div className="col-span-1 row-start-1" style={{ gridColumn: '1 / -1' }}>
        {topbar}
      </div>

      {/* Main Body Grid */}
      <div className="grid grid-cols-[200px_1fr_240px] h-full overflow-hidden">
        {/* Left Nav */}
        <div className="border-r border-border bg-terminal-bg-panel h-full overflow-hidden">
          {leftNav}
        </div>

        {/* Center Content (Main) */}
        <div className="h-full overflow-hidden relative">
          {children}
        </div>

        {/* Right Panel */}
        <div className="border-l border-border bg-terminal-bg-panel h-full overflow-y-auto overflow-x-hidden">
          {rightPanel}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="col-span-1 row-start-3" style={{ gridColumn: '1 / -1' }}>
        {bottomStatus}
      </div>
    </div>
  );
}
