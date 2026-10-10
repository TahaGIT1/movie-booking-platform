import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().url().default('postgresql://postgres:postgres@localhost:5432/cineverse'),
  JWT_SECRET: z.string().min(16).default('cineverse_jwt_secret_dev_key_12345'),
  JWT_REFRESH_SECRET: z.string().min(16).default('cineverse_jwt_refresh_dev_key_67890'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
