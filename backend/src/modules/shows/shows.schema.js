import { z } from 'zod';
export const createShowSchema = z.object({
  screenId: z.string().uuid(),
  movieId: z.string().uuid(),
  startTime: z.string(), // ISO
  endTime: z.string(), // ISO
  languageVersion: z.string(),
  baseTierPricing: z.any()
});