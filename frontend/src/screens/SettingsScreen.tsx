'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { clearHistory } from '@/lib/api';
import Logo from '@/components/Logo';
import {
  Sun, Moon, Monitor, Trash2, Info, Shield, CheckCircle2,
  ChevronRight, ArrowLeft, HelpCircle, Check, X
} from 'lucide-react';
import { Theme } from '@/lib/types';

export default function SettingsScreen() {
  const { settings, updateSettings, backendOnline, setActiveTab } = useApp();
  const [historyCleared, setHistoryCleared] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showSitesModal, setShowSitesModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  async function handleClearHistory() {
    if (!confirm('This will delete all download history. Continue?')) return;
    try {
      await clearHistory();
      setHistoryCleared(true);
      setTimeout(() => setHistoryCleared(false), 2500);
    } catch {}
  }

  const themeDisplay = {
    system: 'System',
    dark: 'Dark Mode',
    light: 'Light Mode',
  }[settings.theme] || 'System';

  return (
    <div className="space-y-4">
      {/* Header with Back Button */}
      <div className="flex items-center gap-2 pt-1 pb-1">
        <button
          onClick={() => setActiveTab('home')}
          className="p-2 -ml-2 rounded-full text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/10 transition-colors"
          aria-label="Back to Home"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-[var(--vg-text-primary)]">Settings</h1>
      </div>

      {/* Main Settings List Card matching Design 2 */}
      <div
        className="rounded-3xl border divide-y overflow-hidden shadow-sm transition-all"
        style={{
          backgroundColor: 'var(--vg-card)',
          borderColor: 'var(--vg-border)',
        }}
      >
        {/* 1. Theme */}
        <SettingsRow
          icon={<Sun size={19} className="text-amber-500" />}
          label="Theme"
          value={themeDisplay}
          onClick={() => setShowThemeModal(true)}
        />

        {/* 2. Supported Sites */}
        <SettingsRow
          icon={<HelpCircle size={19} className="text-purple-500" />}
          label="Supported Sites"
          onClick={() => setShowSitesModal(true)}
        />

        {/* 3. Clear History */}
        <SettingsRow
          icon={<Trash2 size={19} className="text-rose-500" />}
          label="Clear History"
          value={historyCleared ? 'Cleared!' : undefined}
          danger={historyCleared}
          onClick={handleClearHistory}
        />

        {/* 4. Privacy Policy */}
        <SettingsRow
          icon={<Shield size={19} className="text-indigo-500" />}
          label="Privacy Policy"
          onClick={() => setShowPrivacyModal(true)}
        />

        {/* 5. About */}
        <SettingsRow
          icon={<Info size={19} className="text-cyan-500" />}
          label="About"
          value="v1.0.0"
          onClick={() => setShowAboutModal(true)}
        />
      </div>

      {/* Backend Engine Status Pill */}
      <div
        className="rounded-2xl border p-3 flex items-center justify-between text-xs"
        style={{
          backgroundColor: 'var(--vg-card)',
          borderColor: 'var(--vg-border)',
        }}
      >
        <span className="font-semibold text-[var(--vg-text-secondary)]">Backend Engine</span>
        <div className="flex items-center gap-1.5 font-bold">
          <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className={backendOnline ? 'text-emerald-500' : 'text-rose-500'}>
            {backendOnline ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Theme Selection Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div
            className="w-full max-w-sm rounded-3xl border p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            style={{
              backgroundColor: 'var(--vg-card)',
              borderColor: 'var(--vg-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[16px] text-[var(--vg-text-primary)]">Select Theme</h3>
              <button
                onClick={() => setShowThemeModal(false)}
                className="p-1 rounded-full text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {[
                { id: 'dark' as Theme, label: 'Dark Mode (Recommended)', icon: Moon },
                { id: 'light' as Theme, label: 'Light Mode', icon: Sun },
                { id: 'system' as Theme, label: 'System Default', icon: Monitor },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    updateSettings({ theme: id });
                    setShowThemeModal(false);
                  }}
                  className={`
                    w-full flex items-center justify-between p-3.5 rounded-2xl border text-sm font-semibold transition-all
                    ${
                      settings.theme === id
                        ? 'border-[#563BFF] bg-[#563BFF]/10 text-[#563BFF] dark:text-[#00B8FF]'
                        : 'border-[var(--vg-border)] text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/5'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span>{label}</span>
                  </div>
                  {settings.theme === id && <Check size={18} strokeWidth={2.5} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Supported Sites Modal */}
      {showSitesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div
            className="w-full max-w-sm rounded-3xl border p-5 space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto scrollbar-hide"
            style={{
              backgroundColor: 'var(--vg-card)',
              borderColor: 'var(--vg-border)',
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[16px] text-[var(--vg-text-primary)]">Supported Sources</h3>
              <button
                onClick={() => setShowSitesModal(false)}
                className="p-1 rounded-full text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="divide-y divide-[var(--vg-border)] text-xs">
              {[
                { name: 'YouTube', desc: 'Videos, Shorts, and Audio (MP4 / M4A)' },
                { name: 'Instagram', desc: 'Reels and public video clips' },
                { name: 'Twitter / X', desc: 'Videos and GIFs posted in tweets' },
                { name: 'Facebook', desc: 'Public videos and reels' },
                { name: 'Vimeo', desc: 'Public Vimeo HD videos' },
                { name: 'HLS Streams', desc: 'Adaptive .m3u8 playlists' },
                { name: 'Direct MP4 / WebM', desc: 'Direct downloadable video file URLs' },
              ].map(s => (
                <div key={s.name} className="py-2.5 flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-[var(--vg-text-primary)]">{s.name}</p>
                    <p className="text-[var(--vg-text-muted)] mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div
            className="w-full max-w-sm rounded-3xl border p-6 space-y-4 shadow-2xl text-center"
            style={{
              backgroundColor: 'var(--vg-card)',
              borderColor: 'var(--vg-border)',
            }}
          >
            <div className="flex justify-center mb-1">
              <Logo size="lg" showText={true} showSubtitle={true} />
            </div>

            <p className="text-xs text-[var(--vg-text-secondary)] leading-relaxed">
              VIDGRAB is a premium high-speed universal media downloader PWA designed for mobile and desktop.
            </p>

            <div className="rounded-2xl bg-[var(--vg-bg-secondary)] border border-[var(--vg-border)] p-3 text-xs space-y-1 text-left font-mono text-[var(--vg-text-muted)]">
              <div className="flex justify-between">
                <span>Version</span>
                <span className="text-[var(--vg-text-primary)]">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Design Spec</span>
                <span className="text-[var(--vg-text-primary)]">Design 2</span>
              </div>
            </div>

            <button
              onClick={() => setShowAboutModal(false)}
              className="w-full py-3 rounded-full gradient-btn text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div
            className="w-full max-w-sm rounded-3xl border p-5 space-y-3 shadow-2xl text-xs text-[var(--vg-text-secondary)]"
            style={{
              backgroundColor: 'var(--vg-card)',
              borderColor: 'var(--vg-border)',
            }}
          >
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-bold text-[15px] text-[var(--vg-text-primary)]">Privacy & Policy</h3>
              <button onClick={() => setShowPrivacyModal(false)} className="text-[var(--vg-text-muted)]">
                <X size={18} />
              </button>
            </div>
            <p className="leading-relaxed">
              VIDGRAB respects your privacy. Videos are delivered directly to your device storage and never stored permanently on our servers.
            </p>
            <p className="leading-relaxed">
              Only download public content that you have rights to view and store offline.
            </p>
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-2.5 rounded-full gradient-btn text-xs font-bold mt-2"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsRow({
  icon, label, value, onClick, danger,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-neutral-500/5 active:bg-neutral-500/10 transition-colors"
      style={{ borderColor: 'var(--vg-border)' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-7 h-7 flex-shrink-0">
          {icon}
        </div>
        <span className={`text-[14px] font-bold ${danger ? 'text-emerald-500' : 'text-[var(--vg-text-primary)]'}`}>
          {label}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-[var(--vg-text-muted)] font-semibold">
        {value && <span className={danger ? 'text-emerald-500' : ''}>{value}</span>}
        <ChevronRight size={17} className="text-[var(--vg-text-muted)]" />
      </div>
    </button>
  );
}
