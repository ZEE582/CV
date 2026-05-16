/**
 * @fileoverview Express Application Entry Point
 * @description Bootstraps the ttwar API server:
 *              - Security middleware (Helmet, CORS, Rate limiting)
 *              - Request parsing & session
 *              - Route registration
 *              - MongoDB connection
 *              - Global error handling
 *
 * Start with: npm run dev
 * Health check: GET /api/health
 * API docs:    GET /api-docs
 *
 * @module server
 */

import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";

// Passport config must be imported for side-effects (strategy registration)
import "./config/passport.ts";

import authRoutes from "./routes/authroutes.ts";
import oauthRoutes from "./routes/Oauthroutes.ts";
import userRoutes from "./routes/Userroutes.ts";
import swaggerSpec from "./config/swagger.ts";

const app = express();

// ─── Security: HTTP headers ───────────────────────────────────────────────────
// Helmet sets secure defaults for headers like X-Frame-Options, CSP, etc.
app.use(helmet());

// ─── Logging ──────────────────────────────────────────────────────────────────
// "dev" format: colored method + URL + status + response time (good for dev)
// Switch to "combined" (Apache format) in production
app.use(morgan("dev"));

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Only the CLIENT_URL origin is allowed — prevents cross-origin API abuse
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // required for cookies / Authorization headers
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));       // reject large payloads (DoS protection)
app.use(express.urlencoded({ extended: true })); // needed for OAuth form posts

// ─── Session ──────────────────────────────────────────────────────────────────
// Required for Passport.js OAuth flows (state parameter, etc.)
// We use stateless JWT for protected API routes, so session lifetime is kept short.
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,           // don't save session if nothing changed
    saveUninitialized: false, // don't create session for unauthenticated requests
    cookie: {
      httpOnly: true,  // prevents XSS access to the cookie via document.cookie
      secure: false,   // set to true in production (requires HTTPS)
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    },
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────

/**
 * General limiter: applied to all routes.
 * 100 requests per 15 minutes per IP — generous enough for normal use,
 * tight enough to slow down automated scrapers.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: "طلبات كثيرة جداً، حاول بعد قليل" },
  standardHeaders: true, // Return limit info in RateLimit-* headers
  legacyHeaders: false,
});

/**
 * Auth limiter: stricter limit on sensitive endpoints.
 * 10 attempts per 15 minutes — slows down brute-force credential attacks.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "محاولات كثيرة، حاول بعد 15 دقيقة" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/verify-code", authLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);   // POST /signup, /login, /verify-code, /resend-code
app.use("/api/auth", oauthRoutes);  // GET  /google, /github, /linkedin (+ callbacks)
app.use("/api/user", userRoutes);   // POST /questions, GET+PUT /profile

// ─── API Documentation ────────────────────────────────────────────────────────
// Available at: http://localhost:3000/api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// ─── Health Check ─────────────────────────────────────────────────────────────
// Simple liveness probe — useful for container orchestration (Docker, K8s)
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────
// Catch-all for any route that didn't match above
app.use((_req, res) => {
  res.status(404).json({ message: "المسار غير موجود" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Catches any error passed via next(err) from route handlers or middleware.
// Must have exactly 4 parameters to be recognized as an error handler by Express.
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Global Error:", err.message);
    res.status(err.status || 500).json({
      message: err.message || "حدث خطأ في السيرفر",
    });
  }
);

// ─── Database + Server bootstrap ──────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI as string)
  .then(() => {
    console.log("✅ MongoDB Connected");
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () =>
      console.log(`🚀 Server running → http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // exit cleanly so process manager can restart
  });