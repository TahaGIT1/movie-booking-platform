const fs = require('fs');
let content = fs.readFileSync('src/modules/bookings/bookings.routes.js', 'utf8');

// Find the index of router.post('/:id/cancel'
const index = content.indexOf('router.post(\'/:id/cancel\'');
if (index !== -1) {
  content = content.substring(0, index);
  
  const cancelCode = \
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { seats: true }
    });

    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.userId !== userId) throw new AppError(403, 'Unauthorized');
    if (booking.status !== 'CONFIRMED') throw new AppError(400, 'Only confirmed bookings can be cancelled');
    if (booking.qrScanStatus === 'USED') throw new AppError(400, 'Cannot cancel a used ticket');

    await prisma.\\(async (tx) => {
      // Release seats
      const sortedSeatIds = booking.seats.map(s => s.seatId).sort();
      for (const seatId of sortedSeatIds) {
        await tx.\\\\\
          UPDATE show_seat_status
          SET status = 'AVAILABLE', locked_by_user_id = NULL, lock_expires_at = NULL
          WHERE show_id = \\\::uuid AND seat_id = \\\::uuid
        \\\;
      }

      await tx.refund.create({
        data: {
          bookingId,
          amountCents: booking.totalAmountCents,
          reason: 'Customer requested cancellation',
          status: 'SUCCESS'
        }
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' }
      });
    });

    for (const bs of booking.seats) {
      io.to(\\\show:\\\\\\).emit('seat:released', { seatId: bs.seatId });
    }

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (err) { next(err); }
});

export default router;
\;
  fs.writeFileSync('src/modules/bookings/bookings.routes.js', content + cancelCode);
  console.log('Fixed');
}
