import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import { generatedContents, brandBrains, aiGenerationJobs } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";

// ─── AI Provider clients ──────────────────────────────────────────────────────

async function callClaude(systemPrompt: string, userPrompt: string, maxTokens = 1500): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`Claude error: ${data.error.message}`);
  return data.content?.[0]?.text ?? "";
}

async function callOpenAIImage(prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(`OpenAI image error: ${data.error.message}`);
  return data.data?.[0]?.url ?? "";
}

// ─── Brand Brain system prompt builder ───────────────────────────────────────

function buildBrandBrainPrompt(brain: any): string {
  return `Eres un experto copywriter especializado en marketing digital para el sector fitness y nutrición.

MARCA: ${brain.businessName}
NICHO: ${brain.niche}${brain.subNiche ? ` > ${brain.subNiche}` : ""}
TONO DE COMUNICACIÓN: ${brain.communicationTone}
VOZ DE MARCA: ${brain.brandVoice ?? "Directa y motivadora"}
${brain.wordsToAvoid ? `PALABRAS A EVITAR: ${brain.wordsToAvoid}` : ""}
${brain.targetPains ? `DOLORES DEL AVATAR: ${brain.targetPains}` : ""}
${brain.targetDesires ? `DESEOS DEL AVATAR: ${brain.targetDesires}` : ""}
${brain.targetObjections ? `OBJECIONES COMUNES: ${brain.targetObjections}` : ""}
${brain.mainDifferentiator ? `DIFERENCIADOR PRINCIPAL: ${brain.mainDifferentiator}` : ""}
${brain.methodology ? `METODOLOGÍA: ${brain.methodology}` : ""}
${brain.successCases ? `CASOS DE ÉXITO: ${brain.successCases}` : ""}
EDAD OBJETIVO: ${brain.targetAgeRange ?? "25-45"}
GÉNERO: ${brain.targetGender ?? "all"}
${brain.masterPrompt ? `\nINSTRUCCIONES ADICIONALES DE MARCA:\n${brain.masterPrompt}` : ""}

REGLAS:
- Escribe SIEMPRE en español de España
- Usa el tono y voz de marca definidos arriba
- Nunca uses las palabras prohibidas
- Todo el contenido debe resonar con los dolores y deseos del avatar`;
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const aiRouter = router({
  // ── Copy generation ──────────────────────────────────────────────────────

  generateCopy: protectedProcedure
    .input(
      z.object({
        brandBrainId: z.number(),
        format: z.enum([
          "facebook_primary",
          "facebook_headline",
          "instagram_caption",
          "story_copy",
          "lead_magnet",
          "vsl_hook",
          "email_subject",
          "whatsapp_followup",
        ]),
        objective: z.string().default("leads"),
        additionalContext: z.string().optional(),
        variations: z.number().min(1).max(5).default(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const brain = await db.query.brandBrains.findFirst({
        where: and(
          eq(brandBrains.id, input.brandBrainId),
          eq(brandBrains.userId, ctx.user.id)
        ),
      });
      if (!brain) throw new TRPCError({ code: "NOT_FOUND", message: "Brand Brain no encontrado" });

      const formatDescriptions: Record<string, string> = {
        facebook_primary: "texto principal de anuncio de Facebook (150-300 palabras), con hook potente, historia, prueba social y CTA",
        facebook_headline: "titular de anuncio de Facebook (máximo 40 caracteres), impactante y con beneficio claro",
        instagram_caption: "caption de Instagram (200-400 palabras) con emojis, hashtags y CTA",
        story_copy: "texto para historia de Instagram/Facebook (máximo 60 palabras), urgente y directo",
        lead_magnet: "copy para lead magnet/oferta gratuita que capture el máximo de leads posibles",
        vsl_hook: "hook inicial de VSL (Video Sales Letter) para los primeros 30 segundos",
        email_subject: "5 asuntos de email diferentes con alta tasa de apertura",
        whatsapp_followup: "mensaje de WhatsApp de seguimiento para leads fríos",
      };

      const systemPrompt = buildBrandBrainPrompt(brain);
      const userPrompt = `Genera ${input.variations} variación(es) de ${formatDescriptions[input.format]}.

OBJETIVO DE LA CAMPAÑA: ${input.objective}
${input.additionalContext ? `CONTEXTO ADICIONAL: ${input.additionalContext}` : ""}

Devuelve SOLO las variaciones numeradas (1., 2., 3.) sin explicaciones adicionales. Cada variación separada por ---`;

      const result = await callClaude(systemPrompt, userPrompt, 2000);

      // Save to library
      const [saved] = await db.insert(generatedContents).values({
        userId: ctx.user.id,
        brandBrainId: input.brandBrainId,
        type: "copy",
        prompt: userPrompt,
        content: result,
        adFormat: input.format,
        objective: input.objective,
      });

      return {
        id: saved.insertId,
        content: result,
        variations: result
          .split("---")
          .map((v) => v.trim())
          .filter(Boolean),
      };
    }),

  // ── Script generation ─────────────────────────────────────────────────────

  generateScript: protectedProcedure
    .input(
      z.object({
        brandBrainId: z.number(),
        format: z.enum([
          "ugc_30s",
          "ugc_60s",
          "story_15s",
          "testimonial",
          "problem_solution",
          "before_after",
          "day_in_life",
          "vsl_full",
        ]),
        objective: z.string().default("leads"),
        additionalContext: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const brain = await db.query.brandBrains.findFirst({
        where: and(
          eq(brandBrains.id, input.brandBrainId),
          eq(brandBrains.userId, ctx.user.id)
        ),
      });
      if (!brain) throw new TRPCError({ code: "NOT_FOUND", message: "Brand Brain no encontrado" });

      const formatGuides: Record<string, string> = {
        ugc_30s: "guión UGC de 30 segundos (~75 palabras): hook (0-3s), problema (3-10s), solución (10-20s), CTA (20-30s). Formato casual, primera persona.",
        ugc_60s: "guión UGC de 60 segundos (~150 palabras): hook potente, historia personal, transformación, prueba, CTA urgente.",
        story_15s: "guión para historia de 15 segundos: texto en pantalla + narración. Ultra directo.",
        testimonial: "guión de testimonio de cliente: situación inicial, proceso, resultado, recomendación.",
        problem_solution: "guión problema-solución: muestra el dolor intenso, presenta la solución, muestra resultado.",
        before_after: "guión antes-después: estado antes (con dolor), transformación, estado después (con resultado específico).",
        day_in_life: "guión 'un día en mi vida': mañana con el método, resultados integrados en el día.",
        vsl_full: "VSL completo (5-7 minutos): hook, historia, problema agravado, solución, prueba social, oferta, garantía, CTA urgente.",
      };

      const systemPrompt = buildBrandBrainPrompt(brain);
      const userPrompt = `Crea un ${formatGuides[input.format]}.

OBJETIVO: ${input.objective}
${input.additionalContext ? `CONTEXTO: ${input.additionalContext}` : ""}

Formato del guión:
[TÍTULO DEL GUIÓN]

[TIEMPO 0-Xs] NARRACIÓN: "texto hablado"
ACCIÓN: (qué hace en pantalla)
TEXTO EN PANTALLA: "texto overlay"

Continúa con todos los segmentos. Al final incluye NOTAS DE GRABACIÓN con 3 consejos de producción.`;

      const result = await callClaude(systemPrompt, userPrompt, 2500);

      const [saved] = await db.insert(generatedContents).values({
        userId: ctx.user.id,
        brandBrainId: input.brandBrainId,
        type: "script",
        prompt: userPrompt,
        content: result,
        adFormat: input.format,
        objective: input.objective,
      });

      return { id: saved.insertId, content: result };
    }),

  // ── Image generation ──────────────────────────────────────────────────────

  generateImage: protectedProcedure
    .input(
      z.object({
        brandBrainId: z.number(),
        format: z.enum([
          "facebook_feed",
          "instagram_square",
          "instagram_story",
          "facebook_story",
          "banner",
        ]),
        style: z.enum([
          "photorealistic",
          "lifestyle",
          "before_after",
          "text_based",
          "infographic",
          "minimalist",
        ]),
        description: z.string(),
        includeText: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const brain = await db.query.brandBrains.findFirst({
        where: and(
          eq(brandBrains.id, input.brandBrainId),
          eq(brandBrains.userId, ctx.user.id)
        ),
      });
      if (!brain) throw new TRPCError({ code: "NOT_FOUND", message: "Brand Brain no encontrado" });

      const formatSpecs: Record<string, string> = {
        facebook_feed: "1200x628px, landscape, Facebook feed ad",
        instagram_square: "1080x1080px, square, Instagram feed ad",
        instagram_story: "1080x1920px, vertical story format",
        facebook_story: "1080x1920px, vertical story format",
        banner: "1200x400px, horizontal banner",
      };

      const styleGuides: Record<string, string> = {
        photorealistic: "photorealistic photography, professional lighting, high quality DSLR",
        lifestyle: "lifestyle photography, natural light, authentic and aspirational",
        before_after: "split image before/after transformation, clear contrast",
        text_based: "bold typography on clean background, minimal design",
        infographic: "clean infographic style, icons, data visualization",
        minimalist: "minimalist design, white space, clean lines",
      };

      const prompt = `${styleGuides[input.style]} for fitness/nutrition coaching ad. 
${input.description}
Brand: ${brain.businessName}, niche: ${brain.niche}
Primary color: ${brain.primaryColor ?? "#000000"}, style: ${brain.visualStyle ?? "professional"}
Format: ${formatSpecs[input.format]}
${input.includeText ? "Include compelling text overlay" : "No text overlay, clean image only"}
High quality, professional advertising image, eye-catching, conversion-optimized`;

      // Create job record
      const [job] = await db.insert(aiGenerationJobs).values({
        userId: ctx.user.id,
        type: "image",
        status: "processing",
        provider: "dall-e-3",
        inputData: JSON.stringify(input),
        startedAt: new Date(),
      });

      try {
        const imageUrl = await callOpenAIImage(prompt);

        await db.update(aiGenerationJobs).set({
          status: "completed",
          outputData: JSON.stringify({ imageUrl }),
          completedAt: new Date(),
        }).where(eq(aiGenerationJobs.id, job.insertId));

        const [saved] = await db.insert(generatedContents).values({
          userId: ctx.user.id,
          brandBrainId: input.brandBrainId,
          type: "image",
          imageUrl,
          imagePrompt: prompt,
          adFormat: input.format,
        });

        return { id: saved.insertId, imageUrl, prompt };
      } catch (err: any) {
        await db.update(aiGenerationJobs).set({
          status: "failed",
          errorMessage: err.message,
          completedAt: new Date(),
        }).where(eq(aiGenerationJobs.id, job.insertId));
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
      }
    }),

  // ── Brand Brain master prompt generation ─────────────────────────────────

  generateMasterPrompt: protectedProcedure
    .input(z.object({ brandBrainId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const brain = await db.query.brandBrains.findFirst({
        where: and(
          eq(brandBrains.id, input.brandBrainId),
          eq(brandBrains.userId, ctx.user.id)
        ),
      });
      if (!brain) throw new TRPCError({ code: "NOT_FOUND", message: "Brand Brain no encontrado" });

      const prompt = `Analiza esta información de marca y crea un "Master Prompt" ultra-detallado que capture perfectamente la esencia, voz y estilo de comunicación para usar en todas las generaciones de contenido.

DATOS DE LA MARCA:
- Negocio: ${brain.businessName}
- Nicho: ${brain.niche}
- Sub-nicho: ${brain.subNiche ?? "N/A"}
- Tono: ${brain.communicationTone}
- Voz de marca: ${brain.brandVoice ?? "N/A"}
- Dolores del cliente: ${brain.targetPains ?? "N/A"}
- Deseos del cliente: ${brain.targetDesires ?? "N/A"}
- Objeciones: ${brain.targetObjections ?? "N/A"}
- Diferenciador: ${brain.mainDifferentiator ?? "N/A"}
- Metodología: ${brain.methodology ?? "N/A"}
- Casos de éxito: ${brain.successCases ?? "N/A"}

Crea un Master Prompt de 200-300 palabras que sirva como guía maestra para cualquier IA al generar contenido para esta marca. Debe incluir: identidad, audiencia, tono, estilo de escritura, palabras clave que usar, patrones de copy que funcionan, qué evitar.`;

      const masterPrompt = await callClaude(
        "Eres un experto en brand strategy y copywriting para el sector fitness y nutrición.",
        prompt,
        600
      );

      await db.update(brandBrains).set({
        masterPrompt,
        updatedAt: new Date(),
      }).where(eq(brandBrains.id, input.brandBrainId));

      return { masterPrompt };
    }),

  // ── Content library ───────────────────────────────────────────────────────

  getLibrary: protectedProcedure
    .input(
      z.object({
        type: z.enum(["copy", "script", "image", "all"]).default("all"),
        limit: z.number().default(20),
        offset: z.number().default(0),
        favoritesOnly: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(generatedContents.userId, ctx.user.id)];
      if (input.type !== "all") conditions.push(eq(generatedContents.type, input.type as any));
      if (input.favoritesOnly) conditions.push(eq(generatedContents.isFavorite, true));

      const items = await db.query.generatedContents.findMany({
        where: and(...conditions),
        orderBy: [desc(generatedContents.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      return items;
    }),

  // Toggle favorite
  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.number(), isFavorite: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(generatedContents)
        .set({ isFavorite: input.isFavorite })
        .where(
          and(
            eq(generatedContents.id, input.id),
            eq(generatedContents.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // Delete content
  deleteContent: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(generatedContents)
        .where(
          and(
            eq(generatedContents.id, input.id),
            eq(generatedContents.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  // ── Competitor research ───────────────────────────────────────────────────

  analyzeCompetitor: protectedProcedure
    .input(
      z.object({
        brandBrainId: z.number(),
        competitorUrl: z.string().optional(),
        competitorDescription: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const brain = await db.query.brandBrains.findFirst({
        where: and(
          eq(brandBrains.id, input.brandBrainId),
          eq(brandBrains.userId, ctx.user.id)
        ),
      });
      if (!brain) throw new TRPCError({ code: "NOT_FOUND", message: "Brand Brain no encontrado" });

      const result = await callClaude(
        buildBrandBrainPrompt(brain),
        `Analiza este competidor y dame un informe de oportunidades para ${brain.businessName}:

COMPETIDOR: ${input.competitorDescription}
${input.competitorUrl ? `URL: ${input.competitorUrl}` : ""}

Proporciona:
1. ANÁLISIS DE SU PROPUESTA DE VALOR (qué comunican bien)
2. DEBILIDADES Y GAPS (qué les falta o hacen mal)
3. OPORTUNIDADES PARA ${brain.businessName.toUpperCase()} (cómo diferenciarse)
4. IDEAS DE COPY (5 ángulos de copy que puedes usar para atacar sus debilidades)
5. RECOMENDACIÓN DE POSICIONAMIENTO (cómo posicionarte vs ellos)`,
        2000
      );

      return { analysis: result };
    }),

  // ── AB Testing copy variants ──────────────────────────────────────────────

  generateABVariants: protectedProcedure
    .input(
      z.object({
        brandBrainId: z.number(),
        originalCopy: z.string(),
        testElement: z.enum(["hook", "cta", "angle", "tone", "full"]),
        variants: z.number().min(2).max(4).default(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const brain = await db.query.brandBrains.findFirst({
        where: and(
          eq(brandBrains.id, input.brandBrainId),
          eq(brandBrains.userId, ctx.user.id)
        ),
      });
      if (!brain) throw new TRPCError({ code: "NOT_FOUND", message: "Brand Brain no encontrado" });

      const testGuides: Record<string, string> = {
        hook: "solo el hook (primera línea/frase)",
        cta: "solo el CTA (llamada a la acción final)",
        angle: "el ángulo de ataque completo (mismo mensaje, diferente perspectiva)",
        tone: "el tono (mismo contenido, diferente voz)",
        full: "la pieza completa con diferente estructura y ángulo",
      };

      const result = await callClaude(
        buildBrandBrainPrompt(brain),
        `Crea ${input.variants} variantes de test A/B para ${testGuides[input.testElement]}.

COPY ORIGINAL:
${input.originalCopy}

Para cada variante indica:
VARIANTE [N] - [nombre descriptivo del test]
---
[el copy modificado]
---
POR QUÉ TESTEAR ESTO: [explicación breve de la hipótesis]

Separa cada variante con ===`,
        2000
      );

      return {
        variants: result
          .split("===")
          .map((v) => v.trim())
          .filter(Boolean),
      };
    }),
});
