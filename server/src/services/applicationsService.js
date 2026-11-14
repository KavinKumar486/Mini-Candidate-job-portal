import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { TRANSITIONS, TERMINAL, canTransition } from './statusMachine.js';

function serializeApp(app) {
  return {
    ...app,
    job: app.job
      ? { id: app.job.id, title: app.job.title, company: app.job.company, location: app.job.location }
      : undefined,
  };
}

function requireApplyReady(profile) {
  const missing = [];
  if (!profile?.fullName?.trim()) missing.push('fullName');
  if (!profile?.phone?.trim()) missing.push('phone');
  if (!profile?.resumePath) missing.push('resume');
  if (missing.length) {
    throw new AppError(422, 'INCOMPLETE_PROFILE', 'Profile is incomplete for applying', { missing });
  }
}

export async function applyToJob(user, jobId, { coverNote }) {
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) throw new AppError(404, 'NOT_FOUND', 'Job not found');
  if (job.status === 'CLOSED') {
    throw new AppError(409, 'CONFLICT', 'Cannot apply to a closed job');
  }

  const profile = user.profile || (await prisma.candidateProfile.findUnique({ where: { userId: user.id } }));
  requireApplyReady(profile);

  try {
    const created = await prisma.$transaction(async (tx) => {
      const application = await tx.application.create({
        data: {
          userId: user.id,
          jobId,
          coverNote: coverNote || null,
          resumePath: profile.resumePath,
          status: 'SUBMITTED',
        },
        include: { job: true },
      });
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: null,
          toStatus: 'SUBMITTED',
          note: 'Application submitted',
        },
      });
      return application;
    });
    return serializeApp(created);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError(409, 'CONFLICT', 'You have already applied to this job');
    }
    throw err;
  }
}

export async function listMine(userId, query) {
  const where = { userId };
  if (query.status) where.status = query.status;
  const skip = (query.page - 1) * query.pageSize;
  const [total, items] = await prisma.$transaction([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      include: { job: true },
      orderBy: { appliedAt: 'desc' },
      skip,
      take: query.pageSize,
    }),
  ]);
  return {
    items: items.map(serializeApp),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getMine(userId, id) {
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      job: true,
      history: { orderBy: { changedAt: 'asc' } },
    },
  });
  if (!app || app.userId !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Application not found');
  }
  return serializeApp(app);
}

async function changeStatus(applicationId, toStatus, note, { asCandidate }) {
  const app = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!app) throw new AppError(404, 'NOT_FOUND', 'Application not found');

  if (asCandidate && toStatus !== 'WITHDRAWN') {
    throw new AppError(409, 'CONFLICT', 'Candidates may only withdraw an application');
  }
  if (asCandidate && TERMINAL.has(app.status)) {
    throw new AppError(409, 'CONFLICT', `Cannot withdraw from ${app.status}`);
  }
  if (!canTransition(app.status, toStatus)) {
    throw new AppError(
      409,
      'CONFLICT',
      `Cannot transition from ${app.status} to ${toStatus}. Allowed: ${(TRANSITIONS[app.status] || []).join(', ') || 'none'}`,
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.application.update({
      where: { id: applicationId },
      data: { status: toStatus },
    });
    await tx.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus: app.status,
        toStatus,
        note: note || null,
      },
    });
    return tx.application.findUnique({
      where: { id: applicationId },
      include: { job: true, history: { orderBy: { changedAt: 'asc' } } },
    });
  });
  return serializeApp(updated);
}

export async function withdraw(userId, id) {
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app || app.userId !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Application not found');
  }
  return changeStatus(id, 'WITHDRAWN', 'Withdrawn by candidate', { asCandidate: true });
}

export async function adminSetStatus(id, status, note) {
  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) throw new AppError(404, 'NOT_FOUND', 'Application not found');
  return changeStatus(id, status, note, { asCandidate: false });
}
