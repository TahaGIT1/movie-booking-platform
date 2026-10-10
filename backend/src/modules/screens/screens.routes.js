import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { createScreenSchema, createSeatsSchema } from './screens.schema.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const router = Router();

router.use(authenticate, requirePermission(['MANAGE_SCREEN', 'MANAGE_SCREENS']), enforceTenantScope);

// List all screens for manager's theatre
router.get('/', async (req, res, next) => {
  try {
    const screens = await prisma.screen.findMany({
      where: { theatreId: req.tenantId },
      include: {
        _count: {
          select: { seats: true, shows: true }
        }
      },
      orderBy: { screenNumber: 'asc' }
    });
    res.json({ success: true, data: screens });
  } catch (err) { next(err); }
});

// Get single screen with full seat grid
router.get('/:id', async (req, res, next) => {
  try {
    const screen = await prisma.screen.findUnique({
      where: { id: req.params.id },
      include: {
        seats: {
          orderBy: [
            { gridY: 'asc' },
            { gridX: 'asc' }
          ]
        },
        _count: {
          select: { shows: true }
        }
      }
    });

    if (!screen || screen.theatreId !== req.tenantId) {
      throw new AppError(404, 'Screen not found in your theatre');
    }

    res.json({ success: true, data: screen });
  } catch (err) { next(err); }
});

// Create new screen
router.post('/', validateRequest(createScreenSchema), async (req, res, next) => {
  try {
    const { screenNumber, name, totalCapacity, soundSystem, supportedFormats, rows, cols } = req.body;

    const screen = await prisma.screen.create({
      data: {
        theatreId: req.tenantId,
        screenNumber,
        name,
        totalCapacity: totalCapacity || (rows && cols ? rows * cols : 100),
        soundSystem: soundSystem || 'Dolby Atmos 7.1',
        supportedFormats: supportedFormats || ['TWO_D']
      }
    });

    // Optionally auto-generate seats if rows and cols provided
    if (rows && cols && rows > 0 && cols > 0) {
      const seats = [];
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let i = 0; i < rows; i++) {
        const rowLabel = letters[i] || `R${i + 1}`;
        let tier = 'NORMAL';
        if (i >= rows - 2) tier = 'RECLINER';
        else if (i >= rows - 5) tier = 'PREMIUM';

        for (let j = 1; j <= cols; j++) {
          seats.push({
            screenId: screen.id,
            rowLabel,
            seatNumber: j,
            tier,
            isAccessible: i === 0 && (j === 1 || j === cols),
            gridX: j,
            gridY: i
          });
        }
      }
      await prisma.seat.createMany({ data: seats, skipDuplicates: true });
    }

    const completeScreen = await prisma.screen.findUnique({
      where: { id: screen.id },
      include: { _count: { select: { seats: true } } }
    });

    res.status(201).json({ success: true, data: completeScreen });
  } catch (err) { next(err); }
});

// Update screen details
router.patch('/:id', async (req, res, next) => {
  try {
    const screen = await prisma.screen.findUnique({ where: { id: req.params.id } });
    if (!screen || screen.theatreId !== req.tenantId) {
      throw new AppError(404, 'Screen not found');
    }

    const { name, screenNumber, soundSystem, supportedFormats, totalCapacity, isActive } = req.body;

    const updated = await prisma.screen.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(screenNumber && { screenNumber }),
        ...(soundSystem !== undefined && { soundSystem }),
        ...(supportedFormats && { supportedFormats }),
        ...(totalCapacity !== undefined && { totalCapacity }),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({ success: true, data: updated, message: 'Screen updated successfully' });
  } catch (err) { next(err); }
});

// Configure or generate seats layout for a screen
router.post('/:id/seats', validateRequest(createSeatsSchema), async (req, res, next) => {
  try {
    const screen = await prisma.screen.findUnique({ where: { id: req.params.id } });
    if (!screen || screen.theatreId !== req.tenantId) throw new AppError(404, 'Screen not found');

    const { rows, cols, customLayout, rowTiers, aisleCols } = req.body;

    const seatsToSave = [];
    if (customLayout && Array.isArray(customLayout) && customLayout.length > 0) {
      // Exclude cells designated as pathways/walkways from bookable seats
      const validSeats = customLayout.filter(item => !item.isPathway && item.type !== 'PATHWAY');
      for (const item of validSeats) {
        seatsToSave.push({
          screenId: screen.id,
          rowLabel: item.rowLabel,
          seatNumber: item.seatNumber,
          tier: item.tier || 'NORMAL',
          isAccessible: !!item.isAccessible,
          isBroken: !!item.isBroken,
          gridX: item.gridX,
          gridY: item.gridY
        });
      }
    } else if (rows && cols) {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const aisles = Array.isArray(aisleCols) ? aisleCols : [];
      for (let i = 0; i < rows; i++) {
        const rowLabel = letters[i] || `R${i + 1}`;
        const tier = (rowTiers && rowTiers[rowLabel]) || (i >= rows - 2 ? 'RECLINER' : i >= rows - 5 ? 'PREMIUM' : 'NORMAL');
        let currentSeatNum = 1;
        
        for (let j = 1; j <= cols; j++) {
          if (aisles.includes(j)) {
            // Aisle / Pathway gap - don't insert seat
            continue;
          }
          seatsToSave.push({
            screenId: screen.id,
            rowLabel,
            seatNumber: currentSeatNum++,
            tier,
            isAccessible: i === 0 && (currentSeatNum === 2 || j === cols),
            gridX: j,
            gridY: i
          });
        }
      }
    }

    // Check existing shows on this screen
    const existingShows = await prisma.show.findMany({
      where: { screenId: screen.id },
      select: { id: true }
    });

    const bookingCount = await prisma.booking.count({
      where: { show: { screenId: screen.id }, status: 'CONFIRMED' }
    });

    if (bookingCount === 0) {
      // Safe to delete show_seat_status and cleanly recreate seats
      if (existingShows.length > 0) {
        await prisma.showSeatStatus.deleteMany({
          where: { showId: { in: existingShows.map(s => s.id) } }
        });
      }

      await prisma.seat.deleteMany({ where: { screenId: screen.id } });

      if (seatsToSave.length > 0) {
        await prisma.seat.createMany({ data: seatsToSave, skipDuplicates: true });
      }

      // Re-create show_seat_status for existing scheduled shows
      if (existingShows.length > 0 && seatsToSave.length > 0) {
        const createdSeats = await prisma.seat.findMany({ where: { screenId: screen.id } });
        const statuses = [];
        for (const show of existingShows) {
          for (const s of createdSeats) {
            statuses.push({
              showId: show.id,
              seatId: s.id,
              status: s.isBroken ? 'UNAVAILABLE' : 'AVAILABLE'
            });
          }
        }
        await prisma.showSeatStatus.createMany({ data: statuses, skipDuplicates: true });
      }
    } else {
      // Confirmed bookings exist: upsert seats in place to preserve references
      for (const s of seatsToSave) {
        await prisma.seat.upsert({
          where: {
            screenId_rowLabel_seatNumber: {
              screenId: screen.id,
              rowLabel: s.rowLabel,
              seatNumber: s.seatNumber
            }
          },
          update: {
            tier: s.tier,
            isAccessible: s.isAccessible,
            isBroken: s.isBroken,
            gridX: s.gridX,
            gridY: s.gridY
          },
          create: s
        });
      }
    }

    await prisma.screen.update({
      where: { id: screen.id },
      data: { totalCapacity: seatsToSave.length }
    });

    res.status(201).json({ 
      success: true, 
      message: `Successfully configured ${seatsToSave.length} seats for this auditorium`,
      totalCapacity: seatsToSave.length
    });
  } catch (err) { next(err); }
});

// Delete a screen
router.delete('/:id', async (req, res, next) => {
  try {
    const screen = await prisma.screen.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { shows: true } } }
    });
    if (!screen || screen.theatreId !== req.tenantId) throw new AppError(404, 'Screen not found');

    if (screen._count.shows > 0) {
      throw new AppError(400, 'Cannot delete screen with scheduled shows. Deactivate it instead.');
    }

    await prisma.seat.deleteMany({ where: { screenId: screen.id } });
    await prisma.screen.delete({ where: { id: screen.id } });

    res.json({ success: true, message: 'Screen deleted successfully' });
  } catch (err) { next(err); }
});

export default router;