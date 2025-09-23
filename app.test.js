const request = require("supertest");
const app = require("../server");

describe("health", function () {
  test("GET /health returns OK", async function () {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
  });
});
