'use client';

import React from 'react';
import { Home, Download, History, Settings } from 'lucide-react';
import { useApp, TabName } from '@/context/AppContext';

const tabs: { id: TabName; label: string; icon: React.FC<{ size?: number; strokeWidth?: number; className?: string }> }[] = [
  { id: 'home',      label: 'Home',      icon: Home },
  { id: 'downloads', label: 'Downloads', icon: Download },
  { id: 'history',   label: 'History',   icon: History },
  { id: 'settings',  label: 'Settings',  icon: Settings },
];

export default function BottomNav() {
  const { activeTab, setActiveTab, jobs } = useApp();
  const activeCount = jobs.filter(j => ['processing', 'ready'].includes(j.status)).length;

  return (
    <nav
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md"
    >
      <div
        className="rounded-3xl border px-3 py-2 flex items-center justify-around transition-all bg-white/50 dark:bg-white/[0.04] backdrop-blur-2xl border-black/[0.06] dark:border-white/[0.08] shadow-sm dark:shadow-[0_2px_10px_rgba(0,0,0,0.15)]"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          const showBadge = id === 'downloads' && activeCount > 0;

          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                relative flex flex-col items-center justify-center py-1.5 px-4 rounded-2xl
                transition-all duration-200 select-none
                ${active
                  ? 'bg-gradient-to-r from-[#00B8FF]/15 via-[#563BFF]/20 to-[#DB20E8]/15 text-[#563BFF] dark:text-[#00B8FF]'
                  : 'text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)]'}
              `}
              aria-label={label}
            >
              {/* Active glow backing */}
              {active && (
                <div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#00B8FF]/20 via-[#563BFF]/25 to-[#DB20E8]/20 blur-sm -z-10"
                />
              )}

              {/* Icon with badge */}
              <div className="relative">
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 2}
                  className={active ? 'text-[#00B8FF] dark:text-[#00B8FF]' : 'text-current'}
                />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-gradient-to-r from-[#563BFF] to-[#DB20E8] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none shadow-sm">
                    {activeCount > 9 ? '9+' : activeCount}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[11px] font-semibold mt-1 tracking-tight leading-none ${
                  active
                    ? 'gradient-text font-bold'
                    : 'text-current font-medium'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
