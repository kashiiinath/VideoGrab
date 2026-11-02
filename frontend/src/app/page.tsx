'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import BottomNav from '@/components/BottomNav';
import HomeScreen from '@/screens/HomeScreen';
import MusicScreen from '@/screens/MusicScreen';
import DownloadsScreen from '@/screens/DownloadsScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import SplashScreen from '@/components/SplashScreen';
import GetStartedScreen from '@/components/GetStartedScreen';

type AppPhase = 'loading' | 'splash' | 'getstarted' | 'app';

function AppShell() {
  const { activeTab } = useApp();
  const [phase, setPhase] = useState<AppPhase>('loading');

  useEffect(() => {
    setPhase('splash');
  }, []);

  const handleSplashComplete = useCallback(() => {
    try {
      const isStandalone =
        typeof window !== 'undefined' &&
        (window.matchMedia('(display-mode: standalone)').matches ||
          window.matchMedia('(display-mode: fullscreen)').matches ||
          (window.navigator as any).standalone === true ||
          document.referrer.includes('android-app://'));

      const started =
        localStorage.getItem('vidgrab_started') === 'true' ||
        sessionStorage.getItem('vidgrab_started') === 'true';

      const installed = localStorage.getItem('vidgrab_installed') === 'true';

      // If user is opening the installed app or has already started, go straight to app
      if (isStandalone || installed || started) {
        setPhase('app');
      } else {
        setPhase('getstarted');
      }
    } catch {
      setPhase('getstarted');
    }
  }, []);

  function handleStart() {
    try {
      localStorage.setItem('vidgrab_started', 'true');
      sessionStorage.setItem('vidgrab_started', 'true');
    } catch {}
    setPhase('app');
  }

  // Phase 1: Loading (checking sessionStorage)
  if (phase === 'loading') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--vg-bg)' }}
      >
        <div className="w-10 h-10 rounded-full border-2 border-[#563BFF] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Phase 2: Splash Screen (logo animation)
  if (phase === 'splash') {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Phase 3: Get Started Screen (first time users)
  if (phase === 'getstarted') {
    return <GetStartedScreen onStart={handleStart} />;
  }

  // Phase 4: Main App
  return (
    <div
      className="min-h-screen flex flex-col justify-between transition-colors duration-200"
      style={{ backgroundColor: 'var(--vg-bg)' }}
    >
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-15%] w-[450px] h-[450px] rounded-full bg-[#00B8FF]/10 dark:bg-[#00B8FF]/8 blur-[100px]" />
        <div className="absolute top-[30%] right-[-15%] w-[450px] h-[450px] rounded-full bg-[#DB20E8]/10 dark:bg-[#DB20E8]/8 blur-[110px]" />
        <div className="absolute bottom-[5%] left-[20%] w-[350px] h-[350px] rounded-full bg-[#563BFF]/10 dark:bg-[#563BFF]/8 blur-[100px]" />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col relative px-4 pt-3 pb-28">
        <main className="flex-1">
          {activeTab === 'home'      && <HomeScreen />}
          {activeTab === 'music'     && <MusicScreen />}
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
