import { z } from 'zod';

// Public signup supports customers and pending theatre partners only. Platform
// and theatre staff roles are assigned through protected administration APIs.
export const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().email().max(255),
  mobileNumber: z.string().max(32).optional(),
  password: z.string().min(8).max(128),
  role: z.enum(['CUSTOMER', 'THEATRE_MANAGER']).default('CUSTOMER'),
  theatreName: z.string().trim().min(2).max(160).optional(),
  legalEntityName: z.string().trim().max(180).optional(),
  gstNumber: z.string().trim().max(32).optional(),
  theatrePhone: z.string().trim().max(32).optional(),
  theatreEmail: z.string().email().optional(),
  addressLine: z.string().trim().max(255).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  amenities: z.array(z.string().max(80)).max(50).optional()
}).superRefine((data, ctx) => {
  if (data.role === 'THEATRE_MANAGER') {
    for (const field of ['theatreName', 'addressLine', 'city', 'state']) {
      if (!data[field]) ctx.addIssue({ code: 'custom', path: [field], message: `${field} is required for theatre registration` });
    }
  }
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const refreshSchema = z.object({
  refreshToken: z.string()
});
