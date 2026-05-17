/**
 * @fileoverview Swagger Setup
 * @description Registers Swagger API documentation endpoint.
 *
 * @module config/app/swagger
 */

import swaggerUi from "swagger-ui-express";

import swaggerSpec from "../swagger/index.js";

export default function setupSwagger(app) {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
  );
}