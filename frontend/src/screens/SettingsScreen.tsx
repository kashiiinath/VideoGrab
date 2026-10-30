'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { clearHistory } from '@/lib/api';
import Logo from '@/components/Logo';
import {
  Sun, Moon, Monitor, Trash2, Info, Shield, CheckCircle2,
  ChevronRight, AlertCircle,
} from 'lucide-react';
import { Theme } from '@/lib/types';

export default function SettingsScreen() {
  const { settings, updateSettings, backendOnline } = useApp();
  const [historyCleared, setHistoryCleared] = useState(false);
  const [clearError, setClearError] = useState('');

  async function handleClearHistory() {
    if (!confirm('This will delete all download history. Continue?')) return;
    try {
      await clearHistory();
      setHistoryCleared(true);
      setTimeout(() => setHistoryCleared(false), 3000);
      setClearError('');
    } catch {
      setClearError('Failed to clear history');
    }
  }

  const themes: { id: Theme; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'light',  label: 'Light',  icon: Sun },
    { id: 'dark',   label: 'Dark',   icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">Customize your VidGrab experience</p>
      </div>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="p-4 space-y-3">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Theme</p>
          <div className="flex gap-2">
            {themes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => updateSettings({ theme: id })}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl border text-xs font-medium transition-all ${
                  settings.theme === id
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-violet-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Data & Privacy */}
      <Section title="Data & Privacy">
        <SettingRow
          icon={<Trash2 className="w-4 h-4 text-red-500" />}
          label="Clear Download History"
          description="Remove all history entries from this device"
          onClick={handleClearHistory}
          danger
          trailingContent={
            historyCleared ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            )
          }
        />
        {clearError && (
          <div className="mx-4 mb-3 flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="w-3.5 h-3.5" />
            {clearError}
          </div>
        )}
      </Section>

      {/* About */}
      <Section title="About">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" showText={true} />
          </div>
          <div className="space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
            <InfoRow label="Version" value="1.0.0" />
            <InfoRow label="Backend" value={backendOnline ? '🟢 Running' : '🔴 Offline'} />
            <InfoRow label="Backend URL" value={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'} mono />
          </div>
        </div>
      </Section>

      {/* Supported Sources */}
      <Section title="Supported Sources">
        <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
          {[
            { name: 'YouTube', desc: 'Videos, Shorts, and Audio (MP4/M4A)' },
            { name: 'Instagram', desc: 'Reels and public video posts' },
            { name: 'Twitter / X', desc: 'Videos and GIFs from tweets' },
            { name: 'TikTok', desc: 'HD video downloads without watermark' },
            { name: 'Facebook', desc: 'Public videos and reels' },
            { name: 'Direct Video Files', desc: 'MP4, WebM, MOV, AVI, MKV URLs' },
            { name: 'HLS Streams', desc: '.m3u8 playlists and adaptive streams' },
            { name: 'Vimeo (Public)', desc: 'Public videos without DRM protection' },
          ].map(src => (
            <div key={src.name} className="flex items-start gap-3 px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-neutral-800 dark:text-white">{src.name}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{src.desc}</p>
              </div>
            </div>
          ))}
          {[
            { name: 'Netflix / Disney+ / Hulu', reason: 'DRM-protected content (Widevine)' },
            { name: 'Amazon Prime Video', reason: 'DRM-protected content' },
          ].map(src => (
            <div key={src.name} className="flex items-start gap-3 px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{src.name}</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{src.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Legal */}
      <Section title="Legal & Privacy">
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              VidGrab only downloads content you have the right to download. It does not bypass DRM, paywalls, or authentication. All processing runs locally on your device.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              No data is sent to external servers. Your download history is stored only in this browser&apos;s local storage.
            </p>
          </div>
        </div>
      </Section>

      <div className="pb-4" />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 overflow-hidden">
      <div className="px-4 pt-3.5 pb-1">
        <h2 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SettingRow({
  icon, label, description, onClick, danger, trailingContent,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  danger?: boolean;
  trailingContent?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        danger ? 'hover:bg-red-50 dark:hover:bg-red-900/10' : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
      }`}
    >
      <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${danger ? 'text-red-600 dark:text-red-400' : 'text-neutral-800 dark:text-white'}`}>{label}</p>
        {description && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
      </div>
      {trailingContent}
    </button>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span>{label}</span>
      <span className={`text-neutral-700 dark:text-neutral-300 font-medium ${mono ? 'font-mono text-[10px]' : ''}`}>{value}</span>
    </div>
  );
}
