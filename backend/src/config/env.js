import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_HOST: z.string().optional().default('smtp.gmail.com'),
  SMTP_PORT: z.string().optional().default('465'),
  SMTP_SECURE: z.string().optional().default('true'),
  RAZORPAY_KEY_ID: z.string().optional().default('rzp_test_dummykey12345'),
  RAZORPAY_KEY_SECRET: z.string().optional().default('dummysecret123456789'),
  TICKET_QR_SECRET: z.string().optional().default('cineverse_ticket_qr_secret_super_secure_key'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
