'use client';

import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import BottomNav from '@/components/BottomNav';
import HomeScreen from '@/screens/HomeScreen';
import DownloadsScreen from '@/screens/DownloadsScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import GetStartedScreen from '@/components/GetStartedScreen';

function AppShell() {
  const { activeTab } = useApp();
  const [hasStarted, setHasStarted] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const started = sessionStorage.getItem('vidgrab_started');
      setHasStarted(started === 'true');
    } catch {
      setHasStarted(false);
    }
  }, []);

  function handleStart() {
    try {
      sessionStorage.setItem('vidgrab_started', 'true');
    } catch {}
    setHasStarted(true);
  }

  // Prevent flash while checking sessionStorage
  if (hasStarted === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--vg-bg)' }}
      >
        <div className="w-10 h-10 rounded-full border-2 border-[#563BFF] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!hasStarted) {
    return <GetStartedScreen onStart={handleStart} />;
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-between transition-colors duration-200"
      style={{ backgroundColor: 'var(--vg-bg)' }}
    >
      {/* Background Ambient Glow (matches Design 2 subtle background flares) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-15%] w-[450px] h-[450px] rounded-full bg-[#00B8FF]/10 dark:bg-[#00B8FF]/8 blur-[100px]" />
        <div className="absolute top-[30%] right-[-15%] w-[450px] h-[450px] rounded-full bg-[#DB20E8]/10 dark:bg-[#DB20E8]/8 blur-[110px]" />
        <div className="absolute bottom-[5%] left-[20%] w-[350px] h-[350px] rounded-full bg-[#563BFF]/10 dark:bg-[#563BFF]/8 blur-[100px]" />
      </div>

      {/* Main Container - App-like Frame */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col relative px-4 pt-3 pb-28">
        <main className="flex-1">
          {activeTab === 'home'      && <HomeScreen />}
          {activeTab === 'downloads' && <DownloadsScreen />}
          {activeTab === 'history'   && <HistoryScreen />}
          {activeTab === 'settings'  && <SettingsScreen />}
        </main>
      </div>

      {/* Floating Dock Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default function Page() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
