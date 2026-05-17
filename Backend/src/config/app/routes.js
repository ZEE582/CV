/**
 * @fileoverview Application Routes
 * @description Registers all application routes.
 *
 * @module config/app/routes
 */

import authRoutes from "../../routes/auth/index.js";
import oauthRoutes from "../../routes/oauth/index.js";
import userRoutes from "../../routes/user/index.js";

export default function setupRoutes(app) {
  app.use("/api/auth", authRoutes);

  app.use("/api/auth", oauthRoutes);

  app.use("/api/user", userRoutes);
}