import React, { useState } from 'react';
import { ArrowLeft, CalendarClock, ChevronDown, LayoutGrid } from 'lucide-react';
import { showSubtitleParts } from './lib/showInfo';

/** Header: back, title, real show subtitle, show switcher and 2D toggle. */
export function TheatreHeader({ flow, onBack, onSwitchTo2D }) {
    const { item, theatres, selectedTheatre, setSelectedTheatre, dates, selectedDate, setSelectedDate, availableShowtimes, selectedTime, setSelectedTime } = flow;
    const [pickerOpen, setPickerOpen] = useState(false);
    const subtitle = showSubtitleParts(flow).join(' · ');

    return (
        <header className="relative z-30 flex items-center gap-2 sm:gap-3 px-2 sm:px-6 h-14 sm:h-16 shrink-0 border-b border-white/[0.06] bg-[#0b0d16]/90 backdrop-blur-md">
            <button type="button" onClick={onBack} aria-label="Go back" className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-300 hover:bg-white/10 hover:text-white cursor-pointer">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
                <h1 className="font-heading font-black uppercase tracking-wide text-white text-sm sm:text-lg leading-tight truncate">{item.title}</h1>
                <p className="text-[11px] sm:text-xs text-neutral-400 truncate">{subtitle}</p>
            </div>

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setPickerOpen((o) => !o)}
                    aria-expanded={pickerOpen}
                    aria-label="Change show"
                    className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-full border border-white/15 bg-white/5 text-xs text-neutral-200 hover:bg-white/10 cursor-pointer"
                >
                    <CalendarClock className="w-4 h-4 sm:hidden" />
                    <span className="hidden sm:inline">Change show</span>
                    <ChevronDown className={`hidden sm:block w-3.5 h-3.5 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
                </button>
                {pickerOpen && (
                    <div className="fixed inset-x-3 top-[60px] max-h-[calc(100dvh-72px)] overflow-y-auto sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-[380px] sm:max-h-none p-4 rounded-2xl border border-white/10 bg-[#111427]/95 backdrop-blur-xl shadow-2xl space-y-4">
                        <label className="block">
                            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Theatre</span>
                            <select
                                value={selectedTheatre}
                                onChange={(e) => setSelectedTheatre(e.target.value)}
                                className="mt-1 w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#f5a623]"
                            >
                                {theatres.map((t) => (
                                    <option key={t.id || t.name} value={t.name} className="bg-[#11131c]">
                                        {t.name} {t.city ? `(${t.city})` : ''}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div>
                            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Date</span>
                            <div className="mt-1 grid grid-cols-4 gap-1.5">
                                {dates.map((d) => (
                                    <button
                                        key={d.full}
                                        type="button"
                                        onClick={() => setSelectedDate(d.full)}
                                        className={`py-1.5 rounded-lg text-center border text-[11px] cursor-pointer ${selectedDate === d.full ? 'border-[#f5a623] bg-[#f5a623]/15 text-white' : 'border-white/10 text-neutral-400 hover:border-white/25'}`}
                                    >
                                        <div className="text-[9px] opacity-70">{d.label}</div>
                                        <div className="font-bold">{d.date}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Showtime</span>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                                {availableShowtimes.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setSelectedTime(t)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${selectedTime === t ? 'border-[#f5a623] bg-[#f5a623] text-black' : 'border-white/15 text-neutral-300 hover:border-white/30'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button type="button" onClick={() => setPickerOpen(false)} className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer">
                            Done
                        </button>
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={onSwitchTo2D}
                title="Switch to the flat seat map"
                aria-label="Switch to the 2D seat map"
                className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-full border border-white/15 bg-white/5 text-xs text-neutral-300 hover:bg-white/10 cursor-pointer"
            >
                <LayoutGrid className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">2D map</span>
            </button>
        </header>
    );
}
