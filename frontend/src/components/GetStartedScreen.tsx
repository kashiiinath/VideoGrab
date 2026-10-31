'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Zap, Film, ShieldCheck, Download, X } from 'lucide-react';

interface GetStartedScreenProps {
  onStart: () => void;
}

export default function GetStartedScreen({ onStart }: GetStartedScreenProps) {
  const [showInstallPopup, setShowInstallPopup] = useState(false);

  useEffect(() => {
    // Check if app is ALREADY installed or running as standalone PWA
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://'));

    const isInstalled = typeof window !== 'undefined' && localStorage.getItem('vidgrab_installed') === 'true';
    const isDismissed = typeof window !== 'undefined' && localStorage.getItem('vidgrab_install_dismissed') === 'true';

    // If app is already installed or running as standalone, NEVER show this install popup
    if (isStandalone || isInstalled || isDismissed) {
      return;
    }

    const timer = setTimeout(() => {
      setShowInstallPopup(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  async function handleDownloadApp() {
    try {
      localStorage.setItem('vidgrab_installed', 'true');
    } catch {}

    if (typeof window !== 'undefined' && window.__pwaInstallPrompt) {
      try {
        window.__pwaInstallPrompt.prompt();
        const choice = await window.__pwaInstallPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setShowInstallPopup(false);
          return;
        }
      } catch {}
    }
    // Fallback instructions if native prompt is not active or already installed
    alert(
      'To install VIDGRAB:\n\n' +
      '• Android / Chrome: Tap the top-right menu (3 dots) → "Install app" or "Add to Home screen"\n' +
      '• iPhone / Safari: Tap the Share button at the bottom → "Add to Home Screen"\n' +
      '• Desktop Chrome: Click the install icon in the address bar'
    );
    setShowInstallPopup(false);
  }

  function handleDismiss() {
    try {
      localStorage.setItem('vidgrab_install_dismissed', 'true');
    } catch {}
    setShowInstallPopup(false);
  }

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

      {/* Center Hero: Large Logo & Value Proposition */}
      <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center text-center space-y-6 px-2 py-4">
        {/* App Icon with Glowing Radiance */}
        <div className="relative group">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#00B8FF] via-[#563BFF] to-[#DB20E8] opacity-50 blur-xl group-hover:opacity-75 transition-opacity" />
          
          <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-[#0D1020] to-[#191D31] border border-[var(--vg-border)] p-3 shadow-2xl flex items-center justify-center">
            {/* Exact Master 3D VIDGRAB Logo */}
            <img
              src="/logo/vidgrab-logo-icon.png"
              alt="VIDGRAB"
              width={84}
              height={84}
              className="w-20 h-20 object-contain filter drop-shadow-[0_6px_16px_rgba(86,59,255,0.6)]"
              draggable={false}
            />
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

      {/* Pop-up Message Modal: For better performance download the app */}
      {showInstallPopup && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) handleDismiss();
          }}
          className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
        >
          <div className="w-full max-w-sm rounded-3xl border p-5 space-y-4 shadow-2xl relative bg-white/95 dark:bg-[#141728]/95 backdrop-blur-2xl border-black/[0.08] dark:border-white/[0.1] animate-in zoom-in-95 duration-300 my-auto">
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] hover:bg-neutral-500/10 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Icon & Title Header */}
            <div className="flex items-center gap-3 pr-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00B8FF]/20 to-[#DB20E8]/20 border border-[var(--vg-border)] flex items-center justify-center flex-shrink-0 shadow-sm">
                <img
                  src="/logo/vidgrab-logo-icon.png"
                  alt="VIDGRAB"
                  width={36}
                  height={36}
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[var(--vg-text-primary)]">
                  Download VIDGRAB App
                </h4>
                <p className="text-[11px] font-semibold text-[#00B8FF]">
                  Official PWA Available
                </p>
              </div>
            </div>

            {/* Message Body */}
            <p className="text-xs text-[var(--vg-text-secondary)] leading-relaxed">
              For better performance, faster downloads, and offline saving, download the app on your device.
            </p>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleDownloadApp}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-xs font-bold gradient-btn shadow-md active:scale-[0.98] transition-all"
              >
                <Download size={15} strokeWidth={2.5} />
                <span>Download App</span>
              </button>

              <button
                onClick={handleDismiss}
                className="w-full py-2.5 rounded-full text-xs font-semibold text-[var(--vg-text-muted)] hover:text-[var(--vg-text-primary)] transition-colors text-center"
              >
                Continue in Browser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

