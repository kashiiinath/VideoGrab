'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { analyzeMusicUrl, analyzeMusicPlaylist, createDownload } from '@/lib/api';
import { MusicMetadata, MusicTrack, MusicFormat } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import {
  Music, Disc, ListMusic, Sparkles, Check, Download, ExternalLink,
  Lock, AlertCircle, Play, CheckSquare, Square, RefreshCw, X, Loader2
} from 'lucide-react';

export default function MusicScreen() {
  const { settings, setActiveTab, refreshJobs, analyzedMusic, setAnalyzedMusic } = useApp();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>('mp3:320k');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeTab, setSubTab] = useState<'track' | 'playlist'>('track');
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [batchDownloading, setBatchDownloading] = useState(false);

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setError(null);
      }
    } catch {
      // Fallback
    }
  }

  function handleClear() {
    setUrl('');
    setError(null);
  }

  async function handleAnalyze(customUrl?: string) {
    const targetUrl = (customUrl || url).trim();
    if (!targetUrl) {
      setError('Please enter a music or playlist URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let data: MusicMetadata;
      if (activeTab === 'playlist' || targetUrl.includes('playlist') || targetUrl.includes('album')) {
        data = await analyzeMusicPlaylist(targetUrl);
      } else {
        data = await analyzeMusicUrl(targetUrl);
      }

      setAnalyzedMusic(data);
      // Initialize selected format based on default setting or available formats
      if (data.formats && data.formats.length > 0) {
        const preferred = data.formats.find(f => f.quality === settings.defaultAudioQuality);
        setSelectedFormat(preferred ? preferred.id : data.formats[0].id);
      }

      // Initialize selected tracks if playlist
      if (data.tracks && data.tracks.length > 0) {
        setSelectedTracks(data.tracks.map(t => t.id));
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Failed to analyze music URL';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadTrack(track?: MusicTrack) {
    if (!analyzedMusic) return;

    const title = track ? track.title : analyzedMusic.title;
    const artist = track?.artist || analyzedMusic.artist;
    const trackUrl = track?.url || analyzedMusic.url;
    const thumbnail = track?.thumbnail || analyzedMusic.artwork || analyzedMusic.thumbnail;

    const chosenFormat = analyzedMusic.formats?.find(f => f.id === selectedFormat) || {
      id: selectedFormat,
      label: 'MP3 (320 kbps)',
      format: 'mp3',
      quality: '320k',
      mimeType: 'audio/mpeg',
    };

    const formatUrl = `ytdlp:audio:${chosenFormat.format}:${chosenFormat.quality || '320k'}||${trackUrl}`;
    const sanitizedTitle = `${artist ? `${artist} - ` : ''}${title}`.replace(/[\\/:*?"<>|]/g, '');
    const filename = `${sanitizedTitle}.${chosenFormat.format}`;

    const trackId = track?.id || 'single';
    setDownloadingId(trackId);

    try {
      await createDownload({
        url: trackUrl,
        title,
        artist,
        mediaType: 'music',
        thumbnail,
        sourceDomain: analyzedMusic.platform || 'music',
        format: chosenFormat.format,
        quality: chosenFormat.quality || '320k',
        mimeType: chosenFormat.mimeType,
        formatUrl,
      });

      refreshJobs();
      setActiveTab('downloads');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start download');
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleBatchDownload() {
    if (!analyzedMusic || !analyzedMusic.tracks || selectedTracks.length === 0) return;

    setBatchDownloading(true);
    const chosenFormat = analyzedMusic.formats?.find(f => f.id === selectedFormat) || {
      id: selectedFormat,
      label: 'MP3 (320 kbps)',
      format: 'mp3',
      quality: '320k',
      mimeType: 'audio/mpeg',
    };

    try {
      const tracksToDownload = analyzedMusic.tracks.filter(t => selectedTracks.includes(t.id));
      for (const track of tracksToDownload) {
        const formatUrl = `ytdlp:audio:${chosenFormat.format}:${chosenFormat.quality || '320k'}||${track.url || analyzedMusic.url}`;
        const sanitizedTitle = `${track.artist ? `${track.artist} - ` : ''}${track.title}`.replace(/[\\/:*?"<>|]/g, '');
        const filename = `${sanitizedTitle}.${chosenFormat.format}`;

        await createDownload({
          url: track.url || analyzedMusic.url,
          title: track.title,
          artist: track.artist,
          mediaType: 'music',
          thumbnail: track.thumbnail || analyzedMusic.artwork || analyzedMusic.thumbnail,
          sourceDomain: analyzedMusic.platform || 'music',
          format: chosenFormat.format,
          quality: chosenFormat.quality || '320k',
          mimeType: chosenFormat.mimeType,
          formatUrl,
        });
      }

      refreshJobs();
      setActiveTab('downloads');
    } catch (err: any) {
      setError('Some tracks could not be queued');
    } finally {
      setBatchDownloading(false);
    }
  }

  const toggleSelectTrack = (id: string) => {
    setSelectedTracks(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const selectAllTracks = () => {
    if (analyzedMusic?.tracks) {
      setSelectedTracks(analyzedMusic.tracks.map(t => t.id));
    }
  };

  const deselectAllTracks = () => {
    setSelectedTracks([]);
  };

  return (
    <div className="space-y-4">
      {/* Top Engine Pill */}
      <div className="flex justify-center pt-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--vg-card)] border border-[var(--vg-border)] text-[11px] font-semibold text-[var(--vg-text-secondary)] shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Universal Audio Engine</span>
        </div>
      </div>

      {/* Sub Tabs: Single Track vs Playlist */}
      <div className="flex p-1 rounded-2xl bg-[var(--vg-card)] border border-[var(--vg-border)] shadow-sm">
        <button
          onClick={() => { setSubTab('track'); setAnalyzedMusic(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'track'
              ? 'bg-gradient-to-r from-[#00B8FF] to-[#563BFF] text-white shadow-md'
              : 'text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)]'
          }`}
        >
          <Disc size={15} />
          <span>Single Track</span>
        </button>
        <button
          onClick={() => { setSubTab('playlist'); setAnalyzedMusic(null); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'playlist'
              ? 'bg-gradient-to-r from-[#563BFF] to-[#DB20E8] text-white shadow-md'
              : 'text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)]'
          }`}
        >
          <ListMusic size={15} />
          <span>Playlist & Album</span>
        </button>
      </div>

      {/* Music URL Input Card */}
      <div
        className="rounded-3xl border p-4 sm:p-5 space-y-3.5 shadow-sm transition-all"
        style={{
          backgroundColor: 'var(--vg-card)',
          borderColor: 'var(--vg-border)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00B8FF]/15 text-[#00B8FF] flex items-center justify-center flex-shrink-0">
            <Music size={17} />
          </div>
          <div>
            <h2 className="font-bold text-sm text-[var(--vg-text-primary)]">
              {activeTab === 'track' ? 'Music Downloader' : 'Playlist Downloader'}
            </h2>
            <p className="text-[11px] text-[var(--vg-text-muted)]">
              YouTube Music, Spotify, Apple, SoundCloud, JioSaavn
            </p>
          </div>
        </div>

        {/* URL Input with Paste & Clear */}
        <div className="relative flex items-center">
          <input
            type="url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(null); }}
            placeholder={
              activeTab === 'track'
                ? 'Paste song link (e.g. music.youtube.com/...)'
                : 'Paste playlist link (e.g. playlist, album)...'
            }
            className="w-full pl-3.5 pr-20 py-3 rounded-2xl bg-[var(--vg-bg-secondary)] border border-[var(--vg-border)] text-xs text-[var(--vg-text-primary)] placeholder-[var(--vg-text-muted)] focus:outline-none focus:border-[#00B8FF] transition-all"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {url ? (
              <button
                onClick={handleClear}
                className="p-1 rounded-full text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)]"
                aria-label="Clear"
              >
                <X size={15} />
              </button>
            ) : (
              <button
                onClick={handlePaste}
                className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-[#00B8FF]/15 text-[#00B8FF] hover:bg-[#00B8FF]/25 transition-colors"
              >
                Paste
              </button>
            )}
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={() => handleAnalyze()}
          disabled={loading || !url.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl gradient-btn text-xs font-bold shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Analyzing Music...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Analyze {activeTab === 'track' ? 'Song' : 'Playlist'}</span>
            </>
          )}
        </button>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-start gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Quick Platform Pills */}
        <div className="pt-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--vg-text-muted)] mb-2">
            Supported Sources
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { name: 'YouTube Music', download: true },
              { name: 'SoundCloud', download: true },
              { name: 'Bandcamp', download: true },
              { name: 'Spotify', download: false },
              { name: 'Apple Music', download: false },
              { name: 'JioSaavn', download: false },
            ].map(p => (
              <span
                key={p.name}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${
                  p.download
                    ? 'border-[#00B8FF]/30 bg-[#00B8FF]/10 text-[#00B8FF]'
                    : 'border-[var(--vg-border)] bg-[var(--vg-bg-secondary)] text-[var(--vg-text-secondary)]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${p.download ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>{p.name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Result Card */}
      {analyzedMusic && (
        <div
          className="rounded-3xl border p-4 sm:p-5 space-y-4 shadow-sm transition-all animate-in fade-in zoom-in-95 duration-200"
          style={{
            backgroundColor: 'var(--vg-card)',
            borderColor: 'var(--vg-border)',
          }}
        >
          {/* Track / Album Hero Section */}
          <div className="flex items-start gap-3.5">
            {/* Artwork with ambient blur */}
            <div className="relative flex-shrink-0">
              {(analyzedMusic.artwork || analyzedMusic.thumbnail) ? (
                <>
                  <div
                    className="absolute inset-0 rounded-2xl blur-md opacity-60 -z-10"
                    style={{ backgroundImage: `url(${analyzedMusic.artwork || analyzedMusic.thumbnail})`, backgroundSize: 'cover' }}
                  />
                  <img
                    src={analyzedMusic.artwork || analyzedMusic.thumbnail}
                    alt={analyzedMusic.title}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-[var(--vg-border)] shadow-md"
                  />
                </>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#00B8FF]/20 to-[#DB20E8]/20 border border-[var(--vg-border)] flex items-center justify-center text-[#563BFF]">
                  <Music size={32} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-[var(--vg-bg-secondary)] border border-[var(--vg-border)] text-[#00B8FF]">
                {analyzedMusic.platform}
              </span>
              <h3 className="font-extrabold text-sm sm:text-base text-[var(--vg-text-primary)] mt-1 truncate">
                {analyzedMusic.title}
              </h3>
              {analyzedMusic.artist && (
                <p className="text-xs font-semibold text-[var(--vg-text-secondary)] mt-0.5 truncate">
                  {analyzedMusic.artist}
                </p>
              )}
              {analyzedMusic.album && (
                <p className="text-[11px] text-[var(--vg-text-muted)] truncate">
                  {analyzedMusic.album}
                </p>
              )}
              {analyzedMusic.duration && (
                <p className="text-[10px] text-[var(--vg-text-muted)] mt-1 font-mono">
                  {Math.floor(analyzedMusic.duration / 60)}:{(analyzedMusic.duration % 60).toString().padStart(2, '0')}
                </p>
              )}
            </div>
          </div>

          {/* If DRM Protected (Spotify, Apple Music, etc.) */}
          {!analyzedMusic.canDownload ? (
            <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/20 space-y-3">
              <div className="flex items-center gap-2 text-amber-500">
                <Lock size={16} />
                <span className="text-xs font-bold">DRM Protected Platform</span>
              </div>
              <p className="text-[11px] text-[var(--vg-text-secondary)] leading-relaxed">
                {analyzedMusic.drmNotice || 'This music platform enforces digital rights management (DRM). Downloads are restricted, but you can listen directly via the official platform.'}
              </p>
              {analyzedMusic.officialUrl && (
                <a
                  href={analyzedMusic.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 font-bold text-xs transition-colors"
                >
                  <ExternalLink size={14} />
                  <span>Open in {analyzedMusic.platform}</span>
                </a>
              )}
            </div>
          ) : (
            /* Downloadable Track / Playlist Section */
            <div className="space-y-4 pt-1">
              {/* Quality Selector */}
              {analyzedMusic.formats && analyzedMusic.formats.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--vg-text-muted)] block mb-2">
                    Select Audio Quality
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {analyzedMusic.formats.map((fmt) => {
                      const active = selectedFormat === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          onClick={() => setSelectedFormat(fmt.id)}
                          className={`p-2.5 rounded-2xl border text-left transition-all ${
                            active
                              ? 'border-[#00B8FF] bg-[#00B8FF]/10 text-[#00B8FF]'
                              : 'border-[var(--vg-border)] bg-[var(--vg-bg-secondary)] text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{fmt.label}</span>
                            {active && <Check size={14} strokeWidth={3} />}
                          </div>
                          <p className="text-[10px] text-[var(--vg-text-muted)] mt-0.5">
                            {fmt.format.toUpperCase()} {fmt.quality}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Single Track Download CTA */}
              {(!analyzedMusic.tracks || analyzedMusic.tracks.length === 0) && (
                <button
                  onClick={() => handleDownloadTrack()}
                  disabled={downloadingId !== null}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full gradient-btn text-xs font-bold shadow-lg active:scale-[0.98] transition-all"
                >
                  {downloadingId ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Queuing Download...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} strokeWidth={2.5} />
                      <span>Download Song (Universal Audio)</span>
                    </>
                  )}
                </button>
              )}

              {/* Playlist Tracks Table */}
              {analyzedMusic.tracks && analyzedMusic.tracks.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--vg-text-primary)]">
                        Tracks ({analyzedMusic.tracks.length})
                      </h4>
                      <p className="text-[10px] text-[var(--vg-text-muted)]">
                        {selectedTracks.length} of {analyzedMusic.tracks.length} selected
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAllTracks}
                        className="text-[10px] font-bold text-[#00B8FF] hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-[var(--vg-border)]">•</span>
                      <button
                        onClick={deselectAllTracks}
                        className="text-[10px] font-bold text-[var(--vg-text-muted)] hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-[var(--vg-border)] border border-[var(--vg-border)] rounded-2xl max-h-60 overflow-y-auto scrollbar-hide bg-[var(--vg-bg-secondary)]">
                    {analyzedMusic.tracks.map((track, idx) => {
                      const isSelected = selectedTracks.includes(track.id);
                      return (
                        <div
                          key={track.id}
                          onClick={() => toggleSelectTrack(track.id)}
                          className="p-2.5 flex items-center justify-between hover:bg-neutral-500/5 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleSelectTrack(track.id); }}
                              className="text-[#00B8FF]"
                            >
                              {isSelected ? <CheckSquare size={16} /> : <Square size={16} className="text-[var(--vg-text-muted)]" />}
                            </button>
                            <span className="text-[10px] font-mono text-[var(--vg-text-muted)] w-4 text-right">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-[var(--vg-text-primary)] truncate">
                                {track.title}
                              </p>
                              {track.artist && (
                                <p className="text-[10px] text-[var(--vg-text-muted)] truncate">
                                  {track.artist}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {track.duration && (
                              <span className="text-[10px] font-mono text-[var(--vg-text-muted)]">
                                {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Batch Download Button */}
                  <button
                    onClick={handleBatchDownload}
                    disabled={batchDownloading || selectedTracks.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full gradient-btn text-xs font-bold shadow-lg active:scale-[0.98] disabled:opacity-50 transition-all"
                  >
                    {batchDownloading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Queuing {selectedTracks.length} Songs...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} strokeWidth={2.5} />
                        <span>Download {selectedTracks.length} Selected Songs</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

