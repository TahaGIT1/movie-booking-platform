import { Router, type Request, type Response } from 'express';
import { activitiesData } from '../data/activities.js';

export const activitiesRouter = Router();

activitiesRouter.get('/', (req: Request, res: Response) => {
  const { search } = req.query;
  let results = [...activitiesData];

  if (typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    results = results.filter((a) => a.title.toLowerCase().includes(q) || a.genre.toLowerCase().includes(q));
  }

  res.json(results);
});

activitiesRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const activity = activitiesData.find((a) => a.id === id);
  if (!activity) {
    res.status(404).json({ error: `Activity with id '${id}' not found` });
    return;
  }
  res.json(activity);
});
