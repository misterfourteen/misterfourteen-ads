import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import {
  getBrandBrainByUserId,
  upsertBrandBrain,
  getGeneratedContentsByUser,
  saveGeneratedContent,
  toggleFavoriteContent,
  getCampaignsByUser,
  getCampaignById,
  upsertCampaign,
  getMetaConnection,
  upsertMetaConnection,
  getAllUsersAdmin,
  getAllBrandBrainsAdmin,
  getPlatformStats,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";

// ─── Admin procedure ───────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

// ─── Brand Brain Router ────────────────────────────────────────────────────────
const brandBrainRouter = router({
  getMine: protectedProcedure.query(async ({ ctx }) => {
    return getBrandBrainByUserId(ctx.user.id);
  }),

  save: protectedProcedure
    .input(
      z.object({
        businessName: z.string().min(1),
        niche: z.string().min(1),
        subNiche: z.string().optional(),
        targetAgeRange: z.string().optional(),
        targetGender: z.enum(["male", "female", "all"]).optional(),
        targetPains: z.string().optional(),
        targetDesires: z.string().optional(),
        targetObjections: z.string().optional(),
        communicationTone: z.enum(["motivational", "scientific", "direct", "friendly", "rebel"]).optional(),
        brandVoice: z.string().optional(),
        wordsToAvoid: z.string().optional(),
        mainDifferentiator: z.string().optional(),
        successCases: z.string().optional(),
        methodology: z.string().optional(),
        logoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        visualStyle: z.enum(["minimalist", "bold", "elegant", "energetic", "professional"]).optional(),
        onboardingStep: z.number().optional(),
        isComplete: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return upsertBrandBrain(ctx.user.id, input);
    }),

  generateMasterPrompt: protectedProcedure.mutation(async ({ ctx }) => {
    const brain = await getBrandBrainByUserId(ctx.user.id);
    if (!brain) throw new TRPCError({ code: "NOT_FOUND", message: "Brand Brain no encontrado" });

    const systemMsg = `Eres un experto en marketing digital especializado en el sector fitness y nutrición online. 
Tu tarea es crear un "prompt maestro" que capture perfectamente la esencia de la marca de un cliente para que cualquier IA pueda generar contenido perfectamente alineado con su marca.`;

    const userMsg = `Crea un prompt maestro detallado para esta marca:
- Nombre del negocio: ${brain.businessName}
- Nicho: ${brain.niche}${brain.subNiche ? ` / ${brain.subNiche}` : ""}
- Cliente ideal: ${brain.targetAgeRange ?? "no especificado"}, ${brain.targetGender ?? "todos"}
- Dolores del cliente: ${brain.targetPains ?? "no especificado"}
- Deseos del cliente: ${brain.targetDesires ?? "no especificado"}
- Objeciones comunes: ${brain.targetObjections ?? "no especificado"}
- Tono de comunicación: ${brain.communicationTone ?? "directo"}
- Voz de marca: ${brain.brandVoice ?? "no especificado"}
- Palabras a evitar: ${brain.wordsToAvoid ?? "ninguna"}
- Principal diferenciador: ${brain.mainDifferentiator ?? "no especificado"}
- Casos de éxito: ${brain.successCases ?? "no especificado"}
- Metodología: ${brain.methodology ?? "no especificado"}

El prompt maestro debe ser una instrucción de sistema completa que cualquier IA pueda usar para generar copies, guiones e imágenes que suenen exactamente como esta marca. Incluye el tono, el vocabulario, las estructuras de persuasión y los elementos visuales.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: userMsg },
      ],
    });

    const rawMasterPrompt = response.choices[0]?.message?.content;
    const masterPrompt = typeof rawMasterPrompt === 'string' ? rawMasterPrompt : JSON.stringify(rawMasterPrompt) ?? "";
    await upsertBrandBrain(ctx.user.id, { masterPrompt, isComplete: true });
    return { masterPrompt };
  }),
});

// ─── AI Generation Router ──────────────────────────────────────────────────────
const generateRouter = router({
  copy: protectedProcedure
    .input(
      z.object({
        objective: z.string(),
        adFormat: z.string(),
        additionalContext: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const brain = await getBrandBrainByUserId(ctx.user.id);
      if (!brain?.isComplete) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Completa tu Brand Brain primero" });

      const systemMsg = brain.masterPrompt ?? `Eres un experto copywriter de Meta Ads para el sector fitness. Hablas de forma directa, honesta y orientada a resultados.`;

      const userMsg = `Genera 3 variantes de copy publicitario para Meta Ads con las siguientes características:
- Objetivo de la campaña: ${input.objective}
- Formato del anuncio: ${input.adFormat}
- Negocio: ${brain.businessName} (${brain.niche})
- Cliente ideal: ${brain.targetAgeRange ?? ""}, dolores: ${brain.targetPains ?? ""}
${input.additionalContext ? `- Contexto adicional: ${input.additionalContext}` : ""}

Para cada variante incluye:
1. Texto principal (primary text) - máx 125 caracteres
2. Titular (headline) - máx 40 caracteres  
3. Descripción - máx 30 caracteres
4. CTA sugerido

Formato de respuesta: JSON con array "copies" con objetos {primaryText, headline, description, cta}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: userMsg },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ad_copies",
            strict: true,
            schema: {
              type: "object",
              properties: {
                copies: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      primaryText: { type: "string" },
                      headline: { type: "string" },
                      description: { type: "string" },
                      cta: { type: "string" },
                    },
                    required: ["primaryText", "headline", "description", "cta"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["copies"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawCopyContent = response.choices[0]?.message?.content;
      const content = typeof rawCopyContent === 'string' ? rawCopyContent : JSON.stringify(rawCopyContent) ?? "{}";
      const parsed = JSON.parse(content);

      const saved = await saveGeneratedContent({
        userId: ctx.user.id,
        brandBrainId: brain.id,
        type: "copy",
        content: content,
        adFormat: input.adFormat,
        objective: input.objective,
      });

      return { id: saved.id, copies: parsed.copies };
    }),

  script: protectedProcedure
    .input(
      z.object({
        duration: z.enum(["15s", "30s", "60s"]),
        platform: z.enum(["reels", "stories", "feed"]),
        objective: z.string(),
        additionalContext: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const brain = await getBrandBrainByUserId(ctx.user.id);
      if (!brain?.isComplete) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Completa tu Brand Brain primero" });

      const systemMsg = brain.masterPrompt ?? `Eres un experto en guiones de vídeo publicitario para el sector fitness.`;

      const userMsg = `Genera un guión de vídeo publicitario para Meta Ads:
- Duración: ${input.duration}
- Plataforma: ${input.platform}
- Objetivo: ${input.objective}
- Negocio: ${brain.businessName} (${brain.niche})
- Tono: ${brain.communicationTone ?? "directo"}
- Dolor del cliente: ${brain.targetPains ?? ""}
- Diferenciador: ${brain.mainDifferentiator ?? ""}
${input.additionalContext ? `- Contexto: ${input.additionalContext}` : ""}

El guión debe incluir: hook (primeros 3 segundos), desarrollo, CTA. Incluye indicaciones de cámara y texto en pantalla cuando sea relevante.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: userMsg },
        ],
      });

      const rawContent = response.choices[0]?.message?.content;
      const scriptContent = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent) ?? "";

      const saved = await saveGeneratedContent({
        userId: ctx.user.id,
        brandBrainId: brain.id,
        type: "script",
        content: scriptContent,
        adFormat: input.platform,
        objective: input.objective,
      });

      return { id: saved.id, script: scriptContent };
    }),

  image: protectedProcedure
    .input(
      z.object({
        adFormat: z.enum(["feed", "story", "reel_cover"]),
        concept: z.string(),
        includeText: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const brain = await getBrandBrainByUserId(ctx.user.id);
      if (!brain?.isComplete) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Completa tu Brand Brain primero" });

      const formatDimensions: Record<string, string> = {
        feed: "square 1:1",
        story: "vertical 9:16",
        reel_cover: "vertical 9:16",
      };

      const imagePrompt = `Professional advertising image for ${brain.businessName}, a ${brain.niche} brand. 
Style: ${brain.visualStyle ?? "professional"}, modern, high-quality.
Color palette: primary ${brain.primaryColor ?? "#000000"}, accent ${brain.accentColor ?? "#ff0000"}.
Concept: ${input.concept}.
Format: ${formatDimensions[input.adFormat]}.
Target audience: fitness and nutrition professionals.
No text overlays. Clean, conversion-focused composition.`;

      const { url: imageUrl } = await generateImage({ prompt: imagePrompt });

      const saved = await saveGeneratedContent({
        userId: ctx.user.id,
        brandBrainId: brain.id,
        type: "image",
        imageUrl,
        imagePrompt,
        adFormat: input.adFormat,
        objective: input.concept,
      });

      return { id: saved.id, imageUrl, prompt: imagePrompt };
    }),

  history: protectedProcedure
    .input(z.object({ type: z.enum(["copy", "script", "image"]).optional() }))
    .query(async ({ ctx, input }) => {
      return getGeneratedContentsByUser(ctx.user.id, input.type);
    }),

  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.number(), isFavorite: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return toggleFavoriteContent(input.id, ctx.user.id, input.isFavorite);
    }),
});

// ─── Campaigns Router ──────────────────────────────────────────────────────────
const campaignsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getCampaignsByUser(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const campaign = await getCampaignById(input.id, ctx.user.id);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
      return campaign;
    }),

  save: protectedProcedure
    .input(
      z.object({
        id: z.number().optional(),
        brandBrainId: z.number(),
        name: z.string().min(1),
        objective: z.enum(["awareness", "traffic", "engagement", "leads", "conversions", "sales"]),
        primaryText: z.string().optional(),
        headline: z.string().optional(),
        description: z.string().optional(),
        callToAction: z.string().optional(),
        destinationUrl: z.string().optional(),
        dailyBudget: z.string().optional(),
        totalBudget: z.string().optional(),
        ageMin: z.number().optional(),
        ageMax: z.number().optional(),
        targetLocations: z.string().optional(),
        targetInterests: z.string().optional(),
        adImageId: z.number().optional(),
        adCopyId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return upsertCampaign(ctx.user.id, input);
    }),
});

// ─── Meta Connection Router ────────────────────────────────────────────────────
const metaRouter = router({
  getConnection: protectedProcedure.query(async ({ ctx }) => {
    return getMetaConnection(ctx.user.id);
  }),

  saveConnection: protectedProcedure
    .input(
      z.object({
        accessToken: z.string(),
        metaUserId: z.string().optional(),
        metaUserName: z.string().optional(),
        adAccountId: z.string().optional(),
        adAccountName: z.string().optional(),
        pageId: z.string().optional(),
        pageName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return upsertMetaConnection(ctx.user.id, input);
    }),

  publishCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Placeholder: en producción se integraría con la Meta Marketing API
      // Por ahora actualiza el estado de la campaña a "active"
      const campaign = await getCampaignById(input.campaignId, ctx.user.id);
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });

      await upsertCampaign(ctx.user.id, {
        id: campaign.id,
        brandBrainId: campaign.brandBrainId,
        name: campaign.name,
        objective: campaign.objective,
        status: "active" as const,
      });

      return { success: true, message: "Campaña marcada como activa. Conecta tu cuenta de Meta para publicar automáticamente." };
    }),
});

// ─── Admin Router ──────────────────────────────────────────────────────────────
const adminRouter = router({
  getUsers: adminProcedure.query(async () => {
    return getAllUsersAdmin();
  }),

  getBrandBrains: adminProcedure.query(async () => {
    return getAllBrandBrainsAdmin();
  }),

  getStats: adminProcedure.query(async () => {
    return getPlatformStats();
  }),
});

// ─── App Router ────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  brandBrain: brandBrainRouter,
  generate: generateRouter,
  campaigns: campaignsRouter,
  meta: metaRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
