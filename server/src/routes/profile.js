import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as profileController from '../controllers/profileController.js';

const router = Router();

router.use(authenticate);
router.get('/', profileController.getProfile);
router.patch('/', profileController.patchProfile);
router.post('/resume', profileController.resumeUpload.single('resume'), profileController.uploadResume);
router.get('/resume', profileController.downloadResume);

export default router;
