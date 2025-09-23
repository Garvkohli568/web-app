// Tests/app.test.js
const request = require('supertest');
const app = require('../server'); // server.js must do: module.exports = app

describe('web app', () => {
  test('GET /health returns OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });
});
