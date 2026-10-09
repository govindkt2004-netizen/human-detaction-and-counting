import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { type NavTab, Sidebar } from './components/Sidebar';
import { About } from './pages/About';
import { Analytics } from './pages/Analytics';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { ImageDetection } from './pages/ImageDetection';
import { LiveDetection } from './pages/LiveDetection';
import { SettingsPage } from './pages/Settings';
import { VideoDetection } from './pages/VideoDetection';
import { detectorService } from './services/detectorService';
import { DEFAULT_SETTINGS, storageService } from './services/storageService';
import type { DetectorSettings } from './types/detection';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => storageService.getTheme());
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<DetectorSettings>(() => storageService.getSettings());
  const [gpuAvailable, setGpuAvailable] = useState<boolean>(detectorService.isGpuSupported());

  // Apply dark mode class to root document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    storageService.setTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleUpdateSettings = (updated: Partial<DetectorSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updated };
      storageService.saveSettings(next);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Application Header */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        activeDelegate={detectorService.getActiveDelegate()}
        gpuAvailable={gpuAvailable}
        isModelReady={true}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={(tab) => setActiveTab(tab)}
              gpuAvailable={gpuAvailable}
            />
          )}

          {activeTab === 'live' && <LiveDetection />}

          {activeTab === 'image' && <ImageDetection />}

          {activeTab === 'video' && <VideoDetection />}

          {activeTab === 'analytics' && <Analytics />}

          {activeTab === 'history' && <History />}

          {activeTab === 'settings' && (
            <SettingsPage
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              gpuAvailable={gpuAvailable}
            />
          )}

          {activeTab === 'about' && <About />}
        </main>
      </div>
    </div>
  );
}
