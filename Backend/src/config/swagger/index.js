/**
 * @fileoverview Swagger Configuration Entry Point
 * @description Generates the final Swagger/OpenAPI specification.
 *
 *              This file imports the Swagger options and passes them
 *              to swagger-jsdoc. The generated specification is then
 *              exported and used in server.js by swagger-ui-express.
 *
 * @module config/swagger
 */
import swaggerJsdoc from "swagger-jsdoc";
import swaggerOptions from "./swaggerOptions.js";

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;