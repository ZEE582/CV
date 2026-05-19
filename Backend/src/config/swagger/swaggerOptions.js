/**
 * @fileoverview Swagger Options
 * @description Defines the main OpenAPI configuration for the application.
 *
 *              Includes:
 *              - API title and version
 *              - Development server URL
 *              - JWT bearer authentication scheme
 *              - Reusable schemas
 *              - API documentation tags
 *              - Route files scanned by swagger-jsdoc
 *
 * @module config/swagger/swaggerOptions
 */
import swaggerSchemas from "./swaggerSchemas.js";
import swaggerTags from "./swaggerTags.js";
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ttwar API",
      version: "1.0.0",
      description: "API Documentation",
    },
    servers: [{url: "http://localhost:3000",},],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
    },
     schemas: swaggerSchemas,
    },
    tags: swaggerTags,
},
  apis: ["./src/routes/**/*.js"],
};
export default swaggerOptions;