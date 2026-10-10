import { z } from 'zod';

export const createMovieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  synopsis: z.string().optional().nullable().or(z.literal('')),
  durationMinutes: z.coerce.number().int().positive('Duration must be a positive integer'),
  censorCertificate: z.string().min(1, 'Censor certificate is required'),
  originalLanguage: z.string().min(1, 'Original language is required'),
  supportedLanguages: z.union([
    z.array(z.string()),
    z.string().transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean))
  ]).optional().default([]),
  genres: z.union([
    z.array(z.string()),
    z.string().transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean))
  ]).optional().default([]),
  castMembers: z.any().optional().default([]),
  director: z.string().optional().nullable().or(z.literal('')),
  posterUrl: z.string().optional().nullable().or(z.literal('')),
  trailerUrl: z.string().optional().nullable().or(z.literal('')),
  releaseDate: z.string().optional().nullable().or(z.literal(''))
});