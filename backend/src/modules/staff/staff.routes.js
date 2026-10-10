import { Router } from 'express';
import bcrypt from 'bcrypt';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { enforceTenantScope } from '../../middleware/tenant.middleware.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const router = Router();

// Staff ticket validation (for gate scanners)
router.post('/validate-ticket', authenticate, requirePermission(['SCAN_TICKET', 'SCAN_TICKETS', 'MANAGE_STAFF']), enforceTenantScope, async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { show: { include: { movie: true, screen: true } }, seats: { include: { seat: true } }, user: true }
    });

    if (!booking) throw new AppError(404, 'Booking not found');
    if (booking.show.theatreId !== req.tenantId) throw new AppError(403, 'Ticket belongs to another cinema branch');
    if (booking.status !== 'CONFIRMED') throw new AppError(400, `Ticket is not confirmed (Current status: ${booking.status})`);
    if (booking.qrScanStatus === 'USED') {
      return res.status(400).json({
        success: false,
        message: 'TICKET_ALREADY_USED',
        scannedAt: booking.scannedAt,
        data: booking
      });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        qrScanStatus: 'USED',
        scannedAt: new Date(),
        scannedByStaffId: req.user.id
      },
      include: { show: { include: { movie: true, screen: true } }, seats: { include: { seat: true } }, user: true }
    });

    res.json({ success: true, message: 'ENTRY_ALLOWED', data: updated });
  } catch (err) { next(err); }
});

// Manager: List all staff for this theatre
router.get('/', authenticate, requirePermission(['MANAGE_STAFF', 'MANAGE_THEATRE']), enforceTenantScope, async (req, res, next) => {
  try {
    const staff = await prisma.user.findMany({
      where: {
        theatreId: req.tenantId,
        role: 'THEATRE_STAFF'
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNumber: true,
        role: true,
        isBlocked: true,
        lastLoginAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: staff });
  } catch (err) { next(err); }
});

// Manager: Create/Invite staff member
router.post('/', authenticate, requirePermission(['MANAGE_STAFF', 'MANAGE_THEATRE']), enforceTenantScope, async (req, res, next) => {
  try {
    const { fullName, email, mobileNumber, password } = req.body;
    if (!fullName || !email || !password) {
      throw new AppError(400, 'Full name, email, and password are required');
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(mobileNumber ? [{ mobileNumber }] : [])
        ]
      }
    });

    if (existingUser) {
      throw new AppError(409, 'User with this email or phone already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const staffMember = await prisma.user.create({
      data: {
        fullName,
        email,
        mobileNumber,
        passwordHash,
        role: 'THEATRE_STAFF',
        theatreId: req.tenantId
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNumber: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({ success: true, data: staffMember, message: 'Staff member added successfully' });
  } catch (err) { next(err); }
});

// Manager: Toggle staff active/blocked status
router.patch('/:id/toggle-status', authenticate, requirePermission(['MANAGE_STAFF', 'MANAGE_THEATRE']), enforceTenantScope, async (req, res, next) => {
  try {
    const staff = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!staff || staff.theatreId !== req.tenantId) {
      throw new AppError(404, 'Staff member not found');
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isBlocked: !staff.isBlocked },
      select: { id: true, fullName: true, isBlocked: true }
    });

    res.json({ success: true, data: updated, message: `Staff member ${updated.isBlocked ? 'suspended' : 'activated'}` });
  } catch (err) { next(err); }
});

// Manager: Delete staff member
router.delete('/:id', authenticate, requirePermission(['MANAGE_STAFF', 'MANAGE_THEATRE']), enforceTenantScope, async (req, res, next) => {
  try {
    const staff = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!staff || staff.theatreId !== req.tenantId) {
      throw new AppError(404, 'Staff member not found');
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Staff member removed successfully' });
  } catch (err) { next(err); }
});

export default router;