import { z } from 'zod';

const jobType = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']);
const workMode = z.enum(['ONSITE', 'REMOTE', 'HYBRID']);

function toArray(val) {
  if (val === undefined || val === null || val === '') return undefined;
  if (Array.isArray(val)) return val;
  return String(val)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const jobListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  location: z.string().trim().max(120).optional(),
  jobType: z.preprocess(toArray, z.array(jobType).optional()),
  workMode: z.preprocess(toArray, z.array(workMode).optional()),
  experienceLevel: z.string().trim().max(40).optional(),
  salaryMin: z.coerce.number().int().nonnegative().optional(),
  skills: z.string().trim().max(400).optional(),
  postedWithin: z.coerce.number().int().positive().max(365).optional(),
  sort: z.enum(['newest', 'salary_desc']).default('newest'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(10),
});

export const jobIdParamSchema = z.object({
  id: z.string().uuid(),
});
