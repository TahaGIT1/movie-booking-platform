import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'outline' | 'filled' | 'gold' | 'glass';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'outline',
  className = '',
}) => {
  const variantStyles = {
    outline: 'border border-white/20 bg-black/40 text-neutral-300 backdrop-blur-xs',
    filled: 'bg-white/10 text-white border border-white/10',
    gold: 'border border-[#f5a623]/60 bg-[#f5a623]/15 text-[#f5a623] font-semibold',
    glass: 'bg-black/60 backdrop-blur-md border border-white/15 text-white/90 shadow-sm',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium tracking-wide uppercase transition-colors ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
