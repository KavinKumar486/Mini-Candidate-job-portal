import { ZodError } from 'zod';
import multer from 'multer';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', 'Route not found'));
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' },
    });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: { code: 'PAYLOAD_TOO_LARGE', message: 'File exceeds 5 MB limit' },
      });
    }
    return res.status(400).json({
      error: { code: 'UPLOAD_ERROR', message: err.message },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (env.NODE_ENV !== 'test') {
    console.error(err);
  }

  return res.status(500).json({
    error: { code: 'INTERNAL', message: 'Internal server error' },
  });
}
