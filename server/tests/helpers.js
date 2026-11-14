import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';

export const app = createApp();

export function uniqueEmail() {
  return `u${Date.now()}${Math.random().toString(16).slice(2)}@example.com`;
}

export async function registerUser(overrides = {}) {
  const payload = {
    email: uniqueEmail(),
    password: 'Password1',
    fullName: 'Test User',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(payload);
  return { payload, res };
}

export async function loginUser(email, password = 'Password1') {
  return request(app).post('/api/auth/login').send({ email, password });
}

export async function authHeaderFor(email, password = 'Password1') {
  const res = await loginUser(email, password);
  return { Authorization: `Bearer ${res.body.accessToken}` };
}

export function expiredToken(userId) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: '-10s' });
}

export const PDF_BUFFER = Buffer.from('%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');

export async function uploadResume(headers) {
  return request(app)
    .post('/api/profile/resume')
    .set(headers)
    .attach('resume', PDF_BUFFER, { filename: 'cv.pdf', contentType: 'application/pdf' });
}

export async function createJob(data = {}) {
  return prisma.job.create({
    data: {
      title: 'React Developer',
      company: 'Acme',
      location: 'Bengaluru',
      jobType: 'FULL_TIME',
      workMode: 'REMOTE',
      experienceLevel: 'MID',
      salaryMin: 1000000,
      salaryMax: 2000000,
      skills: ['React', 'Node.js'],
      description: 'Build React apps with Node.js backends.',
      status: 'OPEN',
      ...data,
    },
  });
}
