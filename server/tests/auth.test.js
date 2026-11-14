import request from 'supertest';
import { app, uniqueEmail, registerUser, expiredToken } from './helpers.js';

describe('auth', () => {
  it('registers a candidate', async () => {
    const { res, payload } = await registerUser();
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(payload.email.toLowerCase());
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.profile.fullName).toBe('Test User');
  });

  it('rejects duplicate email with 409', async () => {
    const email = uniqueEmail();
    await registerUser({ email });
    const { res } = await registerUser({ email });
    expect(res.status).toBe(409);
  });

  it('rejects weak password with 422', async () => {
    const { res } = await registerUser({ password: 'short' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('logs in and returns an access token', async () => {
    const { payload } = await registerUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });
    expect(res.status).toBe(200);
    expect(res.body.tokenType).toBe('Bearer');
    expect(res.body.accessToken).toBeTruthy();
  });

  it('returns the same 401 for wrong password and unknown email', async () => {
    const { payload } = await registerUser();
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: 'Wrongpass1' });
    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'Password1' });
    expect(wrongPassword.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(unknown.body.error.message);
  });

  it('rejects /me without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid token', async () => {
    const { payload, res: created } = await registerUser();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: payload.email, password: payload.password });
    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.user.id).toBe(created.body.user.id);
  });

  it('rejects an expired token', async () => {
    const { res: created } = await registerUser();
    const token = expiredToken(created.body.user.id);
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(401);
  });
});
