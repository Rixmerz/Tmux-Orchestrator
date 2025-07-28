import { Router } from "@oak/oak";
import { MedicationController } from "./controllers/MedicationController.ts";
import { logger } from "../logging/logger.ts";

const router = new Router();
const medicationController = new MedicationController();

// API versioning
const API_PREFIX = "/api/v1";

// Health check (already handled in main.ts but included here for completeness)
router.get("/health", (ctx) => {
  ctx.response.status = 200;
  ctx.response.body = {
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "bmad-medicina-backend",
    version: "1.0.0",
  };
});

// API Info
router.get(`${API_PREFIX}`, (ctx) => {
  ctx.response.status = 200;
  ctx.response.body = {
    service: "BMad Medicina Backend API",
    version: "1.0.0",
    description: "Sistema de Adherencia Medicamentos MVP - Backend API",
    compliance: "Ley 19.628 Chilean Data Protection",
    endpoints: {
      medications: `${API_PREFIX}/medications`,
      interactions: `${API_PREFIX}/medications/interactions`,
      users: `${API_PREFIX}/users`,
      adherence: `${API_PREFIX}/adherence`,
      notifications: `${API_PREFIX}/notifications`,
    },
    documentation: "https://api.bmad.cl/docs",
  };
});

// Medication Routes
router.post(`${API_PREFIX}/medications`, async (ctx) => {
  await medicationController.create(ctx);
});

router.get(`${API_PREFIX}/medications`, async (ctx) => {
  await medicationController.list(ctx);
});

router.get(`${API_PREFIX}/medications/search`, async (ctx) => {
  await medicationController.search(ctx);
});

router.get(`${API_PREFIX}/medications/:id`, async (ctx) => {
  await medicationController.getById(ctx);
});

router.get(`${API_PREFIX}/medications/code/:code`, async (ctx) => {
  await medicationController.getByCode(ctx);
});

router.put(`${API_PREFIX}/medications/:id`, async (ctx) => {
  await medicationController.update(ctx);
});

router.delete(`${API_PREFIX}/medications/:id`, async (ctx) => {
  await medicationController.delete(ctx);
});

// Medication Interactions
router.post(`${API_PREFIX}/medications/interactions/check`, async (ctx) => {
  await medicationController.checkInteractions(ctx);
});

router.post(`${API_PREFIX}/medications/interactions`, async (ctx) => {
  await medicationController.createInteraction(ctx);
});

// Placeholder routes for future implementation
router.get(`${API_PREFIX}/users`, (ctx) => {
  ctx.response.status = 501;
  ctx.response.body = {
    error: "Not implemented yet",
    message: "User management API coming soon",
  };
});

router.get(`${API_PREFIX}/adherence`, (ctx) => {
  ctx.response.status = 501;
  ctx.response.body = {
    error: "Not implemented yet",
    message: "Adherence tracking API coming soon",
  };
});

router.get(`${API_PREFIX}/notifications`, (ctx) => {
  ctx.response.status = 501;
  ctx.response.body = {
    error: "Not implemented yet",
    message: "Notifications API coming soon",
  };
});

// 404 handler for API routes
router.all(`${API_PREFIX}/(.*)?`, (ctx) => {
  ctx.response.status = 404;
  ctx.response.body = {
    error: "API endpoint not found",
    path: ctx.request.url.pathname,
    method: ctx.request.method,
    timestamp: new Date().toISOString(),
  };
});

// Request logging middleware
router.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;

  // Log API requests (excluding health checks)
  if (!ctx.request.url.pathname.includes("/health")) {
    logger.info(
      `API ${ctx.request.method} ${ctx.request.url.pathname} - ${ctx.response.status} - ${ms}ms`,
    );
  }
});

export { router };
