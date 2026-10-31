import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showSubtitle?: boolean;
}

export default function Logo({ size = 'md', showText = true, showSubtitle = false }: LogoProps) {
  const iconSize = { sm: 34, md: 44, lg: 56 }[size];
  const textClass = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' }[size];

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Icon: Gradient Play Button with Download Arrow */}
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{
          width: iconSize,
          height: iconSize,
        }}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 100 100"
          fill="none"
          className="filter drop-shadow-[0_4px_12px_rgba(86,59,255,0.45)]"
        >
          <defs>
            <linearGradient id="logo-icon-grad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#00B8FF" />
              <stop offset="50%" stop-color="#563BFF" />
              <stop offset="100%" stop-color="#DB20E8" />
            </linearGradient>
          </defs>

          {/* Rounded Play Triangle */}
          <path
            d="M26 20C26 14 32.8 10.4 37.8 13.8L82.2 43.8C86.8 46.9 86.8 53.1 82.2 56.2L37.8 86.2C32.8 89.6 26 86 26 80V20Z"
            fill="url(#logo-icon-grad)"
          />

          {/* Download Arrow Stem & Head */}
          <path
            d="M51 35C51 33.6 52.1 32.5 53.5 32.5C54.9 32.5 56 33.6 56 35V53.5L61.2 48.3C62.2 47.3 63.8 47.3 64.8 48.3C65.8 49.3 65.8 50.9 64.8 51.9L55.3 61.4C54.3 62.4 52.7 62.4 51.7 61.4L42.2 51.9C41.2 50.9 41.2 49.3 42.2 48.3C43.2 47.3 44.8 47.3 45.8 48.3L51 53.5V35Z"
            fill="#FFFFFF"
          />
          {/* Download Tray Bracket */}
          <path
            d="M41 63.5C39.6 63.5 38.5 64.6 38.5 66C38.5 67.4 39.6 68.5 41 68.5H66C67.4 68.5 68.5 67.4 68.5 66C68.5 64.6 67.4 63.5 66 63.5H62V66H45V63.5H41Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>

      {showText && (
        <div className="leading-tight">
          <div className={`font-black tracking-tight ${textClass} leading-none flex items-center`}>
            <span className="text-[var(--vg-text-primary)]">VID</span>
            <span className="gradient-text font-black ml-0.5">GRAB</span>
          </div>
          {showSubtitle && (
            <p className="text-[10px] font-semibold text-[var(--vg-text-muted)] tracking-wider uppercase mt-1">
              Fast • Simple • Powerful
            </p>
          )}
        </div>
      )}
    </div>
  );
}
