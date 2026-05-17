"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BarChart3, 
  Zap, 
  Settings, 
  Globe,
  Wallet,
  Target,
  Sun,
  Moon,
  Command,
  Shield,
  Link2,
  Radio,
} from "lucide-react";
import { useApex, ActiveTab } from "@/context/ApexContext";

const menuItems: { icon: React.ElementType; label: string; id: ActiveTab; badge?: string }[] = [
  { icon: LayoutDashboard, label: "Intelligence", id: "dashboard" },
  { icon: Globe,          label: "World Monitor",  id: "world",    badge: "LIVE" },
  { icon: Target,         label: "Opportunities",  id: "opps" },
  { icon: Shield,         label: "Risk Fortress",  id: "risk" },
  { icon: Link2,          label: "Verif. Ledger",  id: "ledger" },
  { icon: Radio,          label: "MT5 Execution",  id: "execution", badge: "MT5" },
  { icon: Zap,            label: "SMC Engine",     id: "smc",     badge: "V8" },
  { icon: BarChart3,      label: "Analytics",      id: "analytics" },
  { icon: Wallet,         label: "Portfolio",      id: "dashboard" },
];

export function Sidebar() {
  const { activeTab, setActiveTab } = useApex();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
  }, [theme]);

  const visClass = (v: boolean) => cn(
    "transition-all duration-500 ease-in-out whitespace-nowrap overflow-hidden",
    v ? "opacity-100 translate-x-0 max-w-[200px]" : "opacity-0 -translate-x-4 max-w-0"
  );

  return (
    <aside 
      className={cn(
        "h-full bg-background/30 backdrop-blur-3xl border-r border-border flex flex-col items-start py-10 relative z-50 flex-shrink-0 transition-all duration-500 ease-[0.23,1,0.32,1]",
        collapsed ? "w-20" : "w-[260px]"
      )}
    >
      {/* Brand Icon - ELITE TOGGLE */}
      <div 
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-5 px-6 mb-12 w-full cursor-pointer group select-none overflow-hidden"
      >
        <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center shadow-glow-primary flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
          <Command className="text-white w-6 h-6" />
        </div>
        <div className={visClass(!collapsed)}>
          <div className="flex flex-col ml-4">
             <span className="text-sm font-black text-foreground tracking-[0.2em] leading-none uppercase">APEX AI</span>
             <span className="text-[8px] font-bold text-primary tracking-[0.4em] mt-1.5 uppercase opacity-80">Institutional v2</span>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-0.5 w-full px-3 flex-1">
        {menuItems.map((item) => (
          <button
            key={item.id + item.label}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "relative w-full h-11 flex items-center px-3 rounded-xl transition-all duration-300 group overflow-hidden",
              activeTab === item.id 
                ? "text-primary bg-primary/8 shadow-[inset_0_0_15px_rgba(232,123,69,0.05)]" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            <item.icon className={cn(
               "w-[18px] h-[18px] flex-shrink-0 relative z-10 transition-transform duration-500 group-hover:scale-110",
               activeTab === item.id ? "drop-shadow-glow-primary" : "opacity-60 group-hover:opacity-100"
            )} />
            
            <div className={visClass(!collapsed)}>
               <span className={cn(
                  "ml-3 text-[10px] font-bold uppercase tracking-[0.12em] relative z-10 transition-all duration-500",
                  activeTab === item.id ? "translate-x-1" : "group-hover:translate-x-1"
               )}>
                  {item.label}
               </span>
            </div>

            {/* Badge */}
            {item.badge && !collapsed && (
              <div className={cn(
                "ml-auto mr-1 text-[7px] font-black px-1.5 py-0.5 rounded-full tracking-wider",
                item.badge === "LIVE" ? "bg-bull/20 text-bull" : "bg-primary/20 text-primary"
              )}>
                {item.badge}
              </div>
            )}

            {activeTab === item.id && (
               <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-full shadow-glow-primary z-20" />
            )}
          </button>
        ))}
      </nav>

      {/* Utilities */}
      <div className="mt-auto w-full px-3 space-y-1">
         {/* Status indicator */}
         {!collapsed && (
           <div className="mx-1 mb-3 px-3 py-2 rounded-xl bg-bull/5 border border-bull/20 flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-bull animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-widest text-bull">System Active</span>
           </div>
         )}

         {/* Theme Toggle */}
         <div 
           onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
           className="w-full h-11 flex items-center px-3 rounded-xl bg-muted/20 border border-border/50 cursor-pointer hover:bg-muted/40 transition-all group overflow-hidden"
         >
            <div className="relative w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
               <Sun className={cn(
                  "w-[18px] h-[18px] absolute transition-all duration-500",
                  theme === "dark" ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 -rotate-90"
               )} />
               <Moon className={cn(
                  "w-[18px] h-[18px] absolute transition-all duration-500",
                  theme === "light" ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 rotate-90"
               )} />
            </div>
            <div className={visClass(!collapsed)}>
              <span className="ml-3 text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">
                {theme === "dark" ? "Luminous" : "Nocturnal"}
              </span>
            </div>
         </div>

         <button className="w-full h-11 flex items-center px-3 rounded-xl text-muted-foreground hover:text-foreground transition-all hover:bg-muted/30 group">
            <Settings className="w-[18px] h-[18px] flex-shrink-0 group-hover:rotate-45 transition-transform duration-500" />
            <div className={visClass(!collapsed)}>
              <span className="ml-3 text-[10px] font-bold uppercase tracking-widest">Settings</span>
            </div>
         </button>
      </div>
    </aside>
  );
}
