'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    __pwaInstallPrompt?: any;
  }
}

export default function PwaInit() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('SW registered'))
        .catch((err) => console.warn('SW registration failed:', err));
    }

    // Detect if app is currently running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      try {
        localStorage.setItem('vidgrab_installed', 'true');
      } catch {}
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      window.__pwaInstallPrompt = e;
    };

    const handleAppInstalled = () => {
      try {
        localStorage.setItem('vidgrab_installed', 'true');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return null;
}
