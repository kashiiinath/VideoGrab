'use client';

import { AppProvider, useApp } from '@/context/AppContext';
import BottomNav from '@/components/BottomNav';
import HomeScreen from '@/screens/HomeScreen';
import DownloadsScreen from '@/screens/DownloadsScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import SettingsScreen from '@/screens/SettingsScreen';

function AppShell() {
  const { activeTab } = useApp();

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto relative">
      {/* Status bar spacer for mobile */}
      <div className="h-safe-top" />

      {/* Main scrollable content area */}
      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        <div className="px-4 py-3">
          {activeTab === 'home'      && <HomeScreen />}
          {activeTab === 'downloads' && <DownloadsScreen />}
          {activeTab === 'history'   && <HistoryScreen />}
          {activeTab === 'settings'  && <SettingsScreen />}
        </div>
      </main>

      {/* Bottom navigation */}
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
