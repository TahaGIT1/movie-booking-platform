import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  mobileNumber: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(['CUSTOMER', 'THEATRE_MANAGER', 'THEATRE_STAFF', 'SUPER_ADMIN']).default('CUSTOMER'),
  theatreName: z.string().optional(),
  legalEntityName: z.string().optional(),
  gstNumber: z.string().optional(),
  theatrePhone: z.string().optional(),
  theatreEmail: z.string().optional(),
  addressLine: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  amenities: z.any().optional(),
  theatre: z.object({
    name: z.string().optional(),
    legalEntityName: z.string().optional(),
    gstNumber: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().optional(),
    addressLine: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    amenities: z.any().optional()
  }).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const refreshSchema = z.object({
  refreshToken: z.string()
});
