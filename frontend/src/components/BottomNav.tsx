'use client';

import React from 'react';
import { Home, Download, History, Settings } from 'lucide-react';
import { useApp, TabName } from '@/context/AppContext';

const tabs: { id: TabName; label: string; icon: React.FC<{ size?: number; strokeWidth?: number }> }[] = [
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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800"
      style={{ maxWidth: '28rem', margin: '0 auto', left: '50%', transform: 'translateX(-50%)', width: '100%' }}
    >
      <div className="flex items-stretch safe-area-pb">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          const showBadge = id === 'downloads' && activeCount > 0;

          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                flex-1 flex flex-col items-center justify-center pt-2 pb-1 gap-0.5 relative
                transition-colors duration-150 min-h-[56px]
                ${active
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-neutral-400 dark:text-neutral-500'}
              `}
              aria-label={label}
            >
              {/* Active indicator dot at top */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-violet-600 dark:bg-violet-400 rounded-full" />
              )}

              {/* Icon with badge */}
              <span className="relative">
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2 bg-violet-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {activeCount > 9 ? '9+' : activeCount}
                  </span>
                )}
              </span>

              {/* Label */}
              <span className={`text-[10px] font-medium leading-none ${active ? 'text-violet-600 dark:text-violet-400' : 'text-neutral-400 dark:text-neutral-500'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
