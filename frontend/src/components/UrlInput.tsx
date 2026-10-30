'use client';

import React, { useState, useRef } from 'react';
import { Link2, ClipboardPaste, X, Search, Loader2, AlertCircle } from 'lucide-react';

interface UrlInputProps {
  onAnalyze: (url: string) => Promise<void>;
  loading: boolean;
  error: string;
}

export default function UrlInput({ onAnalyze, loading, error }: UrlInputProps) {
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
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Input */}
      <div className="relative">
        <div className={`
          flex items-center bg-white dark:bg-neutral-800 rounded-2xl
          border-2 transition-all duration-200 overflow-hidden
          ${error ? 'border-red-400 dark:border-red-500' : 'border-neutral-200 dark:border-neutral-700'}
          focus-within:border-violet-500 dark:focus-within:border-violet-500
          focus-within:shadow-[0_0_0_4px_rgba(124,58,237,0.12)]
          shadow-sm
        `}>
          <div className="pl-4 pr-2 flex-shrink-0">
            <Link2 size={16} className="text-neutral-400" />
          </div>
          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a video URL here…"
            className="flex-1 py-4 pr-2 text-[15px] text-neutral-800 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 bg-transparent outline-none"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="url"
          />
          <div className="flex items-center pr-2 gap-1 flex-shrink-0">
            {url && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                aria-label="Clear"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={handlePaste}
              className="p-2 rounded-xl text-violet-500 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
              aria-label="Paste from clipboard"
              title="Paste"
            >
              <ClipboardPaste size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3.5 py-3">
          <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] text-red-600 dark:text-red-400 leading-snug">{error}</p>
        </div>
      )}

      {/* Analyze button */}
      <button
        type="submit"
        disabled={!url.trim() || loading}
        className={`
          w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[15px]
          transition-all duration-200 active:scale-[0.97]
          ${(!url.trim() || loading)
            ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
            : 'bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/30'}
        `}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Analyzing…
          </>
        ) : (
          <>
            <Search size={18} />
            Analyze URL
          </>
        )}
      </button>
    </form>
  );
}
