import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const iconSize = { sm: 32, md: 40, lg: 52 }[size];
  const textClass = { sm: 'text-lg', md: 'text-2xl', lg: 'text-3xl' }[size];
  const radius = iconSize * 0.22;

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Icon */}
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: radius,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
          boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
        }}
      >
        <svg width={iconSize * 0.5} height={iconSize * 0.5} viewBox="0 0 24 24" fill="none">
          <path d="M12 4v11M8 11l4 4 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M5 19h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>

      {showText && (
        <div className="leading-none">
          <div className={`font-black tracking-tight ${textClass} text-neutral-900 dark:text-white leading-none`}>
            VID<span className="text-violet-600 dark:text-violet-400">GRAB</span>
          </div>
          {size === 'lg' && (
            <div className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 font-semibold tracking-[0.15em] uppercase">
              Video Downloader
            </div>
          )}
        </div>
      )}
    </div>
  );
}
