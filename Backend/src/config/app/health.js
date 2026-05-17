/**
 * @fileoverview Health Route
 * @description Registers API health check endpoint.
 *
 * @module config/app/health
 */

import mongoose from "mongoose";

export default function setupHealth(app) {
  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",

      uptime: process.uptime(),

      timestamp: new Date().toISOString(),

      mongodb:
        mongoose.connection.readyState === 1
          ? "connected"
          : "disconnected",
    });
  });
}