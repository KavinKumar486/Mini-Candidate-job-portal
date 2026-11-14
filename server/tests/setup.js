import { prisma } from '../src/config/prisma.js';

beforeEach(async () => {
  await prisma.applicationStatusHistory.deleteMany();
  await prisma.application.deleteMany();
  await prisma.candidateProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.job.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
