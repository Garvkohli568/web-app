const express = require("express");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// EJS views (make sure the folder name is exactly "Views")
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "Views"));

// Parse form data
app.use(express.urlencoded({ extended: true }));

// Simple session setup
app.use(
  session({
    secret: "secret123",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 15 }, // 15 minutes
  })
);

// Home
app.get("/", (req, res) => {
  res.render("index", { loggedIn: Boolean(req.session.user) });
});

// Login form
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// Login submit
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "Garvkohli568" && password === "123") {
    req.session.user = username;
    return res.redirect("/dashboard");
  }
  return res.status(401).render("login", { error: "Invalid username or password" });
});

// Protected dashboard
app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("dashboard", { user: req.session.user });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// Health for monitoring
app.get("/health", (req, res) => res.json({ status: "OK" }));

app.listen(PORT, () => {
  console.log(`App running: http://localhost:${PORT}`);
});

module.exports = app; // for Jest/Supertest
