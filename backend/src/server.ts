import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
const app = createApp();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎬 CinePass Backend Server running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🍿 Movies API:  http://localhost:${PORT}/api/movies`);
  console.log(`🎟️ Bookings API: http://localhost:${PORT}/api/bookings`);
});
