import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { patchProfileSchema } from '../validators/profile.js';
import * as profileService from '../services/profileService.js';
import { storage } from '../storage/index.js';

const ALLOWED_EXT = new Set(['.pdf', '.doc', '.docx']);
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXT.has(ext) || !ALLOWED_MIME.has(file.mimetype)) {
      cb(new AppError(415, 'UNSUPPORTED_MEDIA', 'Resume must be pdf, doc, or docx'));
      return;
    }
    cb(null, true);
  },
});

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfile(req.user.id);
  res.json({ profile });
});

export const patchProfile = asyncHandler(async (req, res) => {
  const body = patchProfileSchema.parse(req.body);
  const profile = await profileService.updateProfile(req.user.id, body);
  res.json({ profile });
});

export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Resume file is required');
  }
  const ext = path.extname(req.file.originalname).toLowerCase();
  const storedName = `${randomUUID()}${ext}`;
  await storage.save(req.file.buffer, storedName);
  const profile = await profileService.saveResume(req.user.id, { storedName });
  res.json({ profile });
});

export const downloadResume = asyncHandler(async (req, res) => {
  const storedName = await profileService.getResumeForUser(req.user.id);
  const abs = storage.absolutePath(storedName);
  res.setHeader('Content-Disposition', `inline; filename="resume${path.extname(storedName)}"`);
  res.sendFile(abs);
});
