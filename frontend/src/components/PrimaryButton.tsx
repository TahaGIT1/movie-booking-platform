import React from 'react';
import { Ticket, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PrimaryButtonProps {
  children: React.ReactNode;
  icon?: 'ticket' | 'play' | 'none';
  onClick?: () => void;
  to?: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  icon = 'ticket',
  onClick,
  to,
  type = 'button',
  className = '',
  disabled = false,
}) => {
  const content = (
    <>
      {icon === 'ticket' && (
        <Ticket className="w-4 h-4 fill-black/30 text-black stroke-[2.2]" />
      )}
      {icon === 'play' && (
        <Play className="w-4 h-4 fill-black text-black stroke-[2]" />
      )}
      <span>{children}</span>
    </>
  );

  const baseClasses = `inline-flex items-center justify-center gap-2 bg-[#f5a623] hover:bg-[#e09612] active:bg-[#c9830c] text-black font-semibold text-sm sm:text-base px-6 py-2.5 rounded-lg shadow-lg shadow-[#f5a623]/20 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${className}`;

  if (to && !disabled) {
    return (
      <Link to={to} className={baseClasses} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={baseClasses}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  );
};
