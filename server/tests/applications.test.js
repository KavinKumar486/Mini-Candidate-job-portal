import request from 'supertest';
import { app, registerUser, authHeaderFor, createJob, uploadResume } from './helpers.js';
import { env } from '../src/config/env.js';

async function readyCandidate() {
  const { payload, res } = await registerUser();
  const headers = await authHeaderFor(payload.email);
  await request(app).patch('/api/profile').set(headers).send({
    fullName: 'Ready Candidate',
    phone: '9876543210',
  });
  await uploadResume(headers);
  return { payload, headers, user: res.body.user };
}

describe('applications', () => {
  it('applies successfully', async () => {
    const { headers } = await readyCandidate();
    const job = await createJob();
    const res = await request(app)
      .post(`/api/jobs/${job.id}/apply`)
      .set(headers)
      .send({ coverNote: 'Excited to join' });
    expect(res.status).toBe(201);
    expect(res.body.application.status).toBe('SUBMITTED');
  });

  it('rejects a duplicate application', async () => {
    const { headers } = await readyCandidate();
    const job = await createJob();
    await request(app).post(`/api/jobs/${job.id}/apply`).set(headers).send({});
    const res = await request(app).post(`/api/jobs/${job.id}/apply`).set(headers).send({});
    expect(res.status).toBe(409);
  });

  it('allows only one of two concurrent applies', async () => {
    const { headers } = await readyCandidate();
    const job = await createJob();
    const [a, b] = await Promise.all([
      request(app).post(`/api/jobs/${job.id}/apply`).set(headers).send({}),
      request(app).post(`/api/jobs/${job.id}/apply`).set(headers).send({}),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([201, 409]);
  });

  it('rejects applying to a closed job', async () => {
    const { headers } = await readyCandidate();
    const job = await createJob({ status: 'CLOSED' });
    const res = await request(app).post(`/api/jobs/${job.id}/apply`).set(headers).send({});
    expect(res.status).toBe(409);
  });

  it('rejects incomplete profiles with missing fields', async () => {
    const { payload } = await registerUser();
    const headers = await authHeaderFor(payload.email);
    const job = await createJob();
    const res = await request(app).post(`/api/jobs/${job.id}/apply`).set(headers).send({});
    expect(res.status).toBe(422);
    expect(res.body.error.details.missing).toEqual(expect.arrayContaining(['phone', 'resume']));
  });

  it('lists with status filter', async () => {
    const { headers } = await readyCandidate();
    const jobA = await createJob({ title: 'A' });
    const jobB = await createJob({ title: 'B' });
    const first = await request(app).post(`/api/jobs/${jobA.id}/apply`).set(headers).send({});
    await request(app).post(`/api/jobs/${jobB.id}/apply`).set(headers).send({});
    await request(app)
      .patch(`/api/admin/applications/${first.body.application.id}/status`)
      .set('X-Admin-Key', env.ADMIN_API_KEY)
      .send({ status: 'UNDER_REVIEW' });
    const listed = await request(app).get('/api/applications').set(headers).query({ status: 'SUBMITTED' });
    expect(listed.body.items).toHaveLength(1);
    expect(listed.body.items[0].job.title).toBe('B');
  });

  it('returns timeline in order and hides other users', async () => {
    const { headers } = await readyCandidate();
    const job = await createJob();
    const created = await request(app).post(`/api/jobs/${job.id}/apply`).set(headers).send({});
    const id = created.body.application.id;
    await request(app)
      .patch(`/api/admin/applications/${id}/status`)
      .set('X-Admin-Key', env.ADMIN_API_KEY)
      .send({ status: 'UNDER_REVIEW', note: 'Looking good' });
    const detail = await request(app).get(`/api/applications/${id}`).set(headers);
    expect(detail.body.application.history.map((h) => h.toStatus)).toEqual(['SUBMITTED', 'UNDER_REVIEW']);

    const other = await readyCandidate();
    const cross = await request(app).get(`/api/applications/${id}`).set(other.headers);
    expect(cross.status).toBe(404);
  });

  it('validates transitions', async () => {
    const { headers } = await readyCandidate();
    const job = await createJob();
    const created = await request(app).post(`/api/jobs/${job.id}/apply`).set(headers).send({});
    const id = created.body.application.id;
    const bad = await request(app)
      .patch(`/api/admin/applications/${id}/status`)
      .set('X-Admin-Key', env.ADMIN_API_KEY)
      .send({ status: 'HIRED' });
    expect(bad.status).toBe(409);
    const ok = await request(app)
      .patch(`/api/admin/applications/${id}/status`)
      .set('X-Admin-Key', env.ADMIN_API_KEY)
      .send({ status: 'UNDER_REVIEW' });
    expect(ok.status).toBe(200);
  });

  it('allows withdraw from a non-terminal state', async () => {
    const { headers } = await readyCandidate();
    const job = await createJob();
    const created = await request(app).post(`/api/jobs/${job.id}/apply`).set(headers).send({});
    const res = await request(app)
      .post(`/api/applications/${created.body.application.id}/withdraw`)
      .set(headers);
    expect(res.status).toBe(200);
    expect(res.body.application.status).toBe('WITHDRAWN');
  });
});
