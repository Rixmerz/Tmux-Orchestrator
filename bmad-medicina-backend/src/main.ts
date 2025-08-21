import { Application } from "@oak/oak";
import { oakCors } from "@oak/cors";
import { router } from "./infrastructure/web/routes.ts";
import { config } from "./infrastructure/config/config.ts";
import { logger } from "./infrastructure/logging/logger.ts";
import { initializeKV } from "./infrastructure/database/kv.ts";

// Initialize DenoKV connection
await initializeKV();

const app = new Application();

// CORS middleware for frontend integration
app.use(oakCors({
  origin: ["http://localhost:8000", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Logging middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info(
    `${ctx.request.method} ${ctx.request.url.pathname} - ${ctx.response.status} - ${ms}ms`,
  );
});

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const error = err as Error & { status?: number };
    logger.error(`Error: ${error.message}`, error);
    ctx.response.status = error.status || 500;
    ctx.response.body = {
      error: {
        message: error.message || "Internal Server Error",
        status: error.status || 500,
        timestamp: new Date().toISOString(),
      },
    };
  }
});

// Health check endpoint
app.use(async (ctx, next) => {
  if (ctx.request.url.pathname === "/health") {
    ctx.response.status = 200;
    ctx.response.body = {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: config.environment,
    };
    return;
  }
  await next();
});

// API routes
app.use(router.routes());
app.use(router.allowedMethods());

// Start server
const port = config.port;
logger.info(`🏥 BMad Medicina Backend starting on port ${port}`);
logger.info(`📊 Environment: ${config.environment}`);
logger.info(`🔐 Security: Ley 19.628 compliance enabled`);

await app.listen({ port });
