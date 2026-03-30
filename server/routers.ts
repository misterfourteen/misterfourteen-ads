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
import Stripe from "stripe";
import { getPlanLimits, PLANS } from "./stripe/products";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

// ─── Admin procedure ───────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});

// ─── Brand Brain Router ────────────────────────────────────────────────────────
const brandBrainRouter = router({
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const brain = await getBrandBrainByUserId(ctx.user.id);
    return brain ?? null;
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
        variantCount: z.number().min(1).max(10).optional().default(3),
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
        duration: z.enum(["15s", "30s", "60s", "90s", "2min"]),
        platform: z.enum(["reels", "stories", "feed", "youtube_shorts"]),
        objective: z.string(),
        scriptStyle: z.enum(["storytelling", "direct", "testimonial", "educational", "provocative"]).optional(),
        tone: z.enum(["urgency", "curiosity", "authority", "empathy", "motivational"]).optional(),
        additionalContext: z.string().optional(),
        quantity: z.number().min(1).max(3).optional().default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const brain = await getBrandBrainByUserId(ctx.user.id);
      if (!brain?.isComplete) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Completa tu Brand Brain primero" });

      const systemMsg = brain.masterPrompt ?? `Eres un experto en guiones de vídeo publicitario para el sector fitness.`;

      const styleGuide: Record<string, string> = {
        storytelling: "narrativa de transformación personal, historia con inicio-conflicto-resolución",
        direct: "directo al grano, beneficios claros, sin rodeos, CTA fuerte",
        testimonial: "voz de cliente real, experiencia personal, resultados concretos",
        educational: "enseña algo valioso, posiciona como experto, educa antes de vender",
        provocative: "rompe creencias, genera controversia positiva, desafía el status quo",
      };

      const toneGuide: Record<string, string> = {
        urgency: "crea urgencia real, escasez, tiempo limitado",
        curiosity: "genera intriga, deja preguntas abiertas, hook misterioso",
        authority: "habla desde la experiencia, datos y resultados, posición de experto",
        empathy: "conecta emocionalmente, entiende el dolor, habla de tú a tú",
        motivational: "energía alta, inspiración, transforma la mentalidad",
      };

      const chosenStyle = input.scriptStyle ?? "direct";
      const chosenTone = input.tone ?? "motivational";
      const quantity = input.quantity ?? 1;

      const buildPrompt = (variantNum: number) => `Genera un guión de vídeo publicitario para Meta Ads (variante ${variantNum} de ${quantity}):
- Duración: ${input.duration}
- Plataforma: ${input.platform}
- Objetivo: ${input.objective}
- Negocio: ${brain.businessName} (${brain.niche})
- Tono de marca: ${brain.communicationTone ?? "directo"}
- Estilo de guión: ${styleGuide[chosenStyle]}
- Tono emocional: ${toneGuide[chosenTone]}
- Dolor del cliente: ${brain.targetPains ?? ""}
- Diferenciador: ${brain.mainDifferentiator ?? ""}
${input.additionalContext ? `- Contexto: ${input.additionalContext}` : ""}
${quantity > 1 ? `- IMPORTANTE: Esta es la variante ${variantNum}. Debe ser DIFERENTE a las otras variantes en enfoque y estructura.` : ""}

Estructura obligatoria:
**HOOK (0-3s):** [primera frase gancho, texto en pantalla]
**DESARROLLO:** [cuerpo del guión con indicaciones de cámara]
**CTA:** [llamada a la acción clara]

Incluye indicaciones de cámara entre corchetes y texto en pantalla en MAYÚSCULAS.`;

      // Generate multiple scripts in parallel if quantity > 1
      const generatePromises = Array.from({ length: quantity }, (_, i) =>
        invokeLLM({
          messages: [
            { role: "system", content: systemMsg },
            { role: "user", content: buildPrompt(i + 1) },
          ],
        })
      );

      const responses = await Promise.all(generatePromises);
      const scripts = responses.map(r => {
        const raw = r.choices[0]?.message?.content;
        return typeof raw === "string" ? raw : JSON.stringify(raw) ?? "";
      });

      // Save all scripts
      const savedItems = await Promise.all(
        scripts.map(scriptContent =>
          saveGeneratedContent({
            userId: ctx.user.id,
            brandBrainId: brain.id,
            type: "script",
            content: scriptContent,
            adFormat: input.platform,
            objective: input.objective,
          })
        )
      );

      return {
        scripts: savedItems.map((saved, i) => ({
          id: saved.id,
          script: scripts[i],
          style: chosenStyle,
          tone: chosenTone,
        })),
        // Keep backward compat
        id: savedItems[0].id,
        script: scripts[0],
      };
    }),

  image: protectedProcedure
    .input(
      z.object({
        adFormat: z.enum(["feed", "story", "reel_cover", "banner", "carousel", "portrait"]),
        concept: z.string(),
        visualStyle: z.enum(["photorealistic", "illustration", "minimalist", "bold", "cinematic", "free"]).optional(),
        quantity: z.number().min(1).max(4).optional().default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const brain = await getBrandBrainByUserId(ctx.user.id);
      if (!brain?.isComplete) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Completa tu Brand Brain primero" });

      const formatDimensions: Record<string, string> = {
        feed: "square 1:1 aspect ratio",
        story: "vertical 9:16 aspect ratio",
        reel_cover: "vertical 9:16 aspect ratio",
        banner: "horizontal 1.91:1 aspect ratio, landscape",
        carousel: "square 1:1 aspect ratio, carousel card",
        portrait: "vertical 4:5 aspect ratio",
      };

      const styleGuide: Record<string, string> = {
        photorealistic: "ultra-realistic photography, professional lighting, DSLR quality",
        illustration: "digital illustration, vector art style, clean lines",
        minimalist: "minimalist design, lots of white space, clean and simple",
        bold: "bold colors, high contrast, dynamic composition, energetic",
        cinematic: "cinematic photography, dramatic lighting, film-like quality",
        free: "creative freedom, any style that best fits the concept, no restrictions",
      };

      const chosenStyle = input.visualStyle ?? (brain.visualStyle as string) ?? "photorealistic";
      const styleDesc = styleGuide[chosenStyle] ?? styleGuide.photorealistic;

      const quantity = input.quantity ?? 1;
      const imagePrompt = `Professional advertising image for ${brain.businessName}, a ${brain.niche} fitness brand. 
Style: ${styleDesc}.
Color palette: primary ${brain.primaryColor ?? "#1a1a2e"}, accent ${brain.accentColor ?? "#e94560"}.
Concept: ${input.concept}.
Format: ${formatDimensions[input.adFormat]}.
Target audience: fitness and nutrition professionals seeking transformation.
No text overlays. Clean, conversion-focused composition. High production value.`;

      // Generate multiple images in parallel
      const generatePromises = Array.from({ length: quantity }, () =>
        generateImage({ prompt: imagePrompt })
      );
      const generatedImages = await Promise.all(generatePromises);

      // Save all generated images
      const savedItems = await Promise.all(
        generatedImages.map(({ url: imageUrl }) =>
          saveGeneratedContent({
            userId: ctx.user.id,
            brandBrainId: brain.id,
            type: "image",
            imageUrl,
            imagePrompt,
            adFormat: input.adFormat,
            objective: input.concept,
          })
        )
      );

      return {
        images: savedItems.map((saved, i) => ({
          id: saved.id,
          imageUrl: generatedImages[i].url,
          prompt: imagePrompt,
          format: input.adFormat,
          style: chosenStyle,
        })),
        // Keep backward compat
        id: savedItems[0].id,
        imageUrl: generatedImages[0].url,
        prompt: imagePrompt,
      };
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

  abTest: protectedProcedure
    .input(z.object({
      objective: z.string(),
      adFormat: z.string(),
      additionalContext: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const brain = await getBrandBrainByUserId(ctx.user.id);
      if (!brain) throw new TRPCError({ code: "BAD_REQUEST", message: "Completa tu Brand Brain primero" });

      const systemMsg = brain.masterPrompt ?? `Eres un experto copywriter de Meta Ads para el sector fitness. Hablas de forma directa, honesta y orientada a resultados.`;
      const userMsg = `Genera exactamente 3 variantes de copy publicitario para un test A/B en Meta Ads.

Objetivo: ${input.objective}
Formato: ${input.adFormat}
${input.additionalContext ? `Contexto adicional: ${input.additionalContext}` : ""}

Cada variante debe usar un ángulo psicológico DIFERENTE:
- Variante A: ángulo emocional (dolor/deseo)
- Variante B: ángulo racional (lógica/resultados/números)
- Variante C: ángulo de prueba social (testimonios/comunidad)

Devuelve JSON con esta estructura exacta:
{
  "variants": [
    { "id": "a", "label": "Variante A", "angle": "Emocional", "hook": "primera frase gancho", "content": "copy completo" },
    { "id": "b", "label": "Variante B", "angle": "Racional", "hook": "primera frase gancho", "content": "copy completo" },
    { "id": "c", "label": "Variante C", "angle": "Prueba social", "hook": "primera frase gancho", "content": "copy completo" }
  ],
  "recommendation": "cuál variante recomiendas probar primero y por qué (2-3 frases)",
  "testingTip": "consejo específico para hacer el test en Meta Ads con este objetivo"
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: userMsg },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ab_test_result",
            strict: true,
            schema: {
              type: "object",
              properties: {
                variants: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      label: { type: "string" },
                      angle: { type: "string" },
                      hook: { type: "string" },
                      content: { type: "string" },
                    },
                    required: ["id", "label", "angle", "hook", "content"],
                    additionalProperties: false,
                  },
                },
                recommendation: { type: "string" },
                testingTip: { type: "string" },
              },
              required: ["variants", "recommendation", "testingTip"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = response.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
      return parsed;
    }),

  // ─── Landing page generator
  landing: protectedProcedure
    .input(z.object({
      type: z.enum(["lead_capture", "sales", "webinar", "challenge", "free_resource"]),
      style: z.enum(["modern", "minimal", "bold", "corporate"]),
      additionalContext: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const brain = await getBrandBrainByUserId(ctx.user.id);
      const systemMsg = brain?.masterPrompt ?? "Eres un experto en copywriting y diseño de landing pages para el sector fitness online.";
      const userMsg = `Genera el contenido completo para una landing page de tipo "${input.type}" con estilo "${input.style}".\n${input.additionalContext ? `Contexto: ${input.additionalContext}` : ""}\nDevuelve JSON con: { headline, subheadline, cta, benefits: string[], sections: Array<{title,content}> }`;
      const response = await invokeLLM({ messages: [{ role: "system", content: systemMsg }, { role: "user", content: userMsg }] });
      const rawContent = response.choices[0]?.message?.content ?? "{}";
      let landingParsed: Record<string, unknown> = {};
      try { landingParsed = JSON.parse(typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent)); } catch { landingParsed = { headline: rawContent }; }
      return landingParsed;
    }),

  // ─── Competitor analysis
  analyzeCompetitor: protectedProcedure
    .input(z.object({
      competitorName: z.string(),
      niche: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const brain = await getBrandBrainByUserId(ctx.user.id);
      const systemMsg = brain?.masterPrompt ?? "Eres un estratega de marketing digital especializado en Meta Ads para el sector fitness.";
      const userMsg = `Analiza la estrategia publicitaria del competidor "${input.competitorName}"${input.niche ? ` en el nicho de ${input.niche}` : ""}.\nDevuelve JSON con: { hooks: string[], angles: string[], formats: string[], ctas: string[], weaknesses: string[], opportunities: string[] }`;
      const response = await invokeLLM({ messages: [{ role: "system", content: systemMsg }, { role: "user", content: userMsg }] });
      const rawComp = response.choices[0]?.message?.content ?? "{}";
      let compParsed: Record<string, unknown> = {};
      try { compParsed = JSON.parse(typeof rawComp === "string" ? rawComp : JSON.stringify(rawComp)); } catch { compParsed = { hooks: [rawComp] }; }
      return compParsed;
    }),

  // ─── Pipeline sequence generator
  pipeline: protectedProcedure
    .input(z.object({
      platform: z.enum(["whatsapp", "instagram", "facebook"]),
      type: z.string(),
      steps: z.number().min(1).max(10).default(5),
      additionalContext: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const brain = await getBrandBrainByUserId(ctx.user.id);
      const systemMsg = brain?.masterPrompt ?? "Eres un experto en automatización de ventas y marketing conversacional.";
      const userMsg = `Genera una secuencia de ${input.steps} mensajes para un pipeline de ${input.type} en ${input.platform}.\n${input.additionalContext ? `Contexto: ${input.additionalContext}` : ""}\nDevuelve JSON con: { steps: Array<{order,title,message,delay,action}> }`;
      const response = await invokeLLM({ messages: [{ role: "system", content: systemMsg }, { role: "user", content: userMsg }] });
      const rawPipe = response.choices[0]?.message?.content ?? "{}";
      let pipeParsed: Record<string, unknown> = {};
      try { pipeParsed = JSON.parse(typeof rawPipe === "string" ? rawPipe : JSON.stringify(rawPipe)); } catch { pipeParsed = { steps: [] }; }
      return pipeParsed;
    }),
});
// ─── Campaigns Routerr ──────────────────────────────────────────────────────────
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
        objective: z.enum(["awareness", "reach", "traffic", "engagement", "followers", "video_views", "leads", "messages", "conversions", "catalog_sales", "store_visits"]),
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
    const conn = await getMetaConnection(ctx.user.id);
    return conn ?? null;
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

// ─── Stripe Router ────────────────────────────────────────────────────────────
const stripeRouter = router({
  getPlans: publicProcedure.query(() => {
    return Object.entries(PLANS).map(([key, plan]) => ({
      key,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      currency: plan.currency,
      features: plan.features,
      limits: plan.limits,
    }));
  }),

  getMySubscription: protectedProcedure.query(async ({ ctx }) => {
    return {
      plan: ctx.user.subscriptionPlan,
      status: ctx.user.subscriptionStatus,
      limits: getPlanLimits(ctx.user.subscriptionPlan ?? "free"),
    };
  }),

  createCheckout: protectedProcedure
    .input(z.object({ planKey: z.enum(["diy", "done_with_you", "agency"]) }))
    .mutation(async ({ ctx, input }) => {
      const plan = PLANS[input.planKey];
      if (!plan.stripePriceId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Plan price not configured" });
      }
      const origin = ctx.req.headers.origin as string ?? "https://app.misterfourteen.com";
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: plan.stripePriceId, quantity: 1 }],
        customer_email: ctx.user.email ?? undefined,
        allow_promotion_codes: true,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email ?? "",
          customer_name: ctx.user.name ?? "",
        },
        success_url: `${origin}/dashboard?subscription=success`,
        cancel_url: `${origin}/pricing?canceled=true`,
      });
      return { url: session.url };
    }),

  createPortal: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user.stripeCustomerId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscription" });
    }
    const origin = ctx.req.headers.origin as string ?? "https://app.misterfourteen.com";
    const session = await stripe.billingPortal.sessions.create({
      customer: ctx.user.stripeCustomerId,
      return_url: `${origin}/dashboard`,
    });
    return { url: session.url };
  }),

  checkUsage: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { copies: 0, scripts: 0, images: 0 };
    const limits = getPlanLimits(ctx.user.subscriptionPlan ?? "free");
    // Count this month's generations
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { generatedContents } = await import("../drizzle/schema");
    const { and, gte, count } = await import("drizzle-orm");
    const rows = await db
      .select({ type: generatedContents.type, count: count() })
      .from(generatedContents)
      .where(and(eq(generatedContents.userId, ctx.user.id), gte(generatedContents.createdAt, startOfMonth)))
      .groupBy(generatedContents.type);
    const usage = { copies: 0, scripts: 0, images: 0 };
    for (const row of rows) {
      if (row.type === "copy") usage.copies = row.count;
      if (row.type === "script") usage.scripts = row.count;
      if (row.type === "image") usage.images = row.count;
    }
    return { usage, limits };
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
// ─── Support Router ─────────────────────────────────────────────────────────────────────────────
const supportRouter = router({
  chat: protectedProcedure
    .input(z.object({
      message: z.string().min(1).max(500),
      history: z.array(z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })).optional().default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const brain = await getBrandBrainByUserId(ctx.user.id);
      const systemMsg = `Eres el asistente de soporte de Mister Fourteen, una plataforma SaaS de creación y gestión de anuncios en Meta Ads con inteligencia artificial para entrenadores y nutricionistas online.

Tu rol:
- Ayudar a los usuarios con dudas sobre la plataforma (Brand Brain, generadores de IA, campañas, A/B testing, conexión con Meta)
- Dar consejos prácticos sobre Meta Ads para el sector fitness
- Ser directo, claro y profesional. Sin rodeos.
- Si el usuario tiene Brand Brain configurado, personaliza tus respuestas a su negocio

${brain ? `Contexto del usuario: ${brain.businessName ?? ""} - Nicho: ${brain.niche ?? ""} - Plan: ${ctx.user.subscriptionPlan ?? "free"}` : `El usuario aún no ha configurado su Brand Brain.`}

No inventes funcionalidades que no existen. Si no sabes algo, dílo con honestidad.`;

      const messages = [
        { role: "system" as const, content: systemMsg },
        ...input.history.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
        { role: "user" as const, content: input.message },
      ];

      const response = await invokeLLM({ messages });
      const reply = response.choices[0]?.message?.content ?? "Lo siento, no pude procesar tu mensaje. Inténtalo de nuevo.";
      return { reply: typeof reply === "string" ? reply : JSON.stringify(reply) };
    }),
});

// ─── Profile Router ───────────────────────────────────────────────────────────
const profileRouter = router({
  update: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(128).optional(),
      email: z.string().email().optional(),
      avatarUrl: z.string().url().optional().or(z.literal("")),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.email !== undefined) updates.email = input.email;
      if (input.avatarUrl !== undefined) updates.avatarUrl = input.avatarUrl;
      if (Object.keys(updates).length === 0) return { success: true };
      await db.update(users).set(updates).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
  saveDashboardLayout: protectedProcedure
    .input(z.object({ layout: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });
      await db.update(users).set({ dashboardLayout: input.layout }).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
});

// ─── New routers from GitHub ──────────────────────────────────────────────────
import { metaRouter as metaSuiteRouter } from "./meta.router";
import { pipelineRouter } from "./pipeline.router";
import { aiRouter } from "./ai.router";

// ─── App Router ──────────────────────────────────────────────────────────────
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
  meta: metaSuiteRouter,
  admin: adminRouter,
  stripe: stripeRouter,
  support: supportRouter,
  profile: profileRouter,
  pipeline: pipelineRouter,
  ai: aiRouter,
});
export type AppRouter = typeof appRouter;
