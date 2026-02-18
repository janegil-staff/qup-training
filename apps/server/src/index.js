import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import routes from "./routes/index.js";

const app = express();

// ─── Security ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
// Rate limiting disabled for development
// app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// ─── Body parsing ────────────────────────────────────────────────────
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ──────────────────────────────────────────────────────────
app.use("/api", routes);

// ─── Health check ────────────────────────────────────────────────────
app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date() }),
);

// ─── 404 ─────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ─── Error handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// ─── Start ───────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`\n🚀 FitGlass server running on port ${env.port}`);
    console.log(`   Health: http://localhost:${env.port}/health`);
    console.log(`   API:    http://localhost:${env.port}/api\n`);
  });
};

start();
