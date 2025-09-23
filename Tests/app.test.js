const request = require("supertest");
const app = require("../server");

describe("web app", function () {
  test("GET / shows Home", async function () {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Welcome to My App/);
  });

  test("GET /health returns OK", async function () {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
  });

  test("login -> dashboard (admin/123)", async function () {
    const agent = request.agent(app);
    const login = await agent.post("/login").send("username=admin&password=123");
    expect(login.status).toBe(302);
    const dash = await agent.get("/dashboard");
    expect(dash.status).toBe(200);
    expect(dash.text).toMatch(/Hello, admin/);
  });

  test("reject bad password", async function () {
    const res = await request(app).post("/login").send("username=admin&password=bad");
    expect(res.status).toBe(401);
    expect(res.text).toMatch(/Invalid username or password/);
  });
});
