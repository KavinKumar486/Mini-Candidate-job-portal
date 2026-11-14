import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function requireAdminKey(req, res, next) {
  const key = req.get('X-Admin-Key');
  if (!key || key !== env.ADMIN_API_KEY) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Invalid admin key'));
  }
  next();
}
