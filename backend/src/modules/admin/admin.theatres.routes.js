import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const router = Router();

router.use(authenticate, requirePermission(['APPROVE_THEATRES', 'APPROVE_THEATRE']));

// Get all theatre applications / requests with optional status filter
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const theatres = await prisma.theatre.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
            mobileNumber: true,
            role: true,
            createdAt: true
          }
        },
        screens: {
          select: {
            id: true,
            name: true,
            supportedFormats: true,
            totalCapacity: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: theatres });
  } catch (err) { next(err); }
});

// Create a new theatre directly by Admin
router.post('/', async (req, res, next) => {
  try {
    const { 
      name, 
      legalEntityName, 
      gstNumber, 
      contactPhone, 
      contactEmail, 
      addressLine, 
      city, 
      state, 
      postalCode, 
      amenities = [], 
      status = 'ACTIVE' 
    } = req.body;

    if (!name || !addressLine || !city || !state) {
      throw new AppError(400, 'Name, address, city, and state are required', 'MISSING_FIELDS');
    }

    const theatre = await prisma.theatre.create({
      data: {
        name,
        legalEntityName: legalEntityName || null,
        gstNumber: gstNumber || null,
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        addressLine,
        city,
        state,
        postalCode: postalCode || null,
        amenities,
        status: status === 'APPROVED' ? 'APPROVED' : 'ACTIVE'
      }
    });

    res.status(201).json({ success: true, data: theatre, message: 'Theatre created successfully' });
  } catch (err) { next(err); }
});

// Approve a theatre registration application
router.post('/:id/approve', async (req, res, next) => {
  try {
    const { status = 'APPROVED' } = req.body;
    const theatre = await prisma.theatre.update({
      where: { id: req.params.id },
      data: {
        status: status === 'ACTIVE' ? 'ACTIVE' : 'APPROVED',
        rejectionReason: null
      },
      include: {
        users: {
          select: { id: true, fullName: true, email: true, role: true }
        }
      }
    });
    res.json({ success: true, data: theatre, message: 'Theatre application approved successfully' });
  } catch (err) { next(err); }
});

// Reject a theatre registration application with reason
router.post('/:id/reject', async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      throw new AppError(400, 'Rejection reason is required', 'REJECTION_REASON_REQUIRED');
    }

    const existing = await prisma.theatre.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      throw new AppError(404, 'Theatre not found', 'NOT_FOUND');
    }
    if (existing.status === 'APPROVED' || existing.status === 'ACTIVE') {
      throw new AppError(400, 'Cannot reject a theatre that has already been approved', 'CANNOT_REJECT_APPROVED_THEATRE');
    }

    const theatre = await prisma.theatre.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason.trim()
      },
      include: {
        users: {
          select: { id: true, fullName: true, email: true, role: true }
        }
      }
    });
    res.json({ success: true, data: theatre, message: 'Theatre application rejected' });
  } catch (err) { next(err); }
});

// Update specific status (e.g. DOCS_VERIFIED, SUSPENDED, ACTIVE)
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    if (!status) {
      throw new AppError(400, 'Status is required', 'STATUS_REQUIRED');
    }
    const updateData = { status };
    if (status === 'REJECTED') {
      updateData.rejectionReason = reason || 'Rejected by administrator';
    } else if (status === 'APPROVED' || status === 'ACTIVE') {
      updateData.rejectionReason = null;
    }
    const theatre = await prisma.theatre.update({
      where: { id: req.params.id },
      data: updateData
    });
    res.json({ success: true, data: theatre });
  } catch (err) { next(err); }
});

// Delete theatre and cascade clear ALL associated data across all relations
router.delete('/:id', async (req, res, next) => {
  try {
    const theatreId = req.params.id;

    const existing = await prisma.theatre.findUnique({
      where: { id: theatreId }
    });

    if (!existing) {
      throw new AppError(404, 'Theatre not found', 'NOT_FOUND');
    }

    await prisma.$transaction(async (tx) => {
      // 1. Gather all shows of this theatre
      const shows = await tx.show.findMany({
        where: { theatreId },
        select: { id: true }
      });
      const showIds = shows.map((s) => s.id);

      // 2. Gather all bookings for these shows
      if (showIds.length > 0) {
        const bookings = await tx.booking.findMany({
          where: { showId: { in: showIds } },
          select: { id: true }
        });
        const bookingIds = bookings.map((b) => b.id);

        if (bookingIds.length > 0) {
          // Delete refunds for these bookings
          await tx.refund.deleteMany({
            where: { bookingId: { in: bookingIds } }
          });

          // Delete payments for these bookings
          await tx.payment.deleteMany({
            where: { bookingId: { in: bookingIds } }
          });

          // Delete booking concessions
          await tx.bookingConcession.deleteMany({
            where: { bookingId: { in: bookingIds } }
          });

          // Delete booking seats
          await tx.bookingSeat.deleteMany({
            where: { bookingId: { in: bookingIds } }
          });

          // Delete notifications referencing these bookings
          await tx.notification.deleteMany({
            where: { relatedId: { in: bookingIds } }
          });

          // Delete bookings
          await tx.booking.deleteMany({
            where: { id: { in: bookingIds } }
          });
        }

        // Delete show seat statuses
        await tx.showSeatStatus.deleteMany({
          where: { showId: { in: showIds } }
        });

        // Delete shows
        await tx.show.deleteMany({
          where: { id: { in: showIds } }
        });
      }

      // 3. Gather all screens of this theatre
      const screens = await tx.screen.findMany({
        where: { theatreId },
        select: { id: true }
      });
      const screenIds = screens.map((s) => s.id);

      if (screenIds.length > 0) {
        const seats = await tx.seat.findMany({
          where: { screenId: { in: screenIds } },
          select: { id: true }
        });
        const seatIds = seats.map((s) => s.id);

        if (seatIds.length > 0) {
          // Clear any remaining booking seats & seat statuses referencing these seats
          await tx.bookingSeat.deleteMany({
            where: { seatId: { in: seatIds } }
          });
          await tx.showSeatStatus.deleteMany({
            where: { seatId: { in: seatIds } }
          });
          await tx.seat.deleteMany({
            where: { id: { in: seatIds } }
          });
        }

        // Delete screens
        await tx.screen.deleteMany({
          where: { id: { in: screenIds } }
        });
      }

      // 4. Delete Concession items (clear any remaining booking concessions referencing them)
      const concessionItems = await tx.concessionItem.findMany({
        where: { theatreId },
        select: { id: true }
      });
      const concessionItemIds = concessionItems.map((c) => c.id);
      if (concessionItemIds.length > 0) {
        await tx.bookingConcession.deleteMany({
          where: { itemId: { in: concessionItemIds } }
        });
        await tx.concessionItem.deleteMany({
          where: { id: { in: concessionItemIds } }
        });
      }

      // 5. Delete Coupons associated with this theatre
      await tx.coupon.deleteMany({
        where: { theatreId }
      });

      // 6. Delete Theatre Documents
      await tx.theatreDocument.deleteMany({
        where: { theatreId }
      });

      // 7. Delete any notifications referencing this theatre directly
      await tx.notification.deleteMany({
        where: {
          OR: [
            { relatedEntity: 'THEATRE', relatedId: theatreId },
            { relatedId: theatreId }
          ]
        }
      });

      // 8. Gather and delete all manager/staff users associated with this theatre
      const theatreUsers = await tx.user.findMany({
        where: { theatreId },
        select: { id: true }
      });
      const theatreUserIds = theatreUsers.map((u) => u.id);

      // Unlink any remaining users first to satisfy foreign key constraint
      await tx.user.updateMany({
        where: { theatreId },
        data: { theatreId: null }
      });

      // 9. Delete the Theatre itself
      await tx.theatre.delete({
        where: { id: theatreId }
      });

      // 10. Permanently remove the manager and staff accounts of this theatre from users table
      if (theatreUserIds.length > 0) {
        // Delete bookings belonging to these manager/staff accounts if any
        const uBookings = await tx.booking.findMany({
          where: { userId: { in: theatreUserIds } },
          select: { id: true }
        });
        const uBookingIds = uBookings.map((b) => b.id);
        if (uBookingIds.length > 0) {
          await tx.refund.deleteMany({ where: { bookingId: { in: uBookingIds } } });
          await tx.payment.deleteMany({ where: { bookingId: { in: uBookingIds } } });
          await tx.bookingConcession.deleteMany({ where: { bookingId: { in: uBookingIds } } });
          await tx.bookingSeat.deleteMany({ where: { bookingId: { in: uBookingIds } } });
          await tx.booking.deleteMany({ where: { id: { in: uBookingIds } } });
        }

        await tx.refreshToken.deleteMany({
          where: { userId: { in: theatreUserIds } }
        });

        await tx.notification.deleteMany({
          where: { userId: { in: theatreUserIds } }
        });

        await tx.user.deleteMany({
          where: { id: { in: theatreUserIds } }
        });
      }

      // 9. Audit log entry
      await tx.auditLog.create({
        data: {
          actorId: req.user.id,
          action: 'DELETE_THEATRE',
          targetEntity: 'Theatre',
          targetId: theatreId,
          previousState: {
            name: existing.name,
            city: existing.city,
            gstNumber: existing.gstNumber,
            legalEntityName: existing.legalEntityName
          }
        }
      });
    });

    res.json({
      success: true,
      message: `Theatre "${existing.name}" and all associated data cleared successfully.`
    });
  } catch (err) {
    next(err);
  }
});

export default router;