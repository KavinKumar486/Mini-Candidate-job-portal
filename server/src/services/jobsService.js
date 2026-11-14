import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';

export function buildJobWhere(query) {
  const and = [{ status: 'OPEN' }];

  if (query.location) {
    and.push({ location: { contains: query.location } });
  }
  if (query.jobType?.length) {
    and.push({ jobType: { in: query.jobType } });
  }
  if (query.workMode?.length) {
    and.push({ workMode: { in: query.workMode } });
  }
  if (query.experienceLevel) {
    and.push({ experienceLevel: query.experienceLevel });
  }
  if (query.salaryMin !== undefined) {
    and.push({ salaryMax: { gte: query.salaryMin } });
  }
  if (query.postedWithin) {
    const since = new Date(Date.now() - query.postedWithin * 24 * 60 * 60 * 1000);
    and.push({ postedAt: { gte: since } });
  }
  // `q` is applied in listJobs so skills JSON can match too (Prisma JSON contains is awkward on MySQL).
  if (query.q) {
    const q = query.q;
    and.push({
      OR: [
        { title: { contains: q } },
        { company: { contains: q } },
        { description: { contains: q } },
      ],
    });
  }

  return { AND: and };
}

function skillsList(job) {
  return Array.isArray(job.skills) ? job.skills : [];
}

function matchesSkillsAndQ(job, query) {
  const skills = skillsList(job).map((s) => String(s).toLowerCase());
  if (query.skills) {
    const wanted = query.skills
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (wanted.length && !wanted.some((w) => skills.some((s) => s.includes(w)))) {
      return false;
    }
  }
  if (query.q) {
    const q = query.q.toLowerCase();
    const inText =
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.description.toLowerCase().includes(q);
    const inSkills = skills.some((s) => s.includes(q));
    if (!inText && !inSkills) return false;
  }
  return true;
}

export async function listJobs(query, userId) {
  const { q: _q, skills: _skills, ...sqlFilters } = query;
  const where = buildJobWhere(sqlFilters);
  const orderBy =
    query.sort === 'salary_desc'
      ? [{ salaryMax: 'desc' }, { postedAt: 'desc' }]
      : [{ postedAt: 'desc' }];

  const rows = await prisma.job.findMany({ where, orderBy });
  const filtered = rows.filter((job) => matchesSkillsAndQ(job, query));
  const total = filtered.length;
  const page = query.page;
  const pageSize = query.pageSize;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  let applied = new Set();
  if (userId && items.length) {
    const apps = await prisma.application.findMany({
      where: { userId, jobId: { in: items.map((j) => j.id) } },
      select: { jobId: true },
    });
    applied = new Set(apps.map((a) => a.jobId));
  }

  return {
    items: items.map((job) => ({
      ...job,
      skills: skillsList(job),
      hasApplied: userId ? applied.has(job.id) : undefined,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)) || 1,
  };
}

export async function getJob(id, userId) {
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job || job.status === 'CLOSED') {
    throw new AppError(404, 'NOT_FOUND', 'Job not found');
  }
  let hasApplied;
  if (userId) {
    const app = await prisma.application.findUnique({
      where: { userId_jobId: { userId, jobId: id } },
      select: { id: true },
    });
    hasApplied = Boolean(app);
  }
  return { ...job, skills: skillsList(job), hasApplied };
}
