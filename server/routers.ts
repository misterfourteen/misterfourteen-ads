/**
 * server/routers.ts
 *
 * Registro centralizado de todos los routers tRPC.
 * Añade aquí cualquier nuevo router que crees.
 */

import { router } from "./_core/trpc";

// ── Existing routers ─────────────────────────────────────────────────────────
// (importa los que ya tenías en tu proyecto)
import { systemRouter } from "./_core/systemRouter";

// ── New routers ───────────────────────────────────────────────────────────────
import { metaRouter } from "./meta.router";
import { pipelineRouter } from "./pipeline.router";
import { aiRouter } from "./ai.router";

export const appRouter = router({
  system: systemRouter,

  // Meta Business Suite
  meta: metaRouter,

  // Pipeline CRM
  pipeline: pipelineRouter,

  // AI Content Engine
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
