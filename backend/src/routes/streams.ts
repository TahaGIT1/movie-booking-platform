import { Router, type Request, type Response } from 'express';
import { streamsData } from '../data/streams.js';

export const streamsRouter = Router();

streamsRouter.get('/', (req: Request, res: Response) => {
  const { search } = req.query;
  let results = [...streamsData];

  if (typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    results = results.filter((s) => s.title.toLowerCase().includes(q) || s.genre.toLowerCase().includes(q));
  }

  res.json(results);
});

streamsRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const stream = streamsData.find((s) => s.id === id);
  if (!stream) {
    res.status(404).json({ error: `Stream with id '${id}' not found` });
    return;
  }
  res.json(stream);
});
