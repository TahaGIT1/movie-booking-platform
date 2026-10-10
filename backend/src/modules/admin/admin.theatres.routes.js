import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/error.middleware.js';

const router = Router();

router.use(authenticate, requirePermission('APPROVE_THEATRE'));

router.get('/', async (req, res, next) => {
  try {
    const theatres = await prisma.theatre.findMany();
    res.json({ success: true, data: theatres });
  } catch (err) { next(err); }
});

router.post('/:id/approve', async (req, res, next) => {
  try {
    const theatre = await prisma.theatre.update({ where: { id: req.params.id }, data: { status: 'APPROVED' } });
    res.json({ success: true, data: theatre });
  } catch (err) { next(err); }
});

export default router;