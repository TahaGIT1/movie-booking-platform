import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  mobileNumber: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(['CUSTOMER', 'THEATRE_MANAGER', 'THEATRE_STAFF', 'SUPER_ADMIN']).default('CUSTOMER')
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const refreshSchema = z.object({
  refreshToken: z.string()
});
