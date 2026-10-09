import { Router, type Request, type Response } from 'express';
import { theatresData } from '../data/theatres.js';

export const theatresRouter = Router();

// GET /api/theatres
theatresRouter.get('/', (req: Request, res: Response) => {
  const { city } = req.query;

  if (typeof city === 'string' && city.trim() && city !== 'All Cities') {
    const filtered = theatresData.filter(
      (t) => t.city.toLowerCase() === city.toLowerCase()
    );
    res.json(filtered);
    return;
  }

  res.json(theatresData);
});

// GET /api/theatres/:id
theatresRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const theatre = theatresData.find((t) => t.id === id);

  if (!theatre) {
    res.status(404).json({ error: `Theatre with id '${id}' not found` });
    return;
  }

  res.json(theatre);
});
