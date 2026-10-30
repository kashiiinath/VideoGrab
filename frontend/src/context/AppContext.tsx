'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { VideoMetadata, DownloadJob, AppSettings, Theme } from '@/lib/types';
import { getDownloads } from '@/lib/api';

interface AppContextType {
  // Settings
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Active metadata (from analyze)
  analyzedVideo: VideoMetadata | null;
  setAnalyzedVideo: (v: VideoMetadata | null) => void;

  // Download jobs
  jobs: DownloadJob[];
  refreshJobs: () => void;
  updateJobLocal: (id: string, updates: Partial<DownloadJob>) => void;

  // Tab navigation
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;

  // Backend status
  backendOnline: boolean;
}

export type TabName = 'home' | 'downloads' | 'history' | 'settings';

const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [analyzedVideo, setAnalyzedVideo] = useState<VideoMetadata | null>(null);
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [backendOnline, setBackendOnline] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vidgrab_settings');
      if (saved) setSettings(JSON.parse(saved));
    } catch {}
  }, []);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    const { theme } = settings;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // system
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [settings.theme]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('vidgrab_settings', JSON.stringify(next));
      return next;
    });
  }, []);

  const refreshJobs = useCallback(async () => {
    try {
      const data = await getDownloads();
      setJobs(data);
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  }, []);

  const updateJobLocal = useCallback((id: string, updates: Partial<DownloadJob>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
  }, []);

  // Poll jobs every 3 seconds
  useEffect(() => {
    refreshJobs();
    const interval = setInterval(refreshJobs, 5000);
    return () => clearInterval(interval);
  }, [refreshJobs]);

  return (
    <AppContext.Provider value={{
      settings,
      updateSettings,
      analyzedVideo,
      setAnalyzedVideo,
      jobs,
      refreshJobs,
      updateJobLocal,
      activeTab,
      setActiveTab,
      backendOnline,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
