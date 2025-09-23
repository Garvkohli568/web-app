// Tests/app.test.js
const request = require('supertest');
const app = require('../server'); // server.js must export the Express app

describe('web app', () => {
  test('GET /health returns OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });

  test('login -> dashboard (admin/123)', async () => {
    const agent = request.agent(app);                // keep cookies (session)
    const login = await agent.post('/login').send('username=admin&password=123');
    expect(login.status).toBe(302);                  // redirected after login

    const dash = await agent.get('/dashboard');
    expect(dash.status).toBe(200);
    expect(dash.text).toMatch(/Hello,\s*admin/i);
  });

  test('rejects bad password', async () => {
    const res = await request(app).post('/login').send('username=admin&password=bad');
    expect(res.status).toBe(401);
    expect(res.text).toMatch(/Invalid username or password/i);
  });

  test('unauthenticated dashboard redirects to /login', async () => {
    const res = await request(app).get('/dashboard');
    expect([302, 303]).toContain(res.status);
    expect(res.headers.location).toMatch(/\/login$/);
  });
});
