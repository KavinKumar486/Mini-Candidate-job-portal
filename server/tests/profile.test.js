import request from 'supertest';
import { app, registerUser, authHeaderFor, PDF_BUFFER } from './helpers.js';

describe('profile', () => {
  async function session() {
    const { payload } = await registerUser();
    const headers = await authHeaderFor(payload.email);
    return { payload, headers };
  }

  it('updates the profile', async () => {
    const { headers } = await session();
    const res = await request(app)
      .patch('/api/profile')
      .set(headers)
      .send({
        fullName: 'Kavin Kumar',
        phone: '9876543210',
        location: 'Chennai',
        skills: ['React', ' react ', 'Node.js'],
        experienceYears: 2,
      });
    expect(res.status).toBe(200);
    expect(res.body.profile.fullName).toBe('Kavin Kumar');
    expect(res.body.profile.skills).toEqual(['React', 'Node.js']);
    expect(res.body.profile.profileCompleteness).toBeGreaterThan(0);
  });

  it('rejects invalid phone with 422', async () => {
    const { headers } = await session();
    const res = await request(app).patch('/api/profile').set(headers).send({ phone: '123' });
    expect(res.status).toBe(422);
  });

  it('rejects unauthenticated access', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
  });

  it('rejects oversize resume with 413', async () => {
    const { headers } = await session();
    const big = Buffer.alloc(5 * 1024 * 1024 + 10, 1);
    const res = await request(app)
      .post('/api/profile/resume')
      .set(headers)
      .attach('resume', big, { filename: 'cv.pdf', contentType: 'application/pdf' });
    expect(res.status).toBe(413);
  });

  it('rejects wrong file type', async () => {
    const { headers } = await session();
    const res = await request(app)
      .post('/api/profile/resume')
      .set(headers)
      .attach('resume', Buffer.from('MZ'), { filename: 'virus.exe', contentType: 'application/x-msdownload' });
    expect([400, 415]).toContain(res.status);
  });

  it('streams resume only for the owner', async () => {
    const a = await session();
    await request(app)
      .post('/api/profile/resume')
      .set(a.headers)
      .attach('resume', PDF_BUFFER, { filename: 'cv.pdf', contentType: 'application/pdf' });
    const own = await request(app).get('/api/profile/resume').set(a.headers);
    expect(own.status).toBe(200);

    const b = await session();
    const other = await request(app).get('/api/profile/resume').set(b.headers);
    expect(other.status).toBe(404);
  });
});
