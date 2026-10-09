import { z } from 'zod';
export const createTheatreSchema = z.object({
  name: z.string().min(1),
  legalEntityName: z.string().optional(),
  gstNumber: z.string().optional(),
  addressLine: z.string(),
  city: z.string(),
  state: z.string()
});