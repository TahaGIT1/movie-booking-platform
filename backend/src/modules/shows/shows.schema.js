import { z } from 'zod';

export const createShowSchema = z.object({
  screenId: z.string().uuid(),
  movieId: z.string().uuid(),
  startTime: z.string(), // ISO
  endTime: z.string(), // ISO
  visualFormat: z.enum(['TWO_D', 'THREE_D', 'IMAX', 'FOUR_DX', 'SCREEN_X']).optional().default('TWO_D'),
  languageVersion: z.string().min(1),
  baseTierPricing: z.any()
});