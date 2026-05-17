/**
 * @fileoverview Server Entry Point
 * @description Bootstraps the ttwar backend server.
 *
 * @module server
 */
import "dotenv/config";
import express from "express";
import "./config/passport/index.js";
import "./listeners/index.js";
import setupMiddlewares from "./config/app/middlewares.js";
import setupRoutes from "./config/app/routes.js";
import setupSwagger from "./config/app/swagger.js";
import setupHealth from "./config/app/health.js";
import setupErrors from "./config/app/errors.js";
import { connectDatabase } from "./config/app/database.js";
const app = express();
setupMiddlewares(app);
setupRoutes(app);
setupSwagger(app);
setupHealth(app);
setupErrors(app);
await connectDatabase();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `🚀 Server running → http://localhost:${PORT}`
  );
});