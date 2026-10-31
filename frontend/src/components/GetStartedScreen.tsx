'use client';

import React from 'react';
import { ArrowRight, Zap, Film, ShieldCheck, Sparkles } from 'lucide-react';

interface GetStartedScreenProps {
  onStart: () => void;
}

export default function GetStartedScreen({ onStart }: GetStartedScreenProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between p-6 overflow-hidden transition-all duration-500"
      style={{ backgroundColor: 'var(--vg-bg)' }}
    >
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-15%] left-[-20%] w-[500px] h-[500px] rounded-full bg-[#00B8FF]/15 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-20%] w-[500px] h-[500px] rounded-full bg-[#DB20E8]/15 blur-[130px]" />
        <div className="absolute top-[40%] left-[30%] w-[350px] h-[350px] rounded-full bg-[#563BFF]/20 blur-[110px]" />
      </div>

      {/* Top Bar / Badge */}
      <div className="w-full max-w-md mx-auto flex justify-between items-center pt-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--vg-card)] border border-[var(--vg-border)] shadow-sm">
          <Sparkles size={13} className="text-[#00B8FF]" />
          <span className="text-[11px] font-bold text-[var(--vg-text-secondary)] tracking-wide uppercase">
            Premium PWA Experience
          </span>
        </div>
      </div>

      {/* Center Hero: Large Logo & Value Proposition */}
      <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center text-center space-y-6 px-2 py-4">
        {/* App Icon with Glowing Radiance */}
        <div className="relative group">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#00B8FF] via-[#563BFF] to-[#DB20E8] opacity-50 blur-xl group-hover:opacity-75 transition-opacity" />
          
          <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-[#0D1020] to-[#191D31] border border-[var(--vg-border)] p-4 shadow-2xl flex items-center justify-center">
            {/* SVG Logo Icon */}
            <svg
              width="76"
              height="76"
              viewBox="0 0 100 100"
              fill="none"
              className="filter drop-shadow-[0_4px_12px_rgba(86,59,255,0.6)]"
            >
              <defs>
                <linearGradient id="gs-logo-grad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#00B8FF" />
                  <stop offset="50%" stopColor="#563BFF" />
                  <stop offset="100%" stopColor="#DB20E8" />
                </linearGradient>
              </defs>

              <path
                d="M26 20C26 14 32.8 10.4 37.8 13.8L82.2 43.8C86.8 46.9 86.8 53.1 82.2 56.2L37.8 86.2C32.8 89.6 26 86 26 80V20Z"
                fill="url(#gs-logo-grad)"
              />

              <path
                d="M51 35C51 33.6 52.1 32.5 53.5 32.5C54.9 32.5 56 33.6 56 35V53.5L61.2 48.3C62.2 47.3 63.8 47.3 64.8 48.3C65.8 49.3 65.8 50.9 64.8 51.9L55.3 61.4C54.3 62.4 52.7 62.4 51.7 61.4L42.2 51.9C41.2 50.9 41.2 49.3 42.2 48.3C43.2 47.3 44.8 47.3 45.8 48.3L51 53.5V35Z"
                fill="#FFFFFF"
              />
              <path
                d="M41 63.5C39.6 63.5 38.5 64.6 38.5 66C38.5 67.4 39.6 68.5 41 68.5H66C67.4 68.5 68.5 67.4 68.5 66C68.5 64.6 67.4 63.5 66 63.5H62V66H45V63.5H41Z"
                fill="#FFFFFF"
              />
            </svg>
          </div>
        </div>

        {/* Brand Name & Headline */}
        <div className="space-y-2">
          <div className="font-black text-4xl sm:text-5xl tracking-tight leading-none flex items-center justify-center">
            <span className="text-[var(--vg-text-primary)]">VID</span>
            <span className="gradient-text ml-1">GRAB</span>
          </div>

          <p className="text-sm sm:text-base font-semibold text-[var(--vg-text-secondary)]">
            Fast. Simple. Powerful.
          </p>

          <p className="text-xs sm:text-sm text-[var(--vg-text-muted)] max-w-[280px] mx-auto leading-relaxed pt-1">
            Download your favorite videos in highest quality directly to your device storage.
          </p>
        </div>

        {/* 3 Value Badges */}
        <div className="grid grid-cols-3 gap-2 w-full pt-2">
          <div className="p-3 rounded-2xl bg-[var(--vg-card)] border border-[var(--vg-border)] shadow-sm text-center">
            <Zap size={18} className="text-[#00B8FF] mx-auto mb-1.5" />
            <p className="text-[11px] font-bold text-[var(--vg-text-primary)]">Lightning</p>
            <p className="text-[9px] text-[var(--vg-text-muted)] mt-0.5">Fast Stream</p>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--vg-card)] border border-[var(--vg-border)] shadow-sm text-center">
            <Film size={18} className="text-[#563BFF] mx-auto mb-1.5" />
            <p className="text-[11px] font-bold text-[var(--vg-text-primary)]">Up to 4K</p>
            <p className="text-[9px] text-[var(--vg-text-muted)] mt-0.5">Ultra HD</p>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--vg-card)] border border-[var(--vg-border)] shadow-sm text-center">
            <ShieldCheck size={18} className="text-emerald-500 mx-auto mb-1.5" />
            <p className="text-[11px] font-bold text-[var(--vg-text-primary)]">100% Free</p>
            <p className="text-[9px] text-[var(--vg-text-muted)] mt-0.5">Private</p>
          </div>
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="w-full max-w-md mx-auto space-y-3 pb-4">
        {/* Get Started Button */}
        <button
          onClick={onStart}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-full text-base font-extrabold tracking-wide gradient-btn shadow-2xl active:scale-[0.98] transition-all"
        >
          <span>Get Started</span>
          <ArrowRight size={20} strokeWidth={2.5} />
        </button>

        <p className="text-center text-[10px] text-[var(--vg-text-muted)] font-medium">
          By continuing, you agree to public media download policies.
        </p>
      </div>
    </div>
  );
}

