import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function readBearer(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = readBearer(req);
  if (!token) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { profile: true },
  });
  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }
  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = readBearer(req);
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    req.user = user || null;
  } catch {
    req.user = null;
  }
  next();
});
