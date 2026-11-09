'use client';

import React from 'react';
import { Film, Music, Settings } from 'lucide-react';
import { useApp, TabName } from '@/context/AppContext';

const tabs: { id: TabName; label: string; icon: React.FC<{ size?: number; strokeWidth?: number; className?: string }> }[] = [
  { id: 'home',  label: 'Video', icon: Film },
  { id: 'music', label: 'Audio', icon: Music },
];

export default function BottomNav() {
  const { activeTab, setActiveTab } = useApp();

  const isSettingsActive = activeTab === 'settings';

  return (
    <nav
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-sm"
    >
      <div className="flex items-center gap-2">
        {/* Main pill: Video & Audio tabs */}
        <div
          className="flex-1 rounded-3xl border p-1.5 flex items-center justify-between gap-1.5 transition-all bg-white/70 dark:bg-[#121526]/85 backdrop-blur-2xl border-black/[0.08] dark:border-white/[0.1] shadow-xl dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        >
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;

            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`
                  relative flex-1 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-2xl
                  transition-all duration-300 select-none
                  ${active
                    ? 'bg-gradient-to-r from-[#00B8FF]/20 via-[#563BFF]/25 to-[#DB20E8]/20 text-[#563BFF] dark:text-[#00B8FF] font-bold shadow-sm'
                    : 'text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] font-semibold hover:bg-black/5 dark:hover:bg-white/5'}
                `}
                aria-label={label}
              >
                {/* Active glow backing */}
                {active && (
                  <div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#00B8FF]/20 via-[#563BFF]/25 to-[#DB20E8]/20 blur-sm -z-10"
                  />
                )}

                {/* Icon */}
                <Icon
                  size={19}
                  strokeWidth={active ? 2.5 : 2}
                  className={active ? 'text-[#00B8FF]' : 'text-current'}
                />

                {/* Label */}
                <span
                  className={`text-xs tracking-tight ${
                    active
                      ? 'gradient-text font-extrabold'
                      : 'text-current font-semibold'
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Separate circular Settings button */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`
            w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
            transition-all duration-300 select-none
            border backdrop-blur-2xl shadow-xl
            ${isSettingsActive
              ? 'bg-gradient-to-br from-[#00B8FF]/25 via-[#563BFF]/30 to-[#DB20E8]/25 border-[#563BFF]/40 dark:border-[#00B8FF]/40 shadow-[0_0_12px_rgba(86,59,255,0.25)]'
              : 'bg-white/70 dark:bg-[#121526]/85 border-black/[0.08] dark:border-white/[0.1] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-black/5 dark:hover:bg-white/5'}
          `}
          aria-label="Settings"
          title="Settings"
        >
          <Settings
            size={19}
            strokeWidth={isSettingsActive ? 2.5 : 2}
            className={`transition-all duration-300 ${
              isSettingsActive
                ? 'text-[#00B8FF] rotate-90'
                : 'text-[var(--vg-text-muted)]'
            }`}
          />
        </button>
      </div>
    </nav>
  );
}
