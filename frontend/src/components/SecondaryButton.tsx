import React from 'react';
import { Link } from 'react-router-dom';

interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  to?: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
}

export const SecondaryButton: React.FC<SecondaryButtonProps> = ({
  children,
  onClick,
  to,
  type = 'button',
  className = '',
  disabled = false,
}) => {
  const baseClasses = `inline-flex items-center justify-center bg-black/40 hover:bg-white/10 active:bg-white/15 border border-white/25 text-white font-medium text-sm sm:text-base px-6 py-2.5 rounded-lg backdrop-blur-md transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${className}`;

  if (to && !disabled) {
    return (
      <Link to={to} className={baseClasses} onClick={onClick}>
        {children}
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
      {children}
    </button>
  );
};
