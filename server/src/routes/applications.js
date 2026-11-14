import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import * as applicationsController from '../controllers/applicationsController.js';

const router = Router();

router.use(authenticate);
router.get('/', applicationsController.list);
router.get('/:id', applicationsController.getOne);
router.post('/:id/withdraw', applicationsController.withdraw);

export default router;
