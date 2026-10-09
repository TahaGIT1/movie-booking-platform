import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on('error', (err) => {
  console.error('❌ Redis Error:', err);
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});
