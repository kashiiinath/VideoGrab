'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { clearHistory } from '@/lib/api';
import Logo from '@/components/Logo';
import Modal from '@/components/Modal';
import {
  Sun, Moon, Monitor, Trash2, Info, Shield, CheckCircle2,
  ChevronRight, ArrowLeft, HelpCircle, Check, Music, Video, Sliders
} from 'lucide-react';
import { Theme, DefaultAudioQuality, DefaultVideoQuality } from '@/lib/types';

export default function SettingsScreen() {
  const { settings, updateSettings, setActiveTab } = useApp();
  const [historyCleared, setHistoryCleared] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAudioQualityModal, setShowAudioQualityModal] = useState(false);
  const [showVideoQualityModal, setShowVideoQualityModal] = useState(false);
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

  const audioQualityDisplay = {
    '320k': '320 kbps (High)',
    '256k': '256 kbps (M4A)',
    '192k': '192 kbps (Standard)',
    '128k': '128 kbps (Compact)',
    'lossless': 'Lossless (WAV)',
  }[settings.defaultAudioQuality || '320k'];

  const videoQualityDisplay = {
    '1080p': '1080p Full HD',
    '720p': '720p HD (Default)',
    '480p': '480p Standard',
    '360p': '360p Fast',
  }[settings.defaultVideoQuality || '720p'];

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

      {/* Main Settings List Card */}
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

        {/* 2. Audio Quality */}
        <SettingsRow
          icon={<Music size={19} className="text-[#00B8FF]" />}
          label="Default Audio Quality"
          value={audioQualityDisplay}
          onClick={() => setShowAudioQualityModal(true)}
        />

        {/* 3. Video Quality */}
        <SettingsRow
          icon={<Video size={19} className="text-[#563BFF]" />}
          label="Default Video Quality"
          value={videoQualityDisplay}
          onClick={() => setShowVideoQualityModal(true)}
        />

        {/* 4. Supported Sites */}
        <SettingsRow
          icon={<HelpCircle size={19} className="text-purple-500" />}
          label="Supported Platforms"
          value="Video & Music"
          onClick={() => setShowSitesModal(true)}
        />

        {/* 5. Clear History */}
        <SettingsRow
          icon={<Trash2 size={19} className="text-rose-500" />}
          label="Clear History"
          value={historyCleared ? 'Cleared!' : undefined}
          danger={historyCleared}
          onClick={handleClearHistory}
        />

        {/* 6. Privacy Policy */}
        <SettingsRow
          icon={<Shield size={19} className="text-indigo-500" />}
          label="Privacy Policy"
          onClick={() => setShowPrivacyModal(true)}
        />

        {/* 7. About */}
        <SettingsRow
          icon={<Info size={19} className="text-cyan-500" />}
          label="About VIDGRAB"
          value="v2.0"
          onClick={() => setShowAboutModal(true)}
        />
      </div>

      {/* Theme Selection Modal */}
      <Modal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        title="Select Theme"
      >
        <div className="space-y-2 pt-1">
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
      </Modal>

      {/* Default Audio Quality Modal */}
      <Modal
        isOpen={showAudioQualityModal}
        onClose={() => setShowAudioQualityModal(false)}
        title="Default Audio Quality"
      >
        <div className="space-y-2 pt-1">
          {[
            { id: '320k' as DefaultAudioQuality, label: '320 kbps (High Quality MP3)', tag: 'Recommended' },
            { id: '256k' as DefaultAudioQuality, label: '256 kbps (AAC / M4A Audio)', tag: 'Apple standard' },
            { id: '192k' as DefaultAudioQuality, label: '192 kbps (Standard Quality)', tag: 'Fast' },
            { id: '128k' as DefaultAudioQuality, label: '128 kbps (Compact Size)', tag: 'Small size' },
            { id: 'lossless' as DefaultAudioQuality, label: 'Lossless Studio (WAV)', tag: 'Studio HD' },
          ].map(({ id, label, tag }) => {
            const active = (settings.defaultAudioQuality || '320k') === id;
            return (
              <button
                key={id}
                onClick={() => {
                  updateSettings({ defaultAudioQuality: id });
                  setShowAudioQualityModal(false);
                }}
                className={`
                  w-full flex items-center justify-between p-3.5 rounded-2xl border text-sm font-semibold transition-all
                  ${
                    active
                      ? 'border-[#00B8FF] bg-[#00B8FF]/10 text-[#00B8FF]'
                      : 'border-[var(--vg-border)] text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/5'
                  }
                `}
              >
                <div className="text-left">
                  <p className="font-semibold">{label}</p>
                  <p className="text-[11px] text-[var(--vg-text-muted)]">{tag}</p>
                </div>
                {active && <Check size={18} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Default Video Quality Modal */}
      <Modal
        isOpen={showVideoQualityModal}
        onClose={() => setShowVideoQualityModal(false)}
        title="Default Video Quality"
      >
        <div className="space-y-2 pt-1">
          {[
            { id: '1080p' as DefaultVideoQuality, label: '1080p Full HD', tag: 'Best clarity & sharp details' },
            { id: '720p' as DefaultVideoQuality, label: '720p HD', tag: 'Fast download & great balance' },
            { id: '480p' as DefaultVideoQuality, label: '480p Standard', tag: 'Optimized for mobile screens' },
            { id: '360p' as DefaultVideoQuality, label: '360p Fast', tag: 'Smallest file size & quick saving' },
          ].map(({ id, label, tag }) => {
            const active = (settings.defaultVideoQuality || '720p') === id;
            return (
              <button
                key={id}
                onClick={() => {
                  updateSettings({ defaultVideoQuality: id });
                  setShowVideoQualityModal(false);
                }}
                className={`
                  w-full flex items-center justify-between p-3.5 rounded-2xl border text-sm font-semibold transition-all
                  ${
                    active
                      ? 'border-[#563BFF] bg-[#563BFF]/10 text-[#563BFF] dark:text-[#00B8FF]'
                      : 'border-[var(--vg-border)] text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/5'
                  }
                `}
              >
                <div className="text-left">
                  <p className="font-semibold">{label}</p>
                  <p className="text-[11px] text-[var(--vg-text-muted)]">{tag}</p>
                </div>
                {active && <Check size={18} strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      </Modal>

      {/* Supported Platforms Modal */}
      <Modal
        isOpen={showSitesModal}
        onClose={() => setShowSitesModal(false)}
        title="Supported Platforms"
      >
        <div className="space-y-4 pt-1">
          {/* Video Sources */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--vg-text-muted)] mb-2 flex items-center gap-1.5">
              <Video size={13} className="text-[#563BFF]" />
              <span>Video Platforms</span>
            </h4>
            <div className="divide-y divide-[var(--vg-border)] text-xs rounded-2xl bg-[var(--vg-bg-secondary)] border border-[var(--vg-border)] px-3">
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

          {/* Music Sources */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--vg-text-muted)] mb-2 flex items-center gap-1.5">
              <Music size={13} className="text-[#00B8FF]" />
              <span>Music Platforms</span>
            </h4>
            <div className="divide-y divide-[var(--vg-border)] text-xs rounded-2xl bg-[var(--vg-bg-secondary)] border border-[var(--vg-border)] px-3">
              {[
                { name: 'YouTube Music', desc: 'MP3 (320k), M4A (256k), and Lossless WAV direct downloads' },
                { name: 'SoundCloud', desc: 'Public music tracks and artist audio' },
                { name: 'Bandcamp', desc: 'Independent releases and albums' },
                { name: 'Spotify', desc: 'Full metadata, album art & official player (Widevine DRM protected)' },
                { name: 'Apple Music', desc: 'Full metadata, album art & official player (FairPlay DRM protected)' },
                { name: 'JioSaavn / Gaana / Wynk', desc: 'Track info, artwork & official links' },
              ].map(s => (
                <div key={s.name} className="py-2.5 flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#00B8FF] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-[var(--vg-text-primary)]">{s.name}</p>
                    <p className="text-[var(--vg-text-muted)] mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* About Modal */}
      <Modal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        title="About VIDGRAB"
      >
        <div className="space-y-4 pt-1 text-center">
          <div className="flex justify-center mb-1">
            <Logo size="lg" showText={true} showSubtitle={true} />
          </div>

          <p className="text-xs text-[var(--vg-text-secondary)] leading-relaxed">
            VIDGRAB is a premium high-speed universal video and music downloader PWA designed for mobile and desktop.
          </p>

          <div className="rounded-2xl bg-[var(--vg-bg-secondary)] border border-[var(--vg-border)] p-3 text-xs space-y-1.5 text-left font-mono text-[var(--vg-text-muted)]">
            <div className="flex justify-between">
              <span>Version</span>
              <span className="text-[var(--vg-text-primary)] font-bold">2.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Experience</span>
              <span className="text-[var(--vg-text-primary)]">Video + Music PWA</span>
            </div>
            <div className="flex justify-between">
              <span>Audio Codec</span>
              <span className="text-emerald-500 font-semibold">AAC Stereo (Universal Sound)</span>
            </div>
          </div>

          <button
            onClick={() => setShowAboutModal(false)}
            className="w-full py-3 rounded-full gradient-btn text-xs font-bold"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy & Policy"
      >
        <div className="space-y-3 pt-1 text-xs text-[var(--vg-text-secondary)]">
          <p className="leading-relaxed">
            VIDGRAB respects your privacy. Media files are streamed directly to your local device storage and are never stored permanently on our servers.
          </p>
          <p className="leading-relaxed">
            Only download public content that you have legal rights to view and store offline. VIDGRAB honors DRM protections and platform rights.
          </p>
          <button
            onClick={() => setShowPrivacyModal(false)}
            className="w-full py-2.5 rounded-full gradient-btn text-xs font-bold mt-2"
          >
            I Understand
          </button>
        </div>
      </Modal>
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
      className="w-full flex items-center justify-between p-4 hover:bg-neutral-500/5 active:bg-neutral-500/10 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        {icon}
        <span
          className={`text-sm font-semibold ${
            danger ? 'text-rose-500' : 'text-[var(--vg-text-primary)]'
          }`}
        >
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {value && (
          <span className="text-xs text-[var(--vg-text-muted)] font-medium">
            {value}
          </span>
        )}
        <ChevronRight size={17} className="text-[var(--vg-text-muted)]" />
      </div>
    </button>
  );
}
