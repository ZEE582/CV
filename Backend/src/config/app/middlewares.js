/**
 * @fileoverview Express Middlewares
 * @description Registers security and parsing middlewares.
 *
 * @module config/app/middlewares
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import session from "express-session";
export default function setupMiddlewares(app) {
  app.use(helmet());
  app.use(morgan("dev"));
  app.use(
     cors({
      origin: "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(
    express.json({
      limit: "10kb",
    })
  );
  app.use(
    express.urlencoded({
      extended: true,
    })
  );
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge:
          24 * 60 * 60 * 1000,
      },
    })
  );
}