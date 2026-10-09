import React from 'react';
import {
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import type { DelegateType } from '../types/detection';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  activeDelegate: DelegateType;
  gpuAvailable: boolean;
  isModelReady: boolean;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  activeDelegate,
  gpuAvailable,
  isModelReady,
  mobileMenuOpen,
  onToggleMobileMenu,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-1.5 text-slate-600 dark:text-slate-300 md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
          aria-label="Toggle Navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm font-black text-sm">
            HD
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
              Human Detection & Counting
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Real-Time Computer Vision Analytics
            </p>
          </div>
        </div>
      </div>

      {/* System Status Indicators & Theme */}
      <div className="flex items-center gap-3">
        {/* Local Processing privacy status */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800/60">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Local In-Browser Inference</span>
        </div>

        {/* Acceleration badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
          <Zap className="w-3 h-3 text-sky-500" />
          <span>{activeDelegate}</span>
          <span className="text-slate-400">·</span>
          <span>{isModelReady ? 'Ready' : 'Standby'}</span>
        </div>

        {/* Dark / Light Mode Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
};
