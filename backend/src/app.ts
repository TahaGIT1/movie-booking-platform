import express, { type Application, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { moviesRouter } from './routes/movies.js';
import { eventsRouter } from './routes/events.js';
import { streamsRouter } from './routes/streams.js';
import { playsRouter } from './routes/plays.js';
import { sportsRouter } from './routes/sports.js';
import { activitiesRouter } from './routes/activities.js';
import { theatresRouter } from './routes/theatres.js';
import { offersRouter } from './routes/offers.js';
import { bookingsRouter } from './routes/bookings.js';
import { searchRouter } from './routes/search.js';

export const createApp = (): Application => {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: '*', // Allow all in dev / local deployment
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json());

  // Request logger
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'CinePass API Server',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // API Routes
  app.use('/api/movies', moviesRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/streams', streamsRouter);
  app.use('/api/plays', playsRouter);
  app.use('/api/sports', sportsRouter);
  app.use('/api/activities', activitiesRouter);
  app.use('/api/theatres', theatresRouter);
  app.use('/api/offers', offersRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/search', searchRouter);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
  });

  // Global Error Handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  return app;
};
