import { asyncHandler } from '../utils/asyncHandler.js';
import {
  applySchema,
  applicationIdParam,
  jobIdParam,
  listApplicationsQuery,
} from '../validators/applications.js';
import * as applicationsService from '../services/applicationsService.js';

export const apply = asyncHandler(async (req, res) => {
  const { jobId } = jobIdParam.parse(req.params);
  const body = applySchema.parse(req.body);
  const application = await applicationsService.applyToJob(req.user, jobId, body);
  res.status(201).json({ application });
});

export const list = asyncHandler(async (req, res) => {
  const query = listApplicationsQuery.parse(req.query);
  const result = await applicationsService.listMine(req.user.id, query);
  res.json(result);
});

export const getOne = asyncHandler(async (req, res) => {
  const { id } = applicationIdParam.parse(req.params);
  const application = await applicationsService.getMine(req.user.id, id);
  res.json({ application });
});

export const withdraw = asyncHandler(async (req, res) => {
  const { id } = applicationIdParam.parse(req.params);
  const application = await applicationsService.withdraw(req.user.id, id);
  res.json({ application });
});
