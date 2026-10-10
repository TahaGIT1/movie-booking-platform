import { z } from 'zod';
export const createScreenSchema = z.object({
  screenNumber: z.string().min(1),
  name: z.string().min(1),
  totalCapacity: z.number().int().positive()
});
export const createSeatsSchema = z.object({
  rows: z.number().int().positive(),
  cols: z.number().int().positive()
});