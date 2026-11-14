import request from 'supertest';
import { app, createJob, registerUser, authHeaderFor } from './helpers.js';

describe('jobs', () => {
  it('filters by q', async () => {
    await createJob({ title: 'React Engineer', company: 'Foo', description: 'Frontend React role' });
    await createJob({ title: 'Java Developer', company: 'Bar', skills: ['Java'], description: 'Backend Java services' });
    const res = await request(app).get('/api/jobs').query({ q: 'react' });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].title).toMatch(/React/);
  });

  it('filters by location', async () => {
    await createJob({ location: 'Pune' });
    await createJob({ location: 'Delhi' });
    const res = await request(app).get('/api/jobs').query({ location: 'Pune' });
    expect(res.body.items).toHaveLength(1);
  });

  it('filters by jobType', async () => {
    await createJob({ jobType: 'INTERNSHIP', title: 'Intern' });
    await createJob({ jobType: 'FULL_TIME', title: 'Staff' });
    const res = await request(app).get('/api/jobs').query({ jobType: 'INTERNSHIP' });
    expect(res.body.items.every((j) => j.jobType === 'INTERNSHIP')).toBe(true);
  });

  it('filters by workMode', async () => {
    await createJob({ workMode: 'REMOTE' });
    await createJob({ workMode: 'ONSITE' });
    const res = await request(app).get('/api/jobs').query({ workMode: 'REMOTE' });
    expect(res.body.items.every((j) => j.workMode === 'REMOTE')).toBe(true);
  });

  it('filters by experienceLevel', async () => {
    await createJob({ experienceLevel: 'SENIOR' });
    await createJob({ experienceLevel: 'JUNIOR' });
    const res = await request(app).get('/api/jobs').query({ experienceLevel: 'SENIOR' });
    expect(res.body.items).toHaveLength(1);
  });

  it('filters by salaryMin', async () => {
    await createJob({ salaryMin: 500000, salaryMax: 800000, title: 'Low' });
    await createJob({ salaryMin: 2000000, salaryMax: 4000000, title: 'High' });
    const res = await request(app).get('/api/jobs').query({ salaryMin: 1000000 });
    expect(res.body.items.map((j) => j.title)).toEqual(['High']);
  });

  it('filters by skills (any match)', async () => {
    await createJob({ skills: ['Go', 'Kubernetes'], title: 'Go' });
    await createJob({ skills: ['React'], title: 'FE' });
    const res = await request(app).get('/api/jobs').query({ skills: 'react,vue' });
    expect(res.body.items).toHaveLength(1);
  });

  it('filters by postedWithin', async () => {
    await createJob({ title: 'Old', postedAt: new Date(Date.now() - 20 * 86400000) });
    await createJob({ title: 'New', postedAt: new Date() });
    const res = await request(app).get('/api/jobs').query({ postedWithin: 7 });
    expect(res.body.items.map((j) => j.title)).toEqual(['New']);
  });

  it('combines filters', async () => {
    await createJob({ title: 'React Remote', workMode: 'REMOTE', location: 'Remote' });
    await createJob({ title: 'React Onsite', workMode: 'ONSITE', location: 'Bengaluru' });
    const res = await request(app).get('/api/jobs').query({ q: 'react', workMode: 'REMOTE' });
    expect(res.body.items).toHaveLength(1);
  });

  it('paginates', async () => {
    for (let i = 0; i < 12; i += 1) {
      await createJob({ title: `Job ${i}`, postedAt: new Date(Date.now() - i * 1000) });
    }
    const page1 = await request(app).get('/api/jobs').query({ page: 1, pageSize: 5 });
    const page3 = await request(app).get('/api/jobs').query({ page: 3, pageSize: 5 });
    expect(page1.body.items).toHaveLength(5);
    expect(page1.body.total).toBe(12);
    expect(page1.body.totalPages).toBe(3);
    expect(page3.body.items).toHaveLength(2);
  });

  it('sorts by salary_desc', async () => {
    await createJob({ title: 'A', salaryMax: 100, postedAt: new Date() });
    await createJob({ title: 'B', salaryMax: 900, postedAt: new Date(Date.now() - 1000) });
    const res = await request(app).get('/api/jobs').query({ sort: 'salary_desc' });
    expect(res.body.items[0].title).toBe('B');
  });

  it('returns empty results', async () => {
    const res = await request(app).get('/api/jobs').query({ q: 'no-such-role-xyz' });
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('rejects invalid pageSize', async () => {
    const res = await request(app).get('/api/jobs').query({ pageSize: 99 });
    expect(res.status).toBe(422);
  });

  it('treats SQL-looking q as plain text', async () => {
    await createJob({ title: 'Safe Job' });
    const res = await request(app).get('/api/jobs').query({ q: "' OR 1=1 --" });
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  it('returns 404 for missing or closed jobs', async () => {
    const closed = await createJob({ status: 'CLOSED' });
    const missing = await request(app).get('/api/jobs/00000000-0000-4000-8000-000000000000');
    const hidden = await request(app).get(`/api/jobs/${closed.id}`);
    expect(missing.status).toBe(404);
    expect(hidden.status).toBe(404);
  });

  it('includes hasApplied when authenticated', async () => {
    const job = await createJob();
    const { payload } = await registerUser();
    const headers = await authHeaderFor(payload.email);
    const res = await request(app).get('/api/jobs').set(headers);
    expect(res.body.items[0].id).toBe(job.id);
    expect(res.body.items[0].hasApplied).toBe(false);
  });
});
