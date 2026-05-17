/**
 * @fileoverview Swagger Tags
 * @description Defines the main Swagger documentation sections.
 *
 *              Tags are used to group API endpoints in Swagger UI,
 *              such as Auth, OAuth, and User routes.
 *
 * @module config/swagger/swaggerTags
 */
const swaggerTags = [
  {
    name: "Auth",
    description: "Authentication APIs",
  },

  {
    name: "OAuth",
    description: "OAuth APIs",
  },

  {
    name: "User",
    description: "User APIs",
  },
];

export default swaggerTags;