'use client';

import React, { useState, useRef } from 'react';
import { Link2, ClipboardPaste, X, Search, Loader2, AlertCircle } from 'lucide-react';

interface UrlInputProps {
  onAnalyze: (url: string) => Promise<void>;
  loading: boolean;
  error: string;
  placeholder?: string;
  buttonLabel?: string;
  loadingLabel?: string;
}

export default function UrlInput({
  onAnalyze,
  loading,
  error,
  placeholder = 'Paste video link here…',
  buttonLabel = 'Analyze Video',
  loadingLabel = 'Analyzing Video…',
}: UrlInputProps) {
  const [url, setUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setUrl(text.trim());
        inputRef.current?.focus();
      }
    } catch {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }

  function handleClear() {
    setUrl('');
    inputRef.current?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || loading) return;
    await onAnalyze(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {/* Input Field: Rounded Pill Container */}
      <div className="relative">
        <div
          className={`
            flex items-center rounded-full border px-4 py-1 transition-all duration-200
            ${error ? 'border-red-500/70 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-[var(--vg-border)]'}
            focus-within:border-[#563BFF] focus-within:shadow-[0_0_20px_rgba(86,59,255,0.25)]
          `}
          style={{
            backgroundColor: 'var(--vg-input-bg)',
          }}
        >
          <div className="pr-2.5 flex-shrink-0 text-[var(--vg-text-muted)]">
            <Link2 size={18} strokeWidth={2.2} />
          </div>

          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholder}
            className="flex-1 py-3 text-[14px] font-medium text-[var(--vg-text-primary)] placeholder-[var(--vg-text-muted)] bg-transparent outline-none"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="url"
          />

          <div className="flex items-center gap-1.5 flex-shrink-0 pl-1">
            {url && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-full text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/10 transition-colors"
                aria-label="Clear"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={handlePaste}
              className="p-2 rounded-full text-[#563BFF] dark:text-[#00B8FF] hover:bg-[#563BFF]/10 active:scale-90 transition-all"
              aria-label="Paste from clipboard"
              title="Paste link"
            >
              <ClipboardPaste size={17} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>

      {/* Error message card */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-red-500 dark:text-red-400">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <p className="text-[13px] leading-snug font-medium">{error}</p>
        </div>
      )}

      {/* Primary Action Button: Gradient Pill */}
      <button
        type="submit"
        disabled={!url.trim() || loading}
        className={`
          w-full flex items-center justify-center gap-2.5 py-3.5 rounded-full text-[15px] font-bold tracking-wide
          transition-all duration-200
          ${
            !url.trim() || loading
              ? 'bg-[var(--vg-card)] border border-[var(--vg-border)] text-[var(--vg-text-muted)] cursor-not-allowed opacity-60'
              : 'gradient-btn active:scale-[0.98]'
          }
        `}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>{loadingLabel}</span>
          </>
        ) : (
          <>
            <Search size={18} strokeWidth={2.5} />
            <span>{buttonLabel}</span>
          </>
        )}
      </button>
    </form>
  );
}
