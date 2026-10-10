import { createServer } from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { initSocket, io } from './socket.js';

export { io };
const httpServer = createServer(app);
initSocket(httpServer);

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
  } catch (error) {
    console.warn('⚠️ Could not connect to database at startup:', error.message);
    console.warn('💡 Please verify your DATABASE_URL in backend/.env (e.g. Neon PostgreSQL)');
  }

  httpServer.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  });
};

startServer();
