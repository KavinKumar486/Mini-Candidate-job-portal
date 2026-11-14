import { asyncHandler } from '../utils/asyncHandler.js';
import { adminStatusSchema, applicationIdParam } from '../validators/applications.js';
import * as applicationsService from '../services/applicationsService.js';

export const setStatus = asyncHandler(async (req, res) => {
  const { id } = applicationIdParam.parse(req.params);
  const { status, note } = adminStatusSchema.parse(req.body);
  const application = await applicationsService.adminSetStatus(id, status, note);
  res.json({ application });
});
