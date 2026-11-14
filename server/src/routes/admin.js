import { Router } from 'express';
import { requireAdminKey } from '../middleware/adminKey.js';
import * as adminController from '../controllers/adminController.js';

const router = Router();

router.patch('/applications/:id/status', requireAdminKey, adminController.setStatus);

export default router;
