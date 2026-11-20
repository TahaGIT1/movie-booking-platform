/** Checkout maths for the 3D booking flow (₹). */

export const CONVENIENCE_FEE_RATE = 0.06;
export const GST_ON_FEE_RATE = 0.18;

export const SNACKS = [
    { id: 'popcorn', name: 'Salted popcorn (L)', price: 290 },
    { id: 'combo', name: 'Popcorn + 2 Coke combo', price: 520 },
    { id: 'nachos', name: 'Cheese nachos', price: 260 },
];

export const formatINR = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/**
 * @param {string[]} seatIds
 * @param {Map<string, object>} seatById
 * @param {object[]} seatClasses
 * @param {Record<string, number>} snackQty
 */
export function buildCheckoutSummary(seatIds, seatById, seatClasses, snackQty = {}) {
    const lines = seatClasses
        .map((cls) => {
            const count = seatIds.filter((id) => seatById.get(id)?.classId === cls.id).length;
            return { id: cls.id, label: `${cls.name} × ${count}`, amount: count * cls.price, count };
        })
        .filter((l) => l.count > 0)
        .reverse(); // cheapest first, like the reference checkout

    const snackLines = SNACKS.filter((s) => (snackQty[s.id] || 0) > 0).map((s) => ({
        id: s.id,
        label: `${s.name} × ${snackQty[s.id]}`,
        amount: s.price * snackQty[s.id],
    }));

    const ticketTotal = lines.reduce((sum, l) => sum + l.amount, 0);
    const snackTotal = snackLines.reduce((sum, l) => sum + l.amount, 0);
    const convenienceFee = Math.round(ticketTotal * CONVENIENCE_FEE_RATE);
    const gst = Math.round(convenienceFee * GST_ON_FEE_RATE);
    return {
        lines,
        snackLines,
        ticketTotal,
        snackTotal,
        convenienceFee,
        gst,
        total: ticketTotal + snackTotal + convenienceFee + gst,
    };
}
