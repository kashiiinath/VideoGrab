'use client';

import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // 1.5s display + 300ms fade transition
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(onComplete, 350);
    }, 1800);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between p-8 transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: 'var(--vg-bg)' }}
    >
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[20%] left-[-10%] w-[450px] h-[450px] rounded-full bg-[#00B8FF]/20 blur-[130px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[-10%] w-[450px] h-[450px] rounded-full bg-[#DB20E8]/20 blur-[130px] animate-pulse" />
      </div>

      <div className="flex-1" />

      {/* Center 3D Logo & Brand Name */}
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="relative group">
          {/* Glowing backdrops */}
          <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-[#00B8FF] via-[#563BFF] to-[#DB20E8] opacity-60 blur-2xl animate-pulse" />
          
          <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-[#0D1020] to-[#191D31] border border-[var(--vg-border)] p-4 shadow-2xl flex items-center justify-center transform transition-transform duration-700 scale-100">
            <img
              src="/logo/vidgrab-logo-icon.png"
              alt="VIDGRAB"
              width={100}
              height={100}
              className="w-24 h-24 object-contain filter drop-shadow-[0_8px_20px_rgba(86,59,255,0.7)]"
              draggable={false}
            />
          </div>
        </div>

        {/* Brand Name */}
        <div className="space-y-1.5 pt-2">
          <div className="font-black text-4xl sm:text-5xl tracking-tight leading-none flex items-center justify-center">
            <span className="text-[var(--vg-text-primary)]">VID</span>
            <span className="gradient-text ml-1">GRAB</span>
          </div>
          <p className="text-[11px] font-bold text-[var(--vg-text-muted)] tracking-[0.25em] uppercase pt-1">
            FAST • SIMPLE • POWERFUL
          </p>
        </div>
      </div>

      {/* Bottom Loading Indicator */}
      <div className="flex-1 flex flex-col justify-end items-center pb-8 w-full max-w-xs space-y-3">
        <div className="w-36 h-1 rounded-full bg-[var(--vg-border)] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#00B8FF] via-[#563BFF] to-[#DB20E8] rounded-full animate-[progress_1.8s_ease-in-out_infinite]" />
        </div>
        <p className="text-[10px] font-semibold text-[var(--vg-text-muted)] uppercase tracking-wider">
          Universal Video Downloader
        </p>
      </div>
    </div>
  );
}

