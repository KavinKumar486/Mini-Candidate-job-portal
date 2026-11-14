import { buildJobWhere } from '../src/services/jobsService.js';

describe('buildJobWhere', () => {
  it('always restricts to OPEN jobs', () => {
    const where = buildJobWhere({});
    expect(where.AND[0]).toEqual({ status: 'OPEN' });
  });

  it('adds location, type, mode, salary and postedWithin', () => {
    const where = buildJobWhere({
      location: 'Pune',
      jobType: ['FULL_TIME'],
      workMode: ['REMOTE'],
      experienceLevel: 'MID',
      salaryMin: 1000000,
      postedWithin: 7,
    });
    const keys = where.AND.map((c) => Object.keys(c)[0]);
    expect(keys).toEqual(
      expect.arrayContaining(['status', 'location', 'jobType', 'workMode', 'experienceLevel', 'salaryMax', 'postedAt']),
    );
  });
});
