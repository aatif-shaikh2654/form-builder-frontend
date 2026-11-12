import React, { useId } from 'react';
import Link from 'next/link';

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export function LogoMark({ size = 32, className = '' }: LogoMarkProps) {
  const id = useId().replace(/:/g, '');
  const bgId = `fc-bg-${id}`;
  const borderId = `fc-border-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id={borderId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.10" />
        </linearGradient>
      </defs>

      {/* Rounded Squircle Badge */}
      <rect width="32" height="32" rx="7" fill={`url(#${bgId})`} />
      <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" stroke={`url(#${borderId})`} strokeWidth="1" />

      {/* FormCraft "F" Monogram Form Blocks */}
      {/* Vertical Spine */}
      <rect x="7" y="6.5" width="5" height="19" rx="2.5" fill="#FFFFFF" />

      {/* Top Horizontal Form Bar */}
      <rect x="7" y="6.5" width="18" height="5" rx="2.5" fill="#FFFFFF" />
      {/* Top bar toggle indicator */}
      <circle cx="22.5" cy="9" r="1.6" fill="#0284C7" />

      {/* Middle Horizontal Form Bar */}
      <rect x="7" y="15" width="13.5" height="5" rx="2.5" fill="#FFFFFF" />
      {/* Middle bar toggle indicator */}
      <circle cx="18" cy="17.5" r="1.5" fill="#0284C7" />
    </svg>
  );
}

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  href?: string | null;
  className?: string;
  textClassName?: string;
  badgeClassName?: string;
  showBadge?: boolean;
}

export function Logo({
  size = 'md',
  href = '/',
  className = '',
  textClassName = '',
  badgeClassName = '',
  showBadge = true,
}: LogoProps) {
  const markSize = size === 'sm' ? 24 : size === 'lg' ? 36 : 30;
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base';

  const content = (
    <div className={`inline-flex items-center gap-2.5 group cursor-pointer ${className}`}>
      <div className="transition-transform group-hover:scale-105">
        <LogoMark size={markSize} />
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className={`font-heading font-bold ${textSize} tracking-tight text-foreground group-hover:text-primary transition-colors ${textClassName}`}
        >
          FormCraft
        </span>
        {showBadge && (
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-muted text-muted-foreground border border-border ${badgeClassName}`}
          >
            Studio
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

