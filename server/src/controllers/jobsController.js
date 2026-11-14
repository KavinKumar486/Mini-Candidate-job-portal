import { asyncHandler } from '../utils/asyncHandler.js';
import { jobListQuerySchema, jobIdParamSchema } from '../validators/jobs.js';
import * as jobsService from '../services/jobsService.js';

export const listJobs = asyncHandler(async (req, res) => {
  const query = jobListQuerySchema.parse(req.query);
  const result = await jobsService.listJobs(query, req.user?.id);
  res.json(result);
});

export const getJob = asyncHandler(async (req, res) => {
  const { id } = jobIdParamSchema.parse(req.params);
  const job = await jobsService.getJob(id, req.user?.id);
  res.json({ job });
});
