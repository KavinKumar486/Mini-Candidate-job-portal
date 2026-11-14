import { z } from 'zod';

const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+91[6-9]\d{9}|[6-9]\d{9}|\+[1-9]\d{9,14})$/, 'Invalid phone (Indian 10-digit or E.164)');

const httpUrl = z.string().trim().url();

export const patchProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100).optional(),
    phone: phoneSchema.optional().or(z.literal('')),
    location: z.string().trim().max(120).optional(),
    headline: z.string().trim().max(160).optional(),
    summary: z.string().trim().max(2000).optional(),
    skills: z.array(z.string()).max(30).optional(),
    experienceYears: z.coerce.number().int().min(0).max(50).optional(),
    currentTitle: z.string().trim().max(120).optional(),
    linkedinUrl: z
      .union([z.literal(''), httpUrl.refine((u) => /linkedin\.com/i.test(u), 'Must be a LinkedIn URL')])
      .optional(),
    githubUrl: z
      .union([z.literal(''), httpUrl.refine((u) => /github\.com/i.test(u), 'Must be a GitHub URL')])
      .optional(),
  })
  .strict();
