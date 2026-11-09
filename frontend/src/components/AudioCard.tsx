'use client';

import React, { useState } from 'react';
import { MusicMetadata, MusicFormat, MusicTrack } from '@/lib/types';
import { formatDuration } from '@/lib/api';
import { createDownload } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import {
  Download, Clock, Music, Check, Loader2, AlertCircle, ArrowLeft, Heart, Play,
  ExternalLink, Lock, CheckSquare, Square, Disc
} from 'lucide-react';

interface AudioCardProps {
  metadata: MusicMetadata;
  onBack?: () => void;
}

export default function AudioCard({ metadata, onBack }: AudioCardProps) {
  const { settings, refreshJobs, setActiveTab, setAnalyzedMusic, setIsQueuePaused } = useApp();
  const defaultFmt = metadata.formats?.find(f => f.quality === settings.defaultAudioQuality) || metadata.formats?.[0];
  const [selectedFormat, setSelectedFormat] = useState<MusicFormat | undefined>(defaultFmt);
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [downloadingTrackId, setDownloadingTrackId] = useState<string | null>(null);

  // Playlist track selection
  const [selectedTracks, setSelectedTracks] = useState<string[]>(
    metadata.tracks ? metadata.tracks.map(t => t.id) : []
  );

  React.useEffect(() => {
    const chosen = metadata.formats?.find(f => f.quality === settings.defaultAudioQuality) || metadata.formats?.[0];
    setSelectedFormat(chosen);
    setSelectedTracks(metadata.tracks ? metadata.tracks.map(t => t.id) : []);
    setDownloading(false);
    setDone(false);
    setError('');
  }, [metadata, settings.defaultAudioQuality]);

  function handleClose() {
    if (onBack) {
      onBack();
    } else {
      setAnalyzedMusic(null);
    }
  }

  async function handleDownloadIndividualTrack(track: MusicTrack, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (downloadingTrackId) return;

    setDownloadingTrackId(track.id);
    const chosenFormat = selectedFormat || metadata.formats?.[0] || {
      id: 'mp3_320k',
      label: 'MP3 (320 kbps)',
      format: 'mp3',
      quality: '320k',
      mimeType: 'audio/mpeg',
      url: track.url || metadata.url,
    };

    const trackUrl = track.url || (track.id ? `https://www.youtube.com/watch?v=${track.id}` : metadata.url);
    const formatUrl = `ytdlp:audio:${chosenFormat.format}:${chosenFormat.quality || '320k'}||${trackUrl}`;

    try {
      await createDownload({
        url: trackUrl,
        title: track.title,
        artist: track.artist || metadata.artist,
        mediaType: 'music',
        thumbnail: track.thumbnail || metadata.artwork || metadata.thumbnail,
        sourceDomain: metadata.platform || 'music',
        format: chosenFormat.format,
        quality: chosenFormat.quality || '320k',
        mimeType: chosenFormat.mimeType,
        formatUrl,
      });

      setIsQueuePaused(false);
      refreshJobs();
      setDownloadingTrackId(null);
      setActiveTab('downloads');
    } catch (err: any) {
      setDownloadingTrackId(null);
      setError(err?.message || 'Download failed');
    }
  }

  async function handleDownloadSingle() {
    if (downloading || done || !metadata.canDownload) return;
    setDownloading(true);
    setError('');

    const chosenFormat = selectedFormat || metadata.formats?.[0] || {
      id: 'mp3_320k',
      label: 'MP3 (320 kbps)',
      format: 'mp3',
      quality: '320k',
      mimeType: 'audio/mpeg',
      url: metadata.url,
    };

    const formatUrl = `ytdlp:audio:${chosenFormat.format}:${chosenFormat.quality || '320k'}||${metadata.url}`;

    try {
      await createDownload({
        url: metadata.url,
        title: metadata.title,
        artist: metadata.artist,
        mediaType: 'music',
        thumbnail: metadata.artwork || metadata.thumbnail,
        sourceDomain: metadata.platform || 'music',
        format: chosenFormat.format,
        quality: chosenFormat.quality || '320k',
        mimeType: chosenFormat.mimeType,
        formatUrl,
      });

      setDone(true);
      setDownloading(false);
      setIsQueuePaused(false);
      refreshJobs();
      setActiveTab('downloads');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to start download');
      setDownloading(false);
    }
  }

  async function handleDownloadPlaylist() {
    if (downloading || done || !metadata.tracks || selectedTracks.length === 0) return;
    setDownloading(true);
    setError('');

    const chosenFormat = selectedFormat || metadata.formats?.[0] || {
      id: 'mp3_320k',
      label: 'MP3 (320 kbps)',
      format: 'mp3',
      quality: '320k',
      mimeType: 'audio/mpeg',
      url: metadata.url,
    };

    try {
      const tracksToDownload = metadata.tracks.filter(t => selectedTracks.includes(t.id));
      for (const track of tracksToDownload) {
        const trackUrl = track.url || (track.id ? `https://www.youtube.com/watch?v=${track.id}` : metadata.url);
        const formatUrl = `ytdlp:audio:${chosenFormat.format}:${chosenFormat.quality || '320k'}||${trackUrl}`;
        await createDownload({
          url: trackUrl,
          title: track.title,
          artist: track.artist || metadata.artist,
          mediaType: 'music',
          thumbnail: track.thumbnail || metadata.artwork || metadata.thumbnail,
          sourceDomain: metadata.platform || 'music',
          format: chosenFormat.format,
          quality: chosenFormat.quality || '320k',
          mimeType: chosenFormat.mimeType,
          formatUrl,
        });
      }

      setDone(true);
      setDownloading(false);
      setIsQueuePaused(false);
      refreshJobs();
      setActiveTab('downloads');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to queue all tracks');
      setDownloading(false);
    }
  }

  const toggleSelectTrack = (id: string) => {
    setSelectedTracks(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const selectAllTracks = () => {
    if (metadata.tracks) {
      setSelectedTracks(metadata.tracks.map(t => t.id));
    }
  };

  const deselectAllTracks = () => {
    setSelectedTracks([]);
  };

  const artwork = metadata.artwork || metadata.thumbnail;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between pb-1">
        <button
          onClick={handleClose}
          className="p-2 -ml-2 rounded-full text-[var(--vg-text-secondary)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/10 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>

        <h2 className="text-[16px] font-bold text-[var(--vg-text-primary)]">
          Audio Preview
        </h2>

        <button
          onClick={() => setIsFavorite(v => !v)}
          className={`p-2 -mr-2 rounded-full transition-colors ${
            isFavorite ? 'text-red-500' : 'text-[var(--vg-text-secondary)] hover:text-red-400'
          }`}
          aria-label="Favorite"
        >
          <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Main Preview Card */}
      <div
        className="rounded-3xl overflow-hidden border p-4 space-y-4 shadow-xl transition-all"
        style={{
          backgroundColor: 'var(--vg-card)',
          borderColor: 'var(--vg-border)',
        }}
      >
        {/* Artwork Preview Player */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-neutral-900 border border-[var(--vg-border)] group flex items-center justify-center">
          {artwork ? (
            <>
              {/* Blurred background glow */}
              <div
                className="absolute inset-0 blur-xl opacity-40 scale-110"
                style={{ backgroundImage: `url(${artwork})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
              <img
                src={artwork}
                alt={metadata.title}
                className="relative z-10 max-h-full max-w-full object-contain drop-shadow-2xl rounded-xl"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0D1020] to-[#191D31]">
              <Music size={42} className="text-[#00B8FF]" />
            </div>
          )}

          {/* Central Glow Audio Play Overlay */}
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
              <Play size={20} className="text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* Track Count / Duration Badge */}
          {(metadata.trackCount || metadata.tracks?.length) ? (
            <span className="absolute bottom-2.5 right-2.5 z-20 bg-black/85 backdrop-blur-sm text-[#00B8FF] text-[11px] font-bold px-2 py-0.5 rounded-md font-mono flex items-center gap-1 shadow-sm">
              <Disc size={12} />
              {metadata.trackCount || metadata.tracks?.length} Tracks
            </span>
          ) : metadata.duration ? (
            <span className="absolute bottom-2.5 right-2.5 z-20 bg-black/80 backdrop-blur-sm text-white text-[11px] font-semibold px-2 py-0.5 rounded-md font-mono">
              {formatDuration(metadata.duration)}
            </span>
          ) : null}

          {/* Source Platform Badge */}
          <span className="absolute top-2.5 left-2.5 z-20 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-white/10 flex items-center gap-1.5">
            <span>{metadata.platform}</span>
            {metadata.type === 'playlist' && (
              <span className="bg-[#00B8FF]/30 text-[#00B8FF] px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-normal">
                PLAYLIST
              </span>
            )}
            {metadata.type === 'album' && (
              <span className="bg-[#DB20E8]/30 text-[#DB20E8] px-1.5 py-0.5 rounded text-[8px] font-extrabold tracking-normal">
                ALBUM
              </span>
            )}
          </span>
        </div>

        {/* Audio Info: Title, Artist, Album */}
        <div>
          <h3 className="font-bold text-[var(--vg-text-primary)] text-[16px] leading-snug line-clamp-2">
            {metadata.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-[var(--vg-text-secondary)] font-medium flex-wrap">
            {metadata.artist && (
              <span className="text-[#00B8FF] font-semibold">{metadata.artist}</span>
            )}
            {metadata.album && (
              <>
                <span>•</span>
                <span className="text-[var(--vg-text-muted)] truncate max-w-[180px]">{metadata.album}</span>
              </>
            )}
            {metadata.duration && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock size={11} />
                  {formatDuration(metadata.duration)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* If DRM Protected (Spotify, Apple Music, etc.) */}
        {!metadata.canDownload ? (
          <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/25 space-y-3">
            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
              <Lock size={15} />
              <span>DRM Protected Streaming Source</span>
            </div>
            <p className="text-xs text-[var(--vg-text-secondary)] leading-relaxed">
              {metadata.drmNotice || 'This music service enforces digital rights protection (DRM). You can listen directly via the official service.'}
            </p>
            {metadata.officialUrl && (
              <a
                href={metadata.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs shadow-md transition-colors"
              >
                <ExternalLink size={15} />
                <span>Open in {metadata.platform}</span>
              </a>
            )}
          </div>
        ) : (
          /* Downloadable Formats & CTA */
          <div className="space-y-4 pt-1">
            {/* Available Audio Quality Options */}
            {metadata.formats && metadata.formats.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--vg-text-secondary)] uppercase tracking-wider">
                    Available Audio Quality
                  </span>
                  <span className="text-[11px] text-[var(--vg-text-muted)] font-medium">
                    {metadata.formats.length} formats
                  </span>
                </div>

                <div className="space-y-2">
                  {metadata.formats.map((fmt) => {
                    const isSelected = selectedFormat?.id === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        onClick={() => setSelectedFormat(fmt)}
                        className={`
                          w-full flex items-center justify-between px-3.5 py-3 rounded-2xl border text-left transition-all
                          ${
                            isSelected
                              ? 'border-[#00B8FF] bg-[#00B8FF]/10 shadow-[0_0_15px_rgba(0,184,255,0.18)]'
                              : 'border-[var(--vg-border)] hover:border-[#00B8FF]/40 bg-[var(--vg-bg-secondary)]'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          {/* Radio Indicator */}
                          <div
                            className={`
                              w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                              ${
                                isSelected
                                  ? 'border-[#00B8FF] bg-[#00B8FF]'
                                  : 'border-[var(--vg-text-muted)]'
                              }
                            `}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>

                          <div className="flex items-center gap-2">
                            <Music size={14} className={isSelected ? 'text-[#00B8FF]' : 'text-[var(--vg-text-muted)]'} />
                            <span className="text-[13px] font-bold text-[var(--vg-text-primary)]">
                              {fmt.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-right">
                          <span className="text-xs font-bold text-[#00B8FF]">
                            {fmt.format.toUpperCase()}
                          </span>
                          <span className="text-[11px] font-mono text-[var(--vg-text-muted)]">
                            {fmt.quality}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Playlist Track Selection if playlist */}
            {metadata.tracks && metadata.tracks.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--vg-text-primary)]">
                    Tracks ({selectedTracks.length} of {metadata.tracks.length} selected)
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button onClick={selectAllTracks} className="font-bold text-[#00B8FF] hover:underline">
                      Select All
                    </button>
                    <span className="text-[var(--vg-border)]">•</span>
                    <button onClick={deselectAllTracks} className="font-bold text-[var(--vg-text-muted)] hover:underline">
                      Clear
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-[var(--vg-border)] border border-[var(--vg-border)] rounded-2xl max-h-56 overflow-y-auto scrollbar-hide bg-[var(--vg-bg-secondary)]">
                  {metadata.tracks.map((track, idx) => {
                    const isSelected = selectedTracks.includes(track.id);
                    const isDownloadingThis = downloadingTrackId === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => toggleSelectTrack(track.id)}
                        className="p-2.5 flex items-center justify-between hover:bg-neutral-500/5 cursor-pointer text-xs group"
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
                          <p className="font-bold text-[var(--vg-text-primary)] truncate">
                            {track.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {track.duration && (
                            <span className="text-[10px] font-mono text-[var(--vg-text-muted)]">
                              {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDownloadIndividualTrack(track, e)}
                            disabled={isDownloadingThis}
                            className="p-1 rounded-lg text-[#00B8FF] hover:bg-[#00B8FF]/15 active:scale-90 transition-all ml-1"
                            title={`Download "${track.title}" directly to device`}
                          >
                            {isDownloadingThis ? (
                              <Loader2 size={14} className="animate-spin text-[#00B8FF]" />
                            ) : (
                              <Download size={14} strokeWidth={2.5} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Progress Display */}
            {downloading && progress > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-semibold text-[var(--vg-text-secondary)]">
                  <span>Preparing audio download…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-[var(--vg-bg-secondary)] rounded-full overflow-hidden border border-[var(--vg-border)]">
                  <div
                    className="h-full bg-gradient-to-r from-[#00B8FF] to-[#DB20E8] transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-red-500 text-xs font-medium">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Primary Download CTA Button */}
            <button
              onClick={metadata.tracks && metadata.tracks.length > 0 ? handleDownloadPlaylist : handleDownloadSingle}
              disabled={downloading || done || (metadata.tracks && selectedTracks.length === 0)}
              className={`
                w-full flex items-center justify-center gap-2 py-4 rounded-full text-sm font-bold tracking-wide
                transition-all duration-200
                ${
                  done
                    ? 'bg-emerald-600 text-white'
                    : downloading
                    ? 'bg-[var(--vg-bg-secondary)] border border-[var(--vg-border)] text-[var(--vg-text-muted)] cursor-wait'
                    : 'gradient-btn shadow-xl active:scale-[0.98]'
                }
              `}
            >
              {done ? (
                <>
                  <Check size={18} strokeWidth={3} />
                  <span>Audio Downloaded!</span>
                </>
              ) : downloading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Processing Audio Stream…</span>
                </>
              ) : (
                <>
                  <Download size={18} strokeWidth={2.5} />
                  <span>
                    {metadata.tracks && metadata.tracks.length > 0
                      ? `Download ${selectedTracks.length} Selected Songs`
                      : `Download Audio (${(selectedFormat?.quality || '320k').toUpperCase()})`}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

