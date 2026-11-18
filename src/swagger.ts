
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

export function setupSwagger(app: Express) {
  const loginParam = {
    name: "login",
    in: "path",
    required: true,
    schema: { type: "string", example: "hchowdhu" }
  };

  const spec = {
    openapi: "3.0.3",

    info: {
      title: "42 Horizon API",
      version: "1.0.0",
      description: "Backend API documentation for 42 Horizon"
    },

    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Development"
      },
      {
        url: "https://42horizon.fr",
        description: "Production"
      }
    ],

    tags: [
      { name: "System" },
      { name: "Students" },
      { name: "Authentication" }
    ],

    paths: {
      "/api": {
        get: {
          tags: ["System"],
          summary: "API status",
          responses: {
            200: { description: "Backend running" }
          }
        }
      },

      "/api/health": {
        get: {
          tags: ["System"],
          summary: "Health check",
          responses: {
            200: { description: "Backend healthy" }
          }
        }
      },

      "/api/students/{login}": {
        get: {
          tags: ["Students"],
          summary: "Get student profile",
          parameters: [loginParam],
          responses: {
            200: { description: "Student profile retrieved" },
            400: { description: "Invalid login" },
            502: { description: "42 API error" }
          }
        }
      },

      "/api/students/{login}/projects": {
        get: {
          tags: ["Students"],
          summary: "Get student project history",
          parameters: [loginParam],
          responses: {
            200: { description: "Student projects retrieved" },
            400: { description: "Invalid login" },
            502: { description: "42 API error" }
          }
        }
      },

      "/api/auth/42": {
        get: {
          tags: ["Authentication"],
          summary: "Login with 42",
          description:
            "### [Click here to Login with 42](/api/auth/42)\n\n" +
            "After authentication, return to Swagger and " +
            "execute **GET /api/auth/me** to verify your session.\n\n" +
            "Use the link instead of Try it out because OAuth " +
            "requires browser navigation.",
          responses: {
            302: { description: "Redirect to 42 Intranet" },
            500: { description: "OAuth configuration error" }
          }
        }
      },

      "/api/auth/42/callback": {
        get: {
          tags: ["Authentication"],
          summary: "42 OAuth callback",
          description:
            "Automatically called by 42 after authentication. " +
            "Do not execute manually.",
          parameters: [
            {
              name: "code",
              in: "query",
              required: true,
              schema: { type: "string" }
            },
            {
              name: "state",
              in: "query",
              required: true,
              schema: { type: "string" }
            }
          ],
          responses: {
            302: { description: "Authentication successful" },
            400: { description: "Invalid OAuth callback" },
            502: { description: "42 API error" }
          }
        }
      },

      "/api/auth/me": {
        get: {
          tags: ["Authentication"],
          summary: "Get authenticated user",
          description:
            "Returns the currently logged-in 42 student. " +
            "Requires an active browser session.",
          responses: {
            200: {
              description: "Authenticated user",
              content: {
                "application/json": {
                  example: {
                    id: 12345,
                    login: "student42",
                    name: "Example Student"
                  }
                }
              }
            },
            401: { description: "Not authenticated" }
          }
        }
      },

      "/api/auth/logout": {
        post: {
          tags: ["Authentication"],
          summary: "Logout from 42 Horizon",
          description:
            "Destroys the current session. " +
            "After logout, GET /api/auth/me should return 401.",
          responses: {
            200: {
              description: "Logout successful",
              content: {
                "application/json": {
                  example: {
                    message: "Successfully logged out"
                  }
                }
              }
            },
            500: { description: "Session error" }
          }
        }
      }
    }
  };

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      swaggerOptions: {
        withCredentials: true,
        docExpansion: "list",
        displayRequestDuration: true
      }
    })
  );
}
