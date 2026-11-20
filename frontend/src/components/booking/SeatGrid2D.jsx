import React, { useMemo } from 'react';

/**
 * Flat seat map generated from the same layout as the 3D theatre.
 * Used on narrow screens, when WebGL is unavailable, or when the user picks "2D".
 */
export const SeatGrid2D = ({ layout, seatClasses, occupiedSet, selectedSeats, onToggle }) => {
    const classById = useMemo(() => new Map(seatClasses.map((c) => [c.id, c])), [seatClasses]);
    const rows = useMemo(() => {
        const map = new Map();
        layout.seats.forEach((s) => {
            if (!map.has(s.row)) map.set(s.row, []);
            map.get(s.row).push(s);
        });
        return layout.rows.map((r) => ({ ...r, seats: map.get(r.label) || [] }));
    }, [layout]);
    const selected = useMemo(() => new Set(selectedSeats), [selectedSeats]);

    return (
        <div className="pt-4 border-t border-white/10">
            <div className="w-3/4 max-w-md mx-auto mb-8 text-center">
                <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-[#f5a623] to-transparent rounded-full shadow-[0_0_15px_#f5a623]" />
                <span className="text-[11px] uppercase font-mono tracking-widest text-neutral-500 mt-2 block">AUDITORIUM SCREEN</span>
            </div>

            <div className="overflow-x-auto pb-4">
                <div className="flex flex-col items-center gap-1.5 min-w-max mx-auto px-2">
                    {rows.map((row, i) => {
                        const cls = classById.get(row.classId);
                        const startsTier = i > 0 && rows[i - 1].tier !== row.tier;
                        return (
                            <React.Fragment key={row.label}>
                                {startsTier && (
                                    <div className="text-[10px] uppercase tracking-widest text-purple-300/70 font-mono py-2">Balcony</div>
                                )}
                                <div className="flex items-center gap-2">
                                    <span className="w-4 text-[11px] font-mono text-neutral-500 text-center font-bold">{row.label}</span>
                                    <div className="flex gap-1">
                                        {row.seats.map((seat, idx) => {
                                            const isOccupied = occupiedSet.has(seat.id);
                                            const isSelected = selected.has(seat.id);
                                            const prev = row.seats[idx - 1];
                                            const gap = prev && prev.block !== seat.block;
                                            const width = seat.recliner ? 'w-11' : 'w-6 sm:w-7';
                                            const style = !isOccupied && !isSelected ? { borderColor: `${cls.color}88`, color: cls.color } : undefined;
                                            return (
                                                <button
                                                    key={seat.id}
                                                    type="button"
                                                    disabled={isOccupied}
                                                    onClick={() => onToggle(seat.id)}
                                                    title={`${seat.id} · ${cls.name} (₹${cls.price})`}
                                                    aria-label={`Row ${seat.row} seat ${seat.number}, ${cls.name}, ${isOccupied ? 'booked' : isSelected ? 'selected' : 'available'}`}
                                                    aria-pressed={isSelected}
                                                    style={style}
                                                    className={`${width} ${gap ? 'ml-3' : ''} h-6 sm:h-7 rounded-md text-[10px] font-bold flex items-center justify-center transition-colors border ${
                                                        isOccupied
                                                            ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed border-white/5'
                                                            : isSelected
                                                            ? 'bg-teal-400 text-black border-teal-200 shadow-[0_0_10px_#2dd4bf] cursor-pointer'
                                                            : 'bg-white/5 hover:bg-white/15 cursor-pointer'
                                                    }`}
                                                >
                                                    {seat.number}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-4 text-xs text-neutral-400">
                {seatClasses.map((cls) => (
                    <div key={cls.id} className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded border-2" style={{ borderColor: cls.color }} />
                        <span>{cls.name} (₹{cls.price})</span>
                    </div>
                ))}
                <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-teal-400" />
                    <span className="text-white font-medium">Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-neutral-800 border border-white/5" />
                    <span>Booked</span>
                </div>
            </div>
        </div>
    );
};
