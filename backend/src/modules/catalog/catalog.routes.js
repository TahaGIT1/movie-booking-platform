import { Router } from 'express';
import {
  eventsData,
  streamsData,
  playsData,
  sportsData,
  activitiesData,
  offersData
} from './catalog.data.js';

const router = Router();

// Events
router.get('/events', (req, res) => res.json(eventsData));
router.get('/events/:id', (req, res) => {
  const item = eventsData.find(e => e.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Event not found' });
  res.json(item);
});

// Streams
router.get('/streams', (req, res) => res.json(streamsData));
router.get('/streams/:id', (req, res) => {
  const item = streamsData.find(s => s.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Stream not found' });
  res.json(item);
});

// Plays
router.get('/plays', (req, res) => res.json(playsData));
router.get('/plays/:id', (req, res) => {
  const item = playsData.find(p => p.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Play not found' });
  res.json(item);
});

// Sports
router.get('/sports', (req, res) => res.json(sportsData));
router.get('/sports/:id', (req, res) => {
  const item = sportsData.find(s => s.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Sport item not found' });
  res.json(item);
});

// Activities
router.get('/activities', (req, res) => res.json(activitiesData));
router.get('/activities/:id', (req, res) => {
  const item = activitiesData.find(a => a.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Activity not found' });
  res.json(item);
});

// Offers
router.get('/offers', (req, res) => res.json(offersData));

export default router;
