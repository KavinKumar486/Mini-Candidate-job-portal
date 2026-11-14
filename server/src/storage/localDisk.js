import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env.js';

function resolveUploadDir() {
  return path.isAbsolute(env.UPLOAD_DIR)
    ? env.UPLOAD_DIR
    : path.resolve(process.cwd(), env.UPLOAD_DIR);
}

export function getLocalDiskDriver() {
  const dir = resolveUploadDir();
  fs.mkdirSync(dir, { recursive: true });

  return {
    kind: 'local',
    dir,
    async save(buffer, storedName) {
      const dest = path.join(dir, storedName);
      await fsp.writeFile(dest, buffer);
      return storedName;
    },
    exists(storedName) {
      return fs.existsSync(path.join(dir, storedName));
    },
    createReadStream(storedName) {
      return fs.createReadStream(path.join(dir, storedName));
    },
    absolutePath(storedName) {
      return path.join(dir, storedName);
    },
  };
}
