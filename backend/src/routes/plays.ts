import { Router, type Request, type Response } from 'express';
import { playsData } from '../data/plays.js';

export const playsRouter = Router();

playsRouter.get('/', (req: Request, res: Response) => {
  const { search } = req.query;
  let results = [...playsData];

  if (typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    results = results.filter((p) => p.title.toLowerCase().includes(q) || p.genre.toLowerCase().includes(q));
  }

  res.json(results);
});

playsRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const play = playsData.find((p) => p.id === id);
  if (!play) {
    res.status(404).json({ error: `Play with id '${id}' not found` });
    return;
  }
  res.json(play);
});
