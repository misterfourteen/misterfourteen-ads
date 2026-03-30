import { z } from "zod";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import {
  pipelineStages,
  leads,
  leadActivities,
  pipelineAutomations,
  metaConnections,
} from "../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

// ─── Default stages factory ──────────────────────────────────────────────────

const DEFAULT_STAGES = [
  { name: "Nuevo lead", color: "#6366f1", position: 0 },
  { name: "Contactado", color: "#f59e0b", position: 1 },
  { name: "Llamada agendada", color: "#3b82f6", position: 2 },
  { name: "Propuesta enviada", color: "#8b5cf6", position: 3 },
  { name: "Cerrado ✓", color: "#22c55e", position: 4 },
  { name: "Perdido ✗", color: "#ef4444", position: 5 },
];

async function ensureDefaultStages(userId: number) {
  const existing = await db.query.pipelineStages.findFirst({
    where: eq(pipelineStages.userId, userId),
  });

  if (!existing) {
    await db.insert(pipelineStages).values(
      DEFAULT_STAGES.map((s) => ({
        userId,
        name: s.name,
        color: s.color,
        position: s.position,
        isDefault: true,
      }))
    );
  }
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const pipelineRouter = router({
  // Get full pipeline (stages + leads)
  getBoard: protectedProcedure.query(async ({ ctx }) => {
    await ensureDefaultStages(ctx.user.id);

    const stages = await db.query.pipelineStages.findMany({
      where: eq(pipelineStages.userId, ctx.user.id),
      orderBy: [asc(pipelineStages.position)],
    });

    const allLeads = await db.query.leads.findMany({
      where: eq(leads.userId, ctx.user.id),
      orderBy: [asc(leads.position)],
    });

    const leadsPerStage: Record<number, typeof allLeads> = {};
    for (const stage of stages) {
      leadsPerStage[stage.id] = allLeads.filter((l) => l.stageId === stage.id);
    }

    // Summary stats
    const totalLeads = allLeads.length;
    const closedLeads = allLeads.filter((l) => {
      const stage = stages.find((s) => s.id === l.stageId);
      return stage?.name.includes("Cerrado");
    }).length;
    const totalValue = allLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);

    return {
      stages: stages.map((s) => ({
        ...s,
        leads: leadsPerStage[s.id] ?? [],
        leadCount: (leadsPerStage[s.id] ?? []).length,
      })),
      stats: {
        totalLeads,
        closedLeads,
        conversionRate: totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0,
        totalValue,
      },
    };
  }),

  // Create or update stage
  upsertStage: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1).max(128),
        color: z.string().default("#6366f1"),
        position: z.number().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.id) {
        await db
          .update(pipelineStages)
          .set({ name: input.name, color: input.color, position: input.position })
          .where(and(eq(pipelineStages.id, input.id), eq(pipelineStages.userId, ctx.user.id)));
        return { success: true };
      }

      const [result] = await db.insert(pipelineStages).values({
        userId: ctx.user.id,
        name: input.name,
        color: input.color,
        position: input.position,
        isDefault: false,
      });

      return { success: true, id: result.insertId };
    }),

  // Delete stage (moves leads to first stage)
  deleteStage: protectedProcedure
    .input(z.object({ stageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const firstStage = await db.query.pipelineStages.findFirst({
        where: and(
          eq(pipelineStages.userId, ctx.user.id),
        ),
        orderBy: [asc(pipelineStages.position)],
      });

      if (firstStage && firstStage.id !== input.stageId) {
        await db
          .update(leads)
          .set({ stageId: firstStage.id })
          .where(and(eq(leads.stageId, input.stageId), eq(leads.userId, ctx.user.id)));
      }

      await db
        .delete(pipelineStages)
        .where(and(eq(pipelineStages.id, input.stageId), eq(pipelineStages.userId, ctx.user.id)));

      return { success: true };
    }),

  // Create lead manually
  createLead: protectedProcedure
    .input(
      z.object({
        stageId: z.number(),
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        notes: z.string().optional(),
        value: z.number().optional(),
        tags: z.array(z.string()).optional(),
        source: z
          .enum(["meta_lead_ad", "landing_page", "manual", "whatsapp", "email", "other"])
          .default("manual"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify stage belongs to user
      const stage = await db.query.pipelineStages.findFirst({
        where: and(eq(pipelineStages.id, input.stageId), eq(pipelineStages.userId, ctx.user.id)),
      });
      if (!stage) throw new TRPCError({ code: "NOT_FOUND", message: "Stage not found" });

      // Get max position
      const maxPos = await db
        .select({ max: sql<number>`MAX(position)` })
        .from(leads)
        .where(and(eq(leads.stageId, input.stageId), eq(leads.userId, ctx.user.id)));

      const position = (maxPos[0]?.max ?? -1) + 1;

      const [result] = await db.insert(leads).values({
        userId: ctx.user.id,
        stageId: input.stageId,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        notes: input.notes ?? null,
        value: input.value ?? null,
        tags: JSON.stringify(input.tags ?? []),
        source: input.source,
        position,
      });

      return { success: true, id: result.insertId };
    }),

  // Update lead
  updateLead: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        notes: z.string().optional(),
        value: z.number().optional(),
        tags: z.array(z.string()).optional(),
        probability: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const filtered: Record<string, any> = {};
      for (const [k, v] of Object.entries(updates)) {
        if (v !== undefined) {
          filtered[k] = k === "tags" ? JSON.stringify(v) : v;
        }
      }
      filtered.updatedAt = new Date();

      await db
        .update(leads)
        .set(filtered)
        .where(and(eq(leads.id, id), eq(leads.userId, ctx.user.id)));

      return { success: true };
    }),

  // Move lead to different stage (drag & drop)
  moveLead: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        toStageId: z.number(),
        position: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await db.query.leads.findFirst({
        where: and(eq(leads.id, input.leadId), eq(leads.userId, ctx.user.id)),
      });
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });

      const fromStageId = lead.stageId;

      await db
        .update(leads)
        .set({ stageId: input.toStageId, position: input.position, updatedAt: new Date() })
        .where(and(eq(leads.id, input.leadId), eq(leads.userId, ctx.user.id)));

      // Log activity if stage changed
      if (fromStageId !== input.toStageId) {
        const [fromStage, toStage] = await Promise.all([
          db.query.pipelineStages.findFirst({ where: eq(pipelineStages.id, fromStageId) }),
          db.query.pipelineStages.findFirst({ where: eq(pipelineStages.id, input.toStageId) }),
        ]);

        await db.insert(leadActivities).values({
          leadId: input.leadId,
          userId: ctx.user.id,
          type: "stage_change",
          content: `Movido de "${fromStage?.name}" a "${toStage?.name}"`,
          metadata: JSON.stringify({ fromStageId, toStageId: input.toStageId }),
        });

        // Run automations for this stage change
        await runAutomations(ctx.user.id, "stage_change", {
          leadId: input.leadId,
          toStageId: input.toStageId,
          lead,
        });
      }

      return { success: true };
    }),

  // Delete lead
  deleteLead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(leads)
        .where(and(eq(leads.id, input.id), eq(leads.userId, ctx.user.id)));
      return { success: true };
    }),

  // Get lead details with activities
  getLead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const lead = await db.query.leads.findFirst({
        where: and(eq(leads.id, input.id), eq(leads.userId, ctx.user.id)),
      });
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });

      const activities = await db.query.leadActivities.findMany({
        where: eq(leadActivities.leadId, input.id),
        orderBy: [desc(leadActivities.createdAt)],
        limit: 50,
      });

      return { ...lead, activities };
    }),

  // Add activity to lead
  addActivity: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        type: z.enum(["note", "email", "call", "whatsapp", "stage_change", "task", "meeting"]),
        content: z.string(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify lead ownership
      const lead = await db.query.leads.findFirst({
        where: and(eq(leads.id, input.leadId), eq(leads.userId, ctx.user.id)),
      });
      if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });

      await db.insert(leadActivities).values({
        leadId: input.leadId,
        userId: ctx.user.id,
        type: input.type,
        content: input.content,
        metadata: JSON.stringify(input.metadata ?? {}),
      });

      await db
        .update(leads)
        .set({ lastContactedAt: new Date(), updatedAt: new Date() })
        .where(eq(leads.id, input.leadId));

      return { success: true };
    }),

  // Ingest lead from Meta Lead Ads webhook
  ingestMetaLead: protectedProcedure
    .input(
      z.object({
        metaLeadId: z.string(),
        metaAdId: z.string().optional(),
        metaCampaignId: z.string().optional(),
        metaFormId: z.string().optional(),
        fieldData: z.array(z.object({ name: z.string(), values: z.array(z.string()) })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensureDefaultStages(ctx.user.id);

      // Parse field data
      const fields: Record<string, string> = {};
      for (const field of input.fieldData) {
        fields[field.name] = field.values[0] ?? "";
      }

      const name =
        fields["full_name"] ??
        `${fields["first_name"] ?? ""} ${fields["last_name"] ?? ""}`.trim() ||
        "Lead sin nombre";
      const email = fields["email"] ?? null;
      const phone = fields["phone_number"] ?? fields["phone"] ?? null;

      // Get first stage
      const firstStage = await db.query.pipelineStages.findFirst({
        where: eq(pipelineStages.userId, ctx.user.id),
        orderBy: [asc(pipelineStages.position)],
      });
      if (!firstStage) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No stages" });

      const maxPos = await db
        .select({ max: sql<number>`MAX(position)` })
        .from(leads)
        .where(and(eq(leads.stageId, firstStage.id), eq(leads.userId, ctx.user.id)));

      await db.insert(leads).values({
        userId: ctx.user.id,
        stageId: firstStage.id,
        name,
        email,
        phone,
        source: "meta_lead_ad",
        metaLeadId: input.metaLeadId,
        metaAdId: input.metaAdId ?? null,
        metaCampaignId: input.metaCampaignId ?? null,
        metaFormId: input.metaFormId ?? null,
        customFields: JSON.stringify(fields),
        position: (maxPos[0]?.max ?? -1) + 1,
      });

      return { success: true };
    }),

  // Get automations
  getAutomations: protectedProcedure.query(async ({ ctx }) => {
    return await db.query.pipelineAutomations.findMany({
      where: eq(pipelineAutomations.userId, ctx.user.id),
      orderBy: [desc(pipelineAutomations.createdAt)],
    });
  }),

  // Create automation
  createAutomation: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        trigger: z.object({
          type: z.enum(["stage_change", "lead_created", "time_delay", "tag_added"]),
          stageId: z.number().optional(),
          delayHours: z.number().optional(),
          tag: z.string().optional(),
        }),
        actions: z.array(
          z.object({
            type: z.enum(["send_whatsapp", "send_email", "add_tag", "move_stage", "notify_owner"]),
            config: z.record(z.any()),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [result] = await db.insert(pipelineAutomations).values({
        userId: ctx.user.id,
        name: input.name,
        trigger: JSON.stringify(input.trigger),
        actions: JSON.stringify(input.actions),
        isActive: true,
      });
      return { success: true, id: result.insertId };
    }),

  // Toggle automation
  toggleAutomation: protectedProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(pipelineAutomations)
        .set({ isActive: input.isActive })
        .where(and(eq(pipelineAutomations.id, input.id), eq(pipelineAutomations.userId, ctx.user.id)));
      return { success: true };
    }),

  // Pipeline stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const stages = await db.query.pipelineStages.findMany({
      where: eq(pipelineStages.userId, ctx.user.id),
    });

    const allLeads = await db.query.leads.findMany({
      where: eq(leads.userId, ctx.user.id),
    });

    const byStage = stages.map((s) => {
      const stageLeads = allLeads.filter((l) => l.stageId === s.id);
      return {
        stageId: s.id,
        stageName: s.name,
        color: s.color,
        count: stageLeads.length,
        value: stageLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0),
      };
    });

    const totalValue = allLeads.reduce((sum, l) => sum + (Number(l.value) || 0), 0);
    const thisMonth = allLeads.filter((l) => {
      const d = new Date(l.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    return { byStage, totalLeads: allLeads.length, totalValue, thisMonth };
  }),
});

// ─── Automation runner ────────────────────────────────────────────────────────

async function runAutomations(
  userId: number,
  triggerType: string,
  context: { leadId: number; toStageId?: number; lead: any }
) {
  try {
    const automations = await db.query.pipelineAutomations.findMany({
      where: and(
        eq(pipelineAutomations.userId, userId),
        eq(pipelineAutomations.isActive, true)
      ),
    });

    for (const automation of automations) {
      const trigger = typeof automation.trigger === "string"
        ? JSON.parse(automation.trigger)
        : automation.trigger;

      if (trigger.type !== triggerType) continue;
      if (triggerType === "stage_change" && trigger.stageId !== context.toStageId) continue;

      const actions = typeof automation.actions === "string"
        ? JSON.parse(automation.actions)
        : automation.actions;

      for (const action of actions) {
        // Execute actions (in production, these would be queued)
        if (action.type === "add_tag" && action.config?.tag) {
          const lead = await db.query.leads.findFirst({
            where: eq(leads.id, context.leadId),
          });
          if (lead) {
            const tags = JSON.parse((lead.tags as string) ?? "[]");
            tags.push(action.config.tag);
            await db.update(leads).set({ tags: JSON.stringify(tags) }).where(eq(leads.id, context.leadId));
          }
        }
      }

      await db
        .update(pipelineAutomations)
        .set({
          executionCount: sql`execution_count + 1`,
          lastExecutedAt: new Date(),
        })
        .where(eq(pipelineAutomations.id, automation.id));
    }
  } catch (e) {
    console.error("Automation error:", e);
  }
}
