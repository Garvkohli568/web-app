const request = require('supertest');
const app = require('../server');

describe('web app', () => {
  test('GET /health returns OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  test('login -> dashboard (Garvkohli568/123)', async () => {
    const agent = request.agent(app); // keep cookies (session)
    const login = await agent
      .post('/login')
      .type('form')
      .send({ username: 'Garvkohli568', password: '123' });
    expect(login.status).toBe(302);               // redirected after login

    const dash = await agent.get('/dashboard');
    expect(dash.status).toBe(200);
    expect(dash.text).toMatch(/Hello,\s*Garvkohli568/);
  });

  test('rejects bad password', async () => {
    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ username: 'Garvkohli568', password: 'bad' });
    expect(res.status).toBe(401);
    expect(res.text).toMatch(/Invalid username or password/i);
  });

  test('unauthenticated dashboard redirects to /login', async () => {
    const res = await request(app).get('/dashboard');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });
});

