import { Router, type Request, type Response } from 'express';
import { offersData } from '../data/offers.js';

export const offersRouter = Router();

// GET /api/offers
offersRouter.get('/', (_req: Request, res: Response) => {
  res.json(offersData);
});

// GET /api/offers/:id
offersRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const offer = offersData.find((o) => o.id === id || o.code.toLowerCase() === id.toLowerCase());

  if (!offer) {
    res.status(404).json({ error: `Offer '${id}' not found` });
    return;
  }

  res.json(offer);
});
