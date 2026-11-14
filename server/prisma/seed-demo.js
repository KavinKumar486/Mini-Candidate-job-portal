import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'node:fs';
import path from 'node:path';
import { seedJobsAndDemoUser } from './seed.js';

const prisma = new PrismaClient();

async function main() {
  await seedJobsAndDemoUser();

  const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads');
  fs.mkdirSync(uploadDir, { recursive: true });
  const resumeName = 'demo-resume.pdf';
  fs.writeFileSync(
    path.join(uploadDir, resumeName),
    '%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF',
  );

  const email = 'candidate@demo.com';
  let user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash('Demo1234', 10),
        profile: { create: { fullName: 'Aisha Rahman' } },
      },
      include: { profile: true },
    });
  }

  await prisma.candidateProfile.update({
    where: { userId: user.id },
    data: {
      fullName: 'Aisha Rahman',
      phone: '9876543210',
      location: 'Bengaluru',
      headline: 'Full-stack developer looking for product roles',
      summary: 'Demo candidate used to walk through search, apply, and status tracking.',
      skills: ['JavaScript', 'React', 'Node.js'],
      experienceYears: 3,
      currentTitle: 'Software Engineer',
      resumePath: resumeName,
      linkedinUrl: 'https://www.linkedin.com/in/aisha-demo',
      githubUrl: 'https://github.com/aisha-demo',
    },
  });

  const jobs = await prisma.job.findMany({ where: { status: 'OPEN' }, take: 3, orderBy: { postedAt: 'desc' } });
  const statuses = ['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEW'];
  for (let i = 0; i < jobs.length; i += 1) {
    const job = jobs[i];
    const existing = await prisma.application.findUnique({
      where: { userId_jobId: { userId: user.id, jobId: job.id } },
    });
    if (existing) continue;
    const application = await prisma.application.create({
      data: {
        userId: user.id,
        jobId: job.id,
        coverNote: 'Demo application',
        resumePath: resumeName,
        status: statuses[i],
      },
    });
    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: application.id,
        fromStatus: null,
        toStatus: 'SUBMITTED',
        note: 'Application submitted',
      },
    });
    if (statuses[i] !== 'SUBMITTED') {
      await prisma.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: 'SUBMITTED',
          toStatus: statuses[i],
          note: 'Updated by demo seed (simulates ATS)',
        },
      });
    }
  }

  console.log('Demo user: candidate@demo.com / Demo1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
