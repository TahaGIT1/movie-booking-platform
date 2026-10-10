import { z } from 'zod';

const preprocessArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const preprocessCast = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === 'string') return { name: item.trim(), role: '' };
        if (item && typeof item === 'object') {
          return {
            name: String(item.name || '').trim(),
            role: String(item.role || '').trim(),
          };
        }
        return { name: String(item), role: '' };
      })
      .filter((c) => Boolean(c.name));
  }
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return preprocessCast(parsed);
    } catch {
      return val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({ name, role: '' }));
    }
  }
  return [];
};

const emptyToNull = (val) => {
  if (val === '' || val === undefined || val === null) return null;
  return val;
};

export const createMovieSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  synopsis: z.preprocess(emptyToNull, z.string().nullable().optional()),
  durationMinutes: z.coerce.number().int().positive('Duration must be positive in minutes'),
  censorCertificate: z.string().trim().min(1, 'Censor certificate is required'),
  originalLanguage: z.string().trim().min(1, 'Original language is required'),
  supportedLanguages: z.preprocess(preprocessArray, z.array(z.string())).default([]),
  genres: z.preprocess(preprocessArray, z.array(z.string())).default([]),
  castMembers: z.preprocess(preprocessCast, z.array(z.any())).default([]),
  director: z.preprocess(emptyToNull, z.string().nullable().optional()),
  posterUrl: z.preprocess(emptyToNull, z.string().url().nullable().optional()),
  trailerUrl: z.preprocess(emptyToNull, z.string().url().nullable().optional()),
  releaseDate: z.preprocess(emptyToNull, z.string().nullable().optional()),
});

export const updateMovieSchema = createMovieSchema.partial();