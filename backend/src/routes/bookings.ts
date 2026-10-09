import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { bookingsStore } from '../store/bookingsStore.js';

export const bookingsRouter = Router();

const BookingSchema = z.object({
  mediaId: z.string().min(1, 'Media ID is required'),
  theatreName: z.string().min(1, 'Theatre name is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Showtime is required'),
  seats: z.array(z.string()).min(1, 'At least one seat must be selected'),
  totalAmount: z.number().positive('Total amount must be greater than 0'),
  customerName: z.string().optional(),
  customerEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
});

// GET /api/bookings
bookingsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const bookings = await bookingsStore.getAll();
    res.json(bookings);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/occupied-seats?theatre=...&date=...&time=...
bookingsRouter.get('/occupied-seats', async (req: Request, res: Response) => {
  const { theatre, date, time } = req.query;

  if (typeof theatre !== 'string' || typeof date !== 'string' || typeof time !== 'string') {
    res.status(400).json({ error: 'theatre, date, and time query parameters are required' });
    return;
  }

  try {
    const occupiedSeats = await bookingsStore.getOccupiedSeats(theatre, date, time);
    res.json({ occupiedSeats });
  } catch (err) {
    console.error('Error fetching occupied seats:', err);
    res.status(500).json({ error: 'Failed to fetch occupied seats' });
  }
});

// GET /api/bookings/:orderId
bookingsRouter.get('/:orderId', async (req: Request, res: Response) => {
  const { orderId } = req.params;
  try {
    const booking = await bookingsStore.getById(orderId);
    if (!booking) {
      res.status(404).json({ error: `Booking with order ID '${orderId}' not found` });
      return;
    }
    res.json(booking);
  } catch (err) {
    console.error('Error fetching booking:', err);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// POST /api/bookings
bookingsRouter.post('/', async (req: Request, res: Response) => {
  const parsed = BookingSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: 'Invalid booking data',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const payload = parsed.data;

  try {
    // Check if seats are already occupied
    const occupied = await bookingsStore.getOccupiedSeats(
      payload.theatreName,
      payload.date,
      payload.time
    );

    const conflicting = payload.seats.filter((s) => occupied.includes(s));
    if (conflicting.length > 0) {
      res.status(409).json({
        error: `Seats already reserved: ${conflicting.join(', ')}`,
        conflictingSeats: conflicting,
      });
      return;
    }

    const record = await bookingsStore.create(payload);

    res.status(201).json({
      success: true,
      orderId: record.orderId,
      booking: record,
    });
  } catch (err) {
    console.error('Failed to create booking:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});
