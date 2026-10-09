import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { validateRequest } from '../../middleware/validation.middleware.js';
import { createTheatreSchema } from './theatres.schema.js';
import { prisma } from '../../config/prisma.js';

const router = Router();

// Manager routes for their own theatre
router.post('/', authenticate, requirePermission('MANAGE_THEATRE'), validateRequest(createTheatreSchema), async (req, res, next) => {
  try {
    const theatre = await prisma.theatre.create({ data: req.body });
    // Link user to this theatre
    await prisma.user.update({ where: { id: req.user.id }, data: { theatreId: theatre.id } });
    res.status(201).json({ success: true, data: theatre });
  } catch (err) { next(err); }
});

router.get('/my', authenticate, requirePermission('MANAGE_THEATRE'), async (req, res, next) => {
  try {
    const theatre = await prisma.theatre.findUnique({ where: { id: req.user.theatreId } });
    res.json({ success: true, data: theatre });
  } catch (err) { next(err); }
});

export default router;
// Public customer routes
router.get('/', async (req, res, next) => {
  try {
    const theatres = await prisma.theatre.findMany({ where: { status: 'ACTIVE' } });
    res.json({ success: true, data: theatres });
  } catch (err) { next(err); }
});


router.get('/:id/shows', async (req, res, next) => {
  try {
    const shows = await prisma.show.findMany({ where: { screen: { theatreId: req.params.id }, startTime: { gte: new Date() } }, include: { movie: true, screen: true }, orderBy: { startTime: 'asc' } });
    res.json({ success: true, data: shows });
  } catch (err) { next(err); }
});

