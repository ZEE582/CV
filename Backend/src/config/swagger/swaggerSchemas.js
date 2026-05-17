/**
 * @fileoverview Swagger Schemas
 * @description Defines reusable OpenAPI schemas used across the API docs.
 *
 *              These schemas describe the structure of common API responses,
 *              such as error responses and user objects.
 *
 * @module config/swagger/swaggerSchemas
 */
const swaggerSchemas = {
  Error: {
    type: "object",
    properties: {
      message: {
        type: "string",
        example: "حدث خطأ في السيرفر",
      },
    },
  },
  User: {
    type: "object",
    properties: {
      id: { type: "string", },
      email: {
        type: "string",
        format: "email",
      },
      name: {type: "string",},
      avatar: {type: "string",},
      role: {
        type: "string",
        enum: ["user", "admin"],
      },
      provider: {
        type: "string",
        enum: ["local", "google", "github", "linkedin"],
      },
      hasCompletedQuestions: {type: "boolean",},
      onboardingData: {type: "object",},
    },
  },
};

export default swaggerSchemas;