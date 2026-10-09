import { Router, type Request, type Response } from 'express';
import { eventsData } from '../data/events.js';

export const eventsRouter = Router();

// GET /api/events
eventsRouter.get('/', (req: Request, res: Response) => {
  const { search, genre } = req.query;
  let results = [...eventsData];

  if (typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    results = results.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.genre.toLowerCase().includes(q) ||
        e.venue?.toLowerCase().includes(q)
    );
  }

  if (typeof genre === 'string' && genre !== 'All' && genre.trim()) {
    const g = genre.toLowerCase().trim();
    results = results.filter(
      (e) =>
        e.genre.toLowerCase().includes(g) ||
        e.genreTags?.some((t) => t.toLowerCase() === g)
    );
  }

  res.json(results);
});

// GET /api/events/:id
eventsRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const event = eventsData.find((e) => e.id === id);

  if (!event) {
    res.status(404).json({ error: `Event with id '${id}' not found` });
    return;
  }

  res.json(event);
});
