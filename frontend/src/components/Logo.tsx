import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showSubtitle?: boolean;
}

export default function Logo({ size = 'md', showText = true, showSubtitle = false }: LogoProps) {
  const iconSize = { sm: 32, md: 42, lg: 54 }[size];
  const textClass = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' }[size];

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Icon: Exact Master 3D VIDGRAB Logo */}
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{
          width: iconSize,
          height: iconSize,
        }}
      >
        <img
          src="/logo/vidgrab-logo-icon.png"
          alt="VIDGRAB"
          width={iconSize}
          height={iconSize}
          className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(86,59,255,0.45)]"
          draggable={false}
        />
      </div>

      {showText && (
        <div className="leading-tight">
          <div className={`font-black tracking-tight ${textClass} leading-none flex items-center`}>
            <span className="text-[var(--vg-text-primary)]">VID</span>
            <span className="gradient-text font-black ml-0.5">GRAB</span>
          </div>
          {showSubtitle && (
            <p className="text-[10px] font-semibold text-[var(--vg-text-muted)] tracking-wider uppercase mt-1">
              FAST • SIMPLE • POWERFUL
            </p>
          )}
        </div>
      )}
    </div>
  );
}
