/**
 * server.js — Express backend for the Carbon Credit Trading Platform.
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const validateEnv = require("./config/validateEnv");
validateEnv();

const { startEventListener } = require("./services/eventListener");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check ────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── API Routes ──────────────────────────────────────────────
const apiRoutes = require("./routes");
app.use("/api", apiRoutes);

if (require.main === module) {
  startEventListener().catch(console.error);

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
