import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(root, '.env') });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('1d'),
  CORS_ORIGIN: z.string().min(1),
  UPLOAD_DIR: z.string().default('./uploads'),
  ADMIN_API_KEY: z.string().min(8),
  BODY_LIMIT: z.string().default('1mb'),
  BCRYPT_COST: z.coerce.number().int().min(10).default(10),
});

function loadEnv() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.flatten().fieldErrors;
    if (process.env.NODE_ENV === 'test' && !process.env.DATABASE_URL) {
      throw new Error(`Invalid environment: ${JSON.stringify(details)}`);
    }
    console.error('Invalid environment:', details);
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
}

export const env = loadEnv();
