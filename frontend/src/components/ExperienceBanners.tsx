import React from 'react';
import { Eye, Volume2, Maximize, Wind } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ExperienceBanners: React.FC = () => {
  const experiences = [
    {
      title: 'IMAX with Laser',
      badge: 'ULTIMATE VISUALS',
      icon: Maximize,
      desc: 'Crystal-clear 4K laser projection with customized 12-channel digital sound.',
      tag: '6 Theatres in MY',
      color: 'from-blue-600/30 via-indigo-900/20 to-black',
      border: 'hover:border-blue-500/50',
    },
    {
      title: 'Dolby Atmos Sound',
      badge: '360° AUDIO',
      icon: Volume2,
      desc: 'Sound moves around you in three-dimensional space with astonishing realism.',
      tag: '18 Theatres in MY',
      color: 'from-amber-600/30 via-yellow-900/20 to-black',
      border: 'hover:border-amber-500/50',
    },
    {
      title: 'ScreenX 270°',
      badge: 'PANORAMIC',
      icon: Eye,
      desc: 'Expands the screen onto side auditorium walls for a 270-degree viewing angle.',
      tag: '4 Theatres in MY',
      color: 'from-purple-600/30 via-pink-900/20 to-black',
      border: 'hover:border-purple-500/50',
    },
    {
      title: '4DX Motion & FX',
      badge: 'SENSORY',
      icon: Wind,
      desc: 'Motion chairs, water, wind, lightning, and scents synchronized with the film.',
      tag: '5 Theatres in MY',
      color: 'from-red-600/30 via-rose-900/20 to-black',
      border: 'hover:border-red-500/50',
    },
  ];

  return (
    <section className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
      <div className="mb-6">
        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30 mb-2 inline-block">
          AUDITORIUM INNOVATION
        </span>
        <h2 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight">
          Cutting-Edge Cinema Experiences
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          Choose your format for maximum sensory immersion.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {experiences.map((exp) => {
          const Icon = exp.icon;
          return (
            <Link
              key={exp.title}
              to="/theatres"
              className={`p-6 rounded-2xl bg-gradient-to-b ${exp.color} border border-white/10 ${exp.border} transition-all duration-300 hover:-translate-y-1 shadow-xl flex flex-col justify-between group`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-white/10 text-white group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-neutral-300">
                    {exp.badge}
                  </span>
                </div>

                <h3 className="text-lg font-heading font-bold text-white group-hover:text-[#f5a623] transition-colors mb-2">
                  {exp.title}
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {exp.desc}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-[#f5a623] font-medium">{exp.tag}</span>
                <span className="text-neutral-400 group-hover:text-white transition-colors">
                  Explore Halls →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
