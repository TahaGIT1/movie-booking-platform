import { createServer } from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { initSocket } from './socket.js';

const httpServer = createServer(app);
initSocket(httpServer, {
  cors: { origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean) }
});

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    httpServer.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error('❌ Failed to start server', error);
    process.exit(1);
  }
};

startServer();
