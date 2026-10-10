import { z } from 'zod';

export const createScreenSchema = z.object({
  screenNumber: z.string().min(1),
  name: z.string().min(1),
  totalCapacity: z.number().int().positive().optional().default(100),
  soundSystem: z.string().optional().nullable(),
  supportedFormats: z.array(z.string()).optional()
});

export const createSeatsSchema = z.object({
  rows: z.number().int().positive().optional(),
  cols: z.number().int().positive().optional(),
  aisleCols: z.array(z.number()).optional(),
  customLayout: z.array(
    z.object({
      rowLabel: z.string(),
      seatNumber: z.number().int().nonnegative().optional().default(1),
      tier: z.enum(['NORMAL', 'PREMIUM', 'RECLINER']).optional().default('NORMAL'),
      isAccessible: z.boolean().optional().default(false),
      isBroken: z.boolean().optional().default(false),
      isPathway: z.boolean().optional().default(false),
      type: z.string().optional(),
      gridX: z.number().int(),
      gridY: z.number().int()
    })
  ).optional(),
  rowTiers: z.record(z.string(), z.enum(['NORMAL', 'PREMIUM', 'RECLINER'])).optional()
});