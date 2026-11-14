import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signAccessToken } from '../utils/jwt.js';

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    profile: user.profile
      ? {
          fullName: user.profile.fullName,
          headline: user.profile.headline,
          location: user.profile.location,
        }
      : null,
  };
}

export async function register({ email, password, fullName }) {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'Email already registered');
  }
  const passwordHash = await hashPassword(password);
  try {
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        profile: { create: { fullName } },
      },
      include: { profile: true },
    });
    return publicUser(user);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new AppError(409, 'CONFLICT', 'Email already registered');
    }
    throw err;
  }
}

const INVALID_LOGIN = new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    throw INVALID_LOGIN;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    throw INVALID_LOGIN;
  }
  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    tokenType: 'Bearer',
  };
}

export async function me(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }
  return publicUser(user);
}
