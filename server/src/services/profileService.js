import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { storage } from '../storage/index.js';

const COMPLETENESS_FIELDS = [
  'fullName',
  'phone',
  'location',
  'headline',
  'summary',
  'skills',
  'experienceYears',
  'currentTitle',
  'resumePath',
  'linkedinUrl',
  'githubUrl',
];

export function computeCompleteness(profile) {
  if (!profile) return 0;
  let filled = 0;
  for (const field of COMPLETENESS_FIELDS) {
    const value = profile[field];
    if (field === 'skills') {
      if (Array.isArray(value) && value.length > 0) filled += 1;
    } else if (field === 'experienceYears') {
      if (value !== null && value !== undefined) filled += 1;
    } else if (typeof value === 'string' && value.trim()) {
      filled += 1;
    }
  }
  return Math.round((filled / COMPLETENESS_FIELDS.length) * 100);
}

function normalizeSkills(skills) {
  if (!skills) return undefined;
  const seen = new Set();
  const out = [];
  for (const raw of skills) {
    const s = String(raw).trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= 30) break;
  }
  return out;
}

function serialize(profile) {
  return {
    ...profile,
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    profileCompleteness: computeCompleteness(profile),
    hasResume: Boolean(profile.resumePath),
  };
}

export async function getProfile(userId) {
  const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError(404, 'NOT_FOUND', 'Profile not found');
  }
  return serialize(profile);
}

export async function updateProfile(userId, input) {
  const data = { ...input };
  if (data.phone === '') data.phone = null;
  if (data.linkedinUrl === '') data.linkedinUrl = null;
  if (data.githubUrl === '') data.githubUrl = null;
  if (data.skills) data.skills = normalizeSkills(data.skills);

  const profile = await prisma.candidateProfile.update({
    where: { userId },
    data,
  });
  return serialize(profile);
}

export async function saveResume(userId, { storedName }) {
  const profile = await prisma.candidateProfile.update({
    where: { userId },
    data: { resumePath: storedName },
  });
  return serialize(profile);
}

export async function getResumeForUser(userId) {
  const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!profile?.resumePath || !storage.exists(profile.resumePath)) {
    throw new AppError(404, 'NOT_FOUND', 'Resume not found');
  }
  return profile.resumePath;
}
