'use client';

import React, { useState } from 'react';
import { analyzeMusicUrl, analyzeMusicPlaylist, getApiError } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import Logo from '@/components/Logo';
import UrlInput from '@/components/UrlInput';
import AudioCard from '@/components/AudioCard';
import Modal from '@/components/Modal';
import {
  Music, CheckCircle2, Clock, Play, AlertCircle, WifiOff, Download, Settings, ChevronRight
} from 'lucide-react';

export default function MusicScreen() {
  const {
    analyzedMusic,
    setAnalyzedMusic,
    backendOnline,
    jobs,
    setActiveTab
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [showMoreModal, setShowMoreModal] = useState(false);

  const activeCount = jobs.filter(j => ['processing', 'ready'].includes(j.status)).length;

  async function handleAnalyze(url: string) {
    setLoading(true);
    setError('');
    setAnalyzedMusic(null);
    try {
      const isPlaylistLikely =
        url.includes('list=') ||
        url.includes('/playlist') ||
        url.includes('/album') ||
        url.includes('/sets/');

      if (isPlaylistLikely) {
        try {
          const plMeta = await analyzeMusicPlaylist(url);
          if (plMeta && (plMeta.tracks?.length || plMeta.title)) {
            setAnalyzedMusic(plMeta);
            return;
          }
        } catch {
          // If dedicated playlist endpoint fails, continue to universal analyze
        }
      }

      const metadata = await analyzeMusicUrl(url);
      setAnalyzedMusic(metadata);
    } catch (err: any) {
      const msg = err?.response?.data?.error || getApiError(err);
      setError(msg || 'Failed to analyze audio URL');
    } finally {
      setLoading(false);
    }
  }

  // Filter for recent audio downloads
  const recentAudioJobs = jobs
    .filter(j => j.mediaType === 'music' || ['mp3', 'm4a', 'wav', 'flac', 'aac'].includes(j.format?.toLowerCase() || ''))
    .slice(0, 3);

  // 4 Primary Music Platforms shown on the main page
  const primaryPlatforms = [
    {
      id: 'ytmusic',
      name: 'YT Music',
      bg: 'bg-red-600',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm-2-7v5l4.5-2.5L10 9.5z"/>
        </svg>
      ),
    },
    {
      id: 'spotify',
      name: 'Spotify',
      bg: 'bg-[#1DB954]',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.497 17.306c-.217.355-.68.468-1.035.251-2.836-1.733-6.406-2.124-10.609-1.164-.407.094-.813-.162-.907-.568-.094-.406.162-.813.568-.907 4.607-1.053 8.563-.604 11.732 1.346.356.217.468.68.251 1.042zm1.467-3.262c-.273.444-.855.586-1.298.313-3.245-1.995-8.192-2.572-12.03-1.407-.5.152-1.032-.132-1.184-.633-.153-.5.132-1.033.633-1.185 4.383-1.33 9.832-.686 13.567 1.609.443.273.585.855.312 1.303zm.126-3.395C15.206 8.358 8.804 8.146 5.126 9.262c-.6.182-1.24-.162-1.422-.762-.182-.6.162-1.24.762-1.422 4.227-1.283 11.296-1.038 15.762 1.613.539.32.715 1.022.395 1.562-.32.539-1.022.715-1.533.411z"/>
        </svg>
      ),
    },
    {
      id: 'apple',
      name: 'Apple Music',
      bg: 'bg-gradient-to-tr from-[#FA243C] to-[#FA586A]',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.96.04-2.12.64-2.8 1.44-.59.69-.97 1.77-.9 2.84 1.07.08 2.15-.55 2.69-1.41z"/>
        </svg>
      ),
    },
    {
      id: 'gaana',
      name: 'Gaana',
      bg: 'bg-[#E72C30]',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      ),
    },
  ];

  // Secondary Music Platforms available under "More"
  const morePlatforms = [
    {
      id: 'soundcloud',
      name: 'SoundCloud',
      category: 'Direct Download Supported',
      canDownload: true,
      bg: 'bg-[#FF5500]',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M1.175 12.225c-.055 0-.1.047-.105.105L1 15.65c.005.058.05.105.105.105.056 0 .102-.047.108-.105l.072-3.32c-.006-.058-.052-.105-.11-.105zm1.517-.79c-.066 0-.12.054-.125.12l-.125 4.89c.005.066.06.12.125.12.067 0 .12-.054.126-.12l.126-4.89c-.006-.066-.06-.12-.127-.12zm1.558-1.06c-.078 0-.14.062-.146.14l-.105 6.01c.006.077.068.14.146.14.077 0 .14-.063.146-.14l.104-6.01c-.006-.078-.069-.14-.145-.14zm1.583-.09c-.09 0-.16.072-.167.162l-.083 6.19c.007.09.078.163.167.163.09 0 .162-.073.168-.163l.084-6.19c-.006-.09-.078-.162-.17-.162zm1.616-.8c-.1 0-.18.082-.187.182l-.063 7.78c.007.1.087.183.187.183s.18-.083.188-.183l.062-7.78c-.007-.1-.087-.182-.187-.182zm1.65-.63c-.11 0-.2.09-.208.203l-.042 8.41c.008.112.098.203.208.203.11 0 .2-.09.208-.203l.042-8.41c-.008-.113-.098-.203-.208-.203zm1.683-.49c-.122 0-.22.1-.23.224l-.02 9.12c.01.123.108.223.23.223.12 0 .22-.1.23-.223l.02-9.12c-.01-.124-.11-.224-.23-.224zm14.718 2.45c-.32-.01-.63.05-.91.17-.4-.82-1.25-1.4-2.24-1.4-.41 0-.79.1-1.13.29-.39-2.34-2.42-4.13-4.88-4.13-.53 0-1.04.09-1.52.24v9.64h10.42c1.78 0 3.22-1.44 3.22-3.22 0-1.74-1.39-3.16-3.12-3.22z"/>
        </svg>
      ),
    },
    {
      id: 'jiosaavn',
      name: 'JioSaavn',
      category: 'Track Preview & Metadata',
      canDownload: false,
      bg: 'bg-[#00BFA5]',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2V13h2v3.5zm0-5.5h-2V7h2v4z"/>
        </svg>
      ),
    },
    {
      id: 'amazon',
      name: 'Amazon Music',
      category: 'Album & Track Info',
      canDownload: false,
      bg: 'bg-[#00A8E1]',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M13.958 10.09c0 1.255-.17 2.155-.51 2.7-.34.545-.918.818-1.734.818-.612 0-1.122-.136-1.53-.408-.408-.272-.612-.714-.612-1.326 0-.68.204-1.224.612-1.632.408-.408 1.054-.646 1.938-.714l1.836-.17v.732zm2.856 5.882c-.204.204-.476.306-.816.306-.272 0-.544-.068-.816-.204-.34-.17-.612-.476-.816-.918-.68.782-1.666 1.173-2.958 1.173-1.122 0-2.006-.34-2.652-1.02-.646-.68-.969-1.598-.969-2.754 0-1.36.408-2.414 1.224-3.162.816-.748 1.972-1.156 3.468-1.224l2.482-.102v-.68c0-.85-.17-1.462-.51-1.836-.34-.374-.918-.561-1.734-.561-.646 0-1.19.136-1.632.408-.442.272-.748.646-.918 1.122-.136.34-.374.51-.714.51-.238 0-.476-.102-.714-.306l-.918-.816c-.238-.238-.272-.476-.102-.714.408-.85 1.054-1.53 1.938-2.04.884-.51 2.006-.765 3.366-.765 1.7 0 2.992.442 3.876 1.326.884.884 1.326 2.21 1.326 3.978v5.508c0 .884.17 1.496.51 1.836.136.136.17.306.102.51-.068.204-.204.374-.408.51l-1.428 1.156zM21.5 19.5c-4.5 3-10.5 3.5-16 1.5-.7-.25-1.5.35-1.2 1.05 4.8 5 14.2 4.5 18.2.2 0-.3-.4-.7-.7-.75-.1-.02-.2-.01-.3.0z"/>
        </svg>
      ),
    },
    {
      id: 'bandcamp',
      name: 'Bandcamp',
      category: 'Lossless & MP3 Audio',
      canDownload: true,
      bg: 'bg-[#1DA0C3]',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Glassmorphic Top Header with Logo & Dynamic Online Status */}
      <div className="sticky top-0 z-30 -mx-1 px-3.5 py-2.5 rounded-2xl bg-white/50 dark:bg-white/[0.04] backdrop-blur-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-sm dark:shadow-[0_2px_10px_rgba(0,0,0,0.15)] flex items-center justify-between transition-all">
        <Logo size="md" showText={true} showSubtitle={true} />

        <div className="flex items-center gap-1.5">
          {/* Audio Engine Online Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-wide select-none transition-all shadow-sm ${
              backendOnline
                ? 'bg-[#00B8FF]/10 border-[#00B8FF]/25 text-[#00B8FF]'
                : 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline
                  ? 'bg-[#00B8FF] shadow-[0_0_8px_rgba(0,184,255,0.7)] animate-pulse'
                  : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
              }`}
            />
            <span>{backendOnline ? 'Audio Engine' : 'Offline'}</span>
          </div>

          {/* Downloads shortcut */}
          <button
            onClick={() => setActiveTab('downloads')}
            className="relative p-2 rounded-xl text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/10 transition-colors"
            aria-label="Downloads"
            title="Downloads"
          >
            <Download size={18} />
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#563BFF] to-[#DB20E8] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none shadow-sm">
                {activeCount > 9 ? '9+' : activeCount}
              </span>
            )}
          </button>

          {/* Settings shortcut */}
          <button
            onClick={() => setActiveTab('settings')}
            className="p-2 rounded-xl text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/10 transition-colors"
            aria-label="Settings"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Backend Offline Banner */}
      {!backendOnline && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-3">
          <WifiOff size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-500">Audio Engine is reconnecting</p>
            <p className="text-[11px] text-[var(--vg-text-muted)] mt-0.5 leading-snug">
              Ensuring connection to VidGrab audio backend engine at localhost:3001.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="space-y-6 pt-3 sm:pt-6">
        {/* 2. Hero URL Input Section */}
        <UrlInput
          onAnalyze={handleAnalyze}
          loading={loading}
          error={error}
          placeholder="Paste audio or music link here…"
          buttonLabel="Analyze Audio"
          loadingLabel="Analyzing Audio…"
        />

        {/* 3. Audio Preview Screen (when analyzed) OR Audio Home Content */}
        {analyzedMusic ? (
          <AudioCard metadata={analyzedMusic} onBack={() => setAnalyzedMusic(null)} />
        ) : (
          <>
            {/* 4. Supported Music Platforms Grid: Exactly 4 Primary Icons + More Button */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-[var(--vg-text-secondary)] uppercase tracking-wider">
                  Supported Platforms
                </span>
                <button
                  onClick={() => setShowMoreModal(true)}
                  className="text-xs font-bold text-[#00B8FF] hover:underline flex items-center gap-1 active:scale-95 transition-transform"
                >
                  <span>More</span>
                  <span className="text-sm font-extrabold leading-none">+</span>
                </button>
              </div>

              {/* Exact 4 Primary Icons */}
              <div className="grid grid-cols-4 gap-2.5">
                {primaryPlatforms.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlatform(p.id)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-[var(--vg-card)] border border-transparent hover:border-[var(--vg-border)] transition-all group"
                  >
                    <div className={`w-11 h-11 rounded-2xl ${p.bg} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                      {p.icon}
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--vg-text-secondary)] group-hover:text-[var(--vg-text-primary)] truncate max-w-full">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Recent Audio Downloads Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-[var(--vg-text-primary)]">
                  Recent Audio Downloads
                </h2>
                <button
                  onClick={() => setActiveTab('downloads')}
                  className="text-xs font-bold text-[#00B8FF] hover:underline"
                >
                  See All
                </button>
              </div>

              {recentAudioJobs.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[var(--vg-border)] p-6 text-center bg-[var(--vg-card)]">
                  <p className="text-xs font-medium text-[var(--vg-text-secondary)]">
                    No audio downloads yet.
                  </p>
                  <p className="text-[11px] text-[var(--vg-text-muted)] mt-1">
                    Paste a song or music link above and click Analyze Audio to start your first download!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentAudioJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--vg-border)] bg-[var(--vg-card)] shadow-sm hover:border-[#00B8FF]/30 transition-all"
                    >
                      {/* Artwork thumbnail with audio icon overlay */}
                      <div className="relative w-14 h-11 rounded-xl overflow-hidden bg-neutral-900 flex-shrink-0 border border-[var(--vg-border)]">
                        {job.thumbnail ? (
                          <img
                            src={job.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                            <Music size={14} className="text-[#00B8FF]" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                          <Play size={10} className="fill-white text-white opacity-80" />
                        </div>
                      </div>

                      {/* Title, Artist & Format Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[var(--vg-text-primary)] truncate">
                          {job.title || job.filename}
                        </p>
                        <p className="text-[11px] font-semibold text-[var(--vg-text-muted)] mt-0.5 truncate">
                          {job.artist ? `${job.artist} • ` : ''}{job.format?.toUpperCase() || 'MP3'} • {job.quality || '320k'}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {job.status === 'completed' ? (
                          <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-500/20" />
                        ) : job.status === 'failed' ? (
                          <AlertCircle size={18} className="text-rose-500" />
                        ) : (
                          <Clock size={18} className="text-[#00B8FF] animate-pulse" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* More Music Platforms Modal */}
      <Modal
        isOpen={showMoreModal}
        onClose={() => setShowMoreModal(false)}
        title="More Supported Music Platforms"
      >
        <div className="space-y-3 pt-1">
          <p className="text-xs text-[var(--vg-text-secondary)]">
            VidGrab supports audio & music links from all major platforms:
          </p>

          <div className="space-y-2">
            {morePlatforms.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-2xl border border-[var(--vg-border)] bg-[var(--vg-bg-secondary)] hover:border-[#00B8FF]/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl ${p.bg} flex items-center justify-center shadow-md flex-shrink-0`}>
                    {p.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--vg-text-primary)]">{p.name}</p>
                    <p className="text-[11px] text-[var(--vg-text-muted)] mt-0.5">{p.category}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  p.canDownload
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-500'
                }`}>
                  {p.canDownload ? 'Direct MP3' : 'Preview'}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowMoreModal(false)}
            className="w-full py-3 rounded-full gradient-btn text-xs font-bold shadow-md mt-2"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
