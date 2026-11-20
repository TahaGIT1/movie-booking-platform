/**
 * Auditorium seat layout shared by the 3D theatre and the 2D fallback grid.
 *
 * Seat ids keep the existing `${row}${number}` format (e.g. "B4", "M12") so the
 * occupied-seats endpoint, createBooking and the local booked-seat cache keep
 * working unchanged. Rows run front (A, nearest the screen) to back.
 */

/** Seat classes, front to back. Prices are defaults; show pricing overrides them. */
export const SEAT_CLASSES = [
    {
        id: 'royal',
        name: 'Royal Recliner',
        description: 'Motorised recliners · F&B to seat',
        color: '#f5b52e',
        price: 550,
        backendTier: 'RECLINER',
        recliner: true,
    },
    {
        id: 'balcony',
        name: 'Balcony',
        description: 'Elevated view · centre aligned',
        color: '#a855f7',
        price: 320,
        backendTier: null,
    },
    {
        id: 'prime',
        name: 'Prime',
        description: 'Sweet spot for sound & picture',
        color: '#22c55e',
        price: 240,
        backendTier: 'PREMIUM',
    },
    {
        id: 'classic',
        name: 'Classic',
        description: 'Front rows · big screen energy',
        color: '#3b82f6',
        price: 160,
        backendTier: 'NORMAL',
    },
];

/**
 * Row plan for a ~300 seat hall. `seats` is scaled by the screen capacity.
 * `tier` is the physical level: stalls (raked floor) or balcony (upper tier).
 */
const BASE_ROW_PLAN = [
    { classId: 'classic', count: 4, seats: 18, tier: 'stalls' },
    { classId: 'prime', count: 6, seats: 22, tier: 'stalls' },
    { classId: 'royal', count: 2, seats: 10, tier: 'stalls' },
    { classId: 'balcony', count: 4, seats: 20, tier: 'balcony' },
];
const BASE_CAPACITY = 304;

/* Geometry constants (scene units ~ metres). */
export const STALLS_FRONT_Z = -8;
const ROW_DEPTH = 1.15;
const RECLINER_ROW_DEPTH = 1.7;
const STALL_RISE = 0.34;
const SEAT_PITCH = 0.74;
const RECLINER_PITCH = 1.08;
const PAIR_GAP = 0.36;
const AISLE_GAP = 1.1;
export const CURVE_RADIUS = 26;
const BALCONY_SETBACK = 2.4;
const BALCONY_LIFT = 2.6;
const BALCONY_RISE = 0.5;
export const CURVE_CENTER_Z = STALLS_FRONT_Z - CURVE_RADIUS;

const rowLabel = (index) => String.fromCharCode(65 + index);

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

/** Horizontal offsets (arc length) of each seat in a row, including aisles/pairs. */
function seatOffsets(count, recliner) {
    const offsets = [];
    let cursor = 0;
    const aisleAfter = recliner ? [] : [Math.round(count * 0.25), Math.round(count * 0.75)];
    for (let i = 0; i < count; i += 1) {
        if (i > 0) {
            if (recliner) {
                cursor += RECLINER_PITCH + (i % 2 === 0 ? PAIR_GAP : 0);
            } else {
                cursor += SEAT_PITCH + (aisleAfter.includes(i) && count >= 14 ? AISLE_GAP : 0);
            }
        }
        offsets.push(cursor);
    }
    const mid = cursor / 2;
    return offsets.map((o) => o - mid);
}

/** Which block (left / centre / right) a seat sits in, so Best-N never spans an aisle. */
function blockIndex(i, count, recliner) {
    if (recliner) return Math.floor(i / 2);
    if (count < 14) return 0;
    const a = Math.round(count * 0.25);
    const b = Math.round(count * 0.75);
    return i < a ? 0 : i < b ? 1 : 2;
}

/**
 * Builds the seat list for a screen.
 * @param {{ capacity?: number }} [opts]
 * @returns {{ seats: Array<object>, rows: Array<object>, bounds: object }}
 */
export function buildSeatLayout(opts = {}) {
    const capacity = Number(opts.capacity) || BASE_CAPACITY;
    const scale = clamp(capacity / BASE_CAPACITY, 0.7, 1.25);
    const seats = [];
    const rows = [];

    let rowIndex = 0;
    let depth = 0; // distance behind the front stall row
    let y = 0.2;
    let lastTier = 'stalls';
    let balconyFrontDepth = null;

    BASE_ROW_PLAN.forEach((group) => {
        const cls = SEAT_CLASSES.find((c) => c.id === group.classId);
        const recliner = Boolean(cls.recliner);
        for (let r = 0; r < group.count; r += 1) {
            if (group.tier === 'balcony' && lastTier !== 'balcony') {
                depth += BALCONY_SETBACK;
                y += BALCONY_LIFT;
                balconyFrontDepth = depth;
            } else if (rowIndex > 0) {
                depth += recliner ? RECLINER_ROW_DEPTH : ROW_DEPTH;
                y += group.tier === 'balcony' ? BALCONY_RISE : STALL_RISE;
            }
            lastTier = group.tier;

            let count = Math.round(group.seats * scale);
            if (recliner && count % 2 === 1) count += 1; // recliners come in pairs
            const label = rowLabel(rowIndex);
            const radius = CURVE_RADIUS + depth;
            const offsets = seatOffsets(count, recliner);

            const rowSeats = offsets.map((arc, i) => {
                const theta = arc / radius;
                const number = i + 1;
                return {
                    id: `${label}${number}`,
                    row: label,
                    rowIndex,
                    number,
                    classId: cls.id,
                    tier: group.tier,
                    recliner,
                    pairId: recliner ? `${label}-${Math.floor(i / 2)}` : null,
                    block: blockIndex(i, count, recliner),
                    position: [radius * Math.sin(theta), y, CURVE_CENTER_Z + radius * Math.cos(theta)],
                    rotationY: theta,
                };
            });
            seats.push(...rowSeats);
            rows.push({ label, rowIndex, classId: cls.id, tier: group.tier, y, depth, count, recliner });
            rowIndex += 1;
        }
    });

    const backZ = STALLS_FRONT_Z + depth;
    return {
        seats,
        rows,
        bounds: {
            frontZ: STALLS_FRONT_Z,
            backZ,
            topY: y,
            balconyFrontZ: balconyFrontDepth === null ? backZ : STALLS_FRONT_Z + balconyFrontDepth,
            balconyFloorY: rows.find((r) => r.tier === 'balcony')?.y ?? y,
            stallsTopY: rows.filter((r) => r.tier === 'stalls').slice(-1)[0]?.y ?? y,
        },
    };
}

/**
 * Applies show tier pricing (Show.baseTierPricing: NORMAL / PREMIUM / RECLINER) to the
 * default class prices. Values over 2000 are treated as paise/cents.
 */
export function resolveSeatClasses(tierPricing) {
    if (!tierPricing || typeof tierPricing !== 'object') return SEAT_CLASSES;
    const read = (key) => {
        const n = Number(tierPricing[key]);
        if (!Number.isFinite(n) || n <= 0) return null;
        return n > 2000 ? Math.round(n / 100) : n;
    };
    const premium = read('PREMIUM');
    const recliner = read('RECLINER');
    return SEAT_CLASSES.map((cls) => {
        if (cls.backendTier) {
            const price = read(cls.backendTier);
            return price ? { ...cls, price } : cls;
        }
        // Balcony has no backend tier: price it between Prime and Royal when both are known.
        if (premium && recliner) return { ...cls, price: Math.round((premium + recliner) / 2) };
        return cls;
    });
}

/**
 * Picks the best `count` contiguous available seats: same row, same block,
 * as close to the centre as possible, preferring Prime then Balcony rows.
 */
export function pickBestSeats(seats, unavailable, count) {
    if (count <= 0) return [];
    const classRank = { prime: 0, balcony: 1, royal: 2, classic: 3 };
    const byRow = new Map();
    seats.forEach((s) => {
        if (!byRow.has(s.row)) byRow.set(s.row, []);
        byRow.get(s.row).push(s);
    });

    let best = null;
    byRow.forEach((rowSeats) => {
        const sorted = [...rowSeats].sort((a, b) => a.number - b.number);
        const first = sorted[0];
        if (first.recliner && count !== 2) return; // couple recliners are sold as a pair
        const classRows = seats.filter((s) => s.classId === first.classId && s.number === 1);
        const posInClass = classRows.findIndex((s) => s.row === first.row);
        // Middle-to-back rows of a class are the sweet spot.
        const rowScore = classRank[first.classId] * 10 + Math.abs(posInClass - classRows.length * 0.6);
        for (let i = 0; i + count <= sorted.length; i += 1) {
            const window = sorted.slice(i, i + count);
            const ok = window.every((s) => !unavailable.has(s.id) && s.block === window[0].block);
            if (!ok) continue;
            const centreX = window.reduce((sum, s) => sum + s.position[0], 0) / count;
            const score = rowScore + Math.abs(centreX) * 0.6;
            if (!best || score < best.score) best = { score, ids: window.map((s) => s.id) };
        }
    });
    return best ? best.ids : [];
}
