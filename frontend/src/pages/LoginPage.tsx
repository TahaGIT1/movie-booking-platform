import React from 'react';
import { AuthCard } from '../components/AuthCard';

export const LoginPage: React.FC = () => {
  return (
    <div className="relative min-h-[calc(100vh-5rem)] w-full flex items-center justify-center p-4 overflow-hidden">
      {/* Cinematic Batman background image with moody overlay matching reference */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/backgrounds/login_hero.jpg"
          alt="Cinema Background"
          className="w-full h-full object-cover object-center filter brightness-60 contrast-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/backgrounds/batman_hero.jpg';
          }}
        />
        {/* Dark vignette layers */}
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0e] via-black/40 to-black/80" />
      </div>

      {/* Centered Glassmorphic Login Card */}
      <div className="relative z-10 w-full flex items-center justify-center py-8">
        <AuthCard />
      </div>
    </div>
  );
};
