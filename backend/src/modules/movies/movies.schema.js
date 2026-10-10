import { z } from 'zod';
export const createMovieSchema = z.object({
  title: z.string().min(1),
  synopsis: z.string().optional(),
  durationMinutes: z.number().int().positive(),
  censorCertificate: z.string(),
  originalLanguage: z.string(),
  supportedLanguages: z.array(z.string()).default([]),
  genres: z.array(z.string()).default([]),
  director: z.string().optional(),
  posterUrl: z.string().url().optional(),
  trailerUrl: z.string().url().optional(),
  releaseDate: z.string().optional() // ISO date
});