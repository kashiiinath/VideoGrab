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
      {/* Icon: New VIDGRAB Frame + Arrow + Play Button */}
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
            <linearGradient id="logo-icon-grad-v2" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00D2FF" />
              <stop offset="50%" stopColor="#5B38FF" />
              <stop offset="100%" stopColor="#E024D6" />
            </linearGradient>
            <linearGradient id="logo-play-grad-v2" x1="35" y1="35" x2="65" y2="65" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="50%" stopColor="#5336FF" />
              <stop offset="100%" stopColor="#E226D8" />
            </linearGradient>
          </defs>

          {/* Outer Frame with Loop into Downward Arrow */}
          <path
            d="M26 34C26 22 35 13 47 13H76C82.6 13 88 18.4 88 25V66L97 66L82 85L67 66L76 66V25H47C42 25 38 29 38 34V70C38 75 42 79 47 79H72V91H47C35 91 26 82 26 70V34Z"
            fill="url(#logo-icon-grad-v2)"
          />

          {/* Center Play Button Triangle with Rounded Corners */}
          <path
            d="M43 38C43 34 47.4 31.6 50.8 33.6L71.8 46.6C75 48.6 75 53.4 71.8 55.4L50.8 68.4C47.4 70.4 43 68 43 64V38Z"
            fill="url(#logo-play-grad-v2)"
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
