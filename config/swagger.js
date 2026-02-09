/**
 * OpenAPI spec for GateKeeper. Used only when NODE_ENV !== 'production'.
 */
module.exports = {
  openapi: "3.0.3",
  info: {
    title: "GateKeeper API",
    description: "Rate limiting service: register clients, check limits, set custom limits.",
    version: "1.0.0",
  },
  servers: [{ url: "/", description: "Current host" }],
  paths: {
    "/": {
      get: {
        summary: "Health check",
        description: "Returns service status (no auth required).",
        responses: {
          200: {
            description: "Service is running",
            content: {
              "application/json": {
                example: { status: "ok", message: "🚦 GateKeeper is running" },
              },
            },
          },
        },
      },
    },
    "/register": {
      post: {
        summary: "Register a new client",
        description:
          "Creates a client and returns a one-time API key. Store it securely; it is not shown again.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["clientName", "email"],
                properties: {
                  clientName: { type: "string", example: "My App" },
                  email: { type: "string", format: "email", example: "dev@example.com" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Client registered",
            content: {
              "application/json": {
                example: {
                  message: "Client registered successfully. Store this API key securely; it won't be shown again.",
                  clientId: "uuid-here",
                  apiKey: "hex-key",
                },
              },
            },
          },
          400: { description: "clientName and email required, or email already registered" },
        },
      },
    },
    "/check-limit": {
      post: {
        summary: "Check rate limit (protected)",
        description: "Checks whether the client is within rate limit. Requires Authorization header with API key.",
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  clientId: { type: "string", description: "Client UUID (optional if authenticated)" },
                  ip: { type: "string", description: "IP fallback" },
                  route: { type: "string", description: "Route identifier" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Limit check result",
            content: {
              "application/json": {
                example: { allowed: true, remaining: 9, retryAfter: 0, limit: 10, window: 60 },
              },
            },
          },
          401: { description: "API key required or invalid" },
          429: { description: "Too many requests" },
        },
      },
    },
    "/set-limit": {
      post: {
        summary: "Set custom rate limit (protected)",
        description: "Set limit and window for a client/route. Requires Authorization header. Clients can only set their own limits.",
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["clientId", "limit", "window"],
                properties: {
                  clientId: { type: "string" },
                  route: { type: "string" },
                  limit: { type: "integer", example: 20 },
                  window: { type: "integer", example: 120 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Limit updated",
            content: {
              "application/json": {
                example: {
                  message: "Limit updated",
                  identifier: "clientId:/route",
                  limit: 20,
                  window: 120,
                },
              },
            },
          },
          400: { description: "clientId, limit, window are required" },
          401: { description: "API key required or invalid" },
          403: { description: "Cannot modify limits for other clients" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description: "API key returned from POST /register",
      },
    },
  },
};
