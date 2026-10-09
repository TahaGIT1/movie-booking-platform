import { Router, type Request, type Response } from 'express';
import { moviesData } from '../data/movies.js';
import { eventsData } from '../data/events.js';
import { streamsData } from '../data/streams.js';
import { playsData } from '../data/plays.js';
import { sportsData } from '../data/sports.js';
import { activitiesData } from '../data/activities.js';

export const searchRouter = Router();

searchRouter.get('/', (req: Request, res: Response) => {
  const q = typeof req.query.q === 'string' ? req.query.q.toLowerCase().trim() : '';

  if (!q) {
    res.json({
      movies: moviesData.slice(0, 5),
      events: eventsData.slice(0, 5),
      streams: streamsData.slice(0, 5),
      plays: playsData.slice(0, 5),
      sports: sportsData.slice(0, 5),
      activities: activitiesData.slice(0, 5),
    });
    return;
  }

  const match = (item: { title: string; genre?: string; description?: string }) =>
    item.title.toLowerCase().includes(q) ||
    item.genre?.toLowerCase().includes(q) ||
    item.description?.toLowerCase().includes(q);

  res.json({
    movies: moviesData.filter(match),
    events: eventsData.filter(match),
    streams: streamsData.filter(match),
    plays: playsData.filter(match),
    sports: sportsData.filter(match),
    activities: activitiesData.filter(match),
  });
});
