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

export default router;