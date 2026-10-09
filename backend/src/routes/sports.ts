import { Router, type Request, type Response } from 'express';
import { sportsData } from '../data/sports.js';

export const sportsRouter = Router();

sportsRouter.get('/', (req: Request, res: Response) => {
  const { search } = req.query;
  let results = [...sportsData];

  if (typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    results = results.filter((s) => s.title.toLowerCase().includes(q) || s.venue?.toLowerCase().includes(q));
  }

  res.json(results);
});

sportsRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const sport = sportsData.find((s) => s.id === id);
  if (!sport) {
    res.status(404).json({ error: `Sport event with id '${id}' not found` });
    return;
  }
  res.json(sport);
});
