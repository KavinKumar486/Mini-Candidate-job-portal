import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env') });

process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '4000';
process.env.DATABASE_URL =
  process.env.DATABASE_URL_TEST || 'mysql://root:root@localhost:3307/jobs_portal_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-32chars!!';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads-test';
process.env.ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'test-admin-key-please';
process.env.BODY_LIMIT = '1mb';
process.env.BCRYPT_COST = '10';
