import { getLocalDiskDriver } from './localDisk.js';

/**
 * Storage abstraction. Local disk is the current driver.
 * An S3/Cloudinary driver would implement the same { save, exists, createReadStream }
 * surface and be selected via env (e.g. STORAGE_DRIVER=s3) without changing controllers.
 * On Render/Railway the disk is ephemeral — files vanish on restart unless object storage is used.
 */
export const storage = getLocalDiskDriver();
