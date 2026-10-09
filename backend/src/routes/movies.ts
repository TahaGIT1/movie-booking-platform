import { Router, type Request, type Response } from 'express';
import { moviesData } from '../data/movies.js';

export const moviesRouter = Router();

// GET /api/movies
moviesRouter.get('/', (req: Request, res: Response) => {
  const { search, genre, status } = req.query;
  let results = [...moviesData];

  if (typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    results = results.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.genre.toLowerCase().includes(q) ||
        m.cast?.some((c) => c.toLowerCase().includes(q))
    );
  }

  if (typeof genre === 'string' && genre !== 'All' && genre.trim()) {
    const g = genre.toLowerCase().trim();
    results = results.filter(
      (m) =>
        m.genre.toLowerCase().includes(g) ||
        m.genreTags?.some((t) => t.toLowerCase() === g)
    );
  }

  if (status === 'now' || status === 'upcoming') {
    results = results.filter((m) => m.statusCategory === status);
  }

  res.json(results);
});

// GET /api/movies/:id
moviesRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const movie = moviesData.find((m) => m.id === id);

  if (!movie) {
    res.status(404).json({ error: `Movie with id '${id}' not found` });
    return;
  }

  res.json(movie);
});
