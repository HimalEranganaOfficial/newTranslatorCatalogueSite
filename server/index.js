require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const db = require("./db");
const translatorRoutes = require("./routes/translators");
const submissionRoutes = require("./routes/submissions");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "100kb" }));
app.use("/api/translators", translatorRoutes);
app.use("/api", submissionRoutes);
app.get("/api/health", async (_req, res, next) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    next(error);
  }
});
app.use(express.static(path.resolve(__dirname, "..")));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "The server could not complete the request." });
});

app.listen(port, () => {
  console.log(`Directory server listening on http://localhost:${port}`);
});
