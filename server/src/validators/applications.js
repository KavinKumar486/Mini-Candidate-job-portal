import { z } from 'zod';

export const applySchema = z.object({
  coverNote: z.string().trim().max(2000).optional(),
});

export const applicationIdParam = z.object({
  id: z.string().uuid(),
});

export const jobIdParam = z.object({
  jobId: z.string().uuid(),
});

export const listApplicationsQuery = z.object({
  status: z
    .enum([
      'SUBMITTED',
      'UNDER_REVIEW',
      'SHORTLISTED',
      'INTERVIEW',
      'OFFERED',
      'HIRED',
      'REJECTED',
      'WITHDRAWN',
    ])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
});

export const adminStatusSchema = z.object({
  status: z.enum([
    'SUBMITTED',
    'UNDER_REVIEW',
    'SHORTLISTED',
    'INTERVIEW',
    'OFFERED',
    'HIRED',
    'REJECTED',
    'WITHDRAWN',
  ]),
  note: z.string().trim().max(500).optional(),
});
