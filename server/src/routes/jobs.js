import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/authenticate.js';
import * as jobsController from '../controllers/jobsController.js';
import * as applicationsController from '../controllers/applicationsController.js';

const router = Router();

router.get('/', optionalAuth, jobsController.listJobs);
router.get('/:id', optionalAuth, jobsController.getJob);
router.post('/:jobId/apply', authenticate, applicationsController.apply);

export default router;
