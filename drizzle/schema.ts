import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  boolean,
  decimal,
  bigint,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["free", "diy", "done_with_you", "agency"]).default("free").notNull(),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "inactive", "trialing", "canceled"]).default("inactive").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  avatarUrl: varchar("avatarUrl", { length: 512 }),
  dashboardLayout: text("dashboardLayout"), // JSON: widget order & visibility
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const brandBrains = mysqlTable("brandBrains", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Información básica del negocio
  businessName: varchar("businessName", { length: 255 }).notNull(),
  niche: varchar("niche", { length: 255 }).notNull(), // ej: "pérdida de grasa", "ganancia muscular"
  subNiche: varchar("subNiche", { length: 255 }),
  // Avatar del cliente ideal
  targetAgeRange: varchar("targetAgeRange", { length: 64 }),
  targetGender: mysqlEnum("targetGender", ["male", "female", "all"]).default("all"),
  targetPains: text("targetPains"), // dolores principales del cliente ideal
  targetDesires: text("targetDesires"), // deseos y aspiraciones
  targetObjections: text("targetObjections"), // objeciones comunes
  // Tono y comunicación
  communicationTone: mysqlEnum("communicationTone", ["motivational", "scientific", "direct", "friendly", "rebel"]).default("direct"),
  brandVoice: text("brandVoice"), // descripción libre del tono de marca
  wordsToAvoid: text("wordsToAvoid"), // palabras o frases que NO usar
  // Diferenciadores y resultados
  mainDifferentiator: text("mainDifferentiator"),
  successCases: text("successCases"), // casos de éxito reales
  methodology: text("methodology"), // metodología o proceso único
  // Identidad visual
  logoUrl: varchar("logoUrl", { length: 512 }),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#000000"),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#ffffff"),
  accentColor: varchar("accentColor", { length: 7 }).default("#ff0000"),
  visualStyle: mysqlEnum("visualStyle", ["minimalist", "bold", "elegant", "energetic", "professional"]).default("professional"),
  // Prompt maestro generado por IA
  masterPrompt: text("masterPrompt"),
  isComplete: boolean("isComplete").default(false).notNull(),
  onboardingStep: int("onboardingStep").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const generatedContents = mysqlTable("generatedContents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  brandBrainId: int("brandBrainId").notNull(),
  type: mysqlEnum("type", ["copy", "script", "image"]).notNull(),
  // Para copies y guiones
  prompt: text("prompt"),
  content: text("content"),
  // Para imágenes
  imageUrl: varchar("imageUrl", { length: 512 }),
  imagePrompt: text("imagePrompt"),
  // Metadatos
  adFormat: varchar("adFormat", { length: 64 }), // "feed", "story", "reel"
  objective: varchar("objective", { length: 128 }), // "awareness", "conversion", "leads"
  isFavorite: boolean("isFavorite").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  brandBrainId: int("brandBrainId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  objective: mysqlEnum("objective", ["awareness", "reach", "traffic", "engagement", "followers", "video_views", "leads", "messages", "conversions", "catalog_sales", "store_visits"]).notNull(),
  status: mysqlEnum("status", ["draft", "active", "paused", "completed", "error"]).default("draft").notNull(),
  // Contenido del anuncio
  adCopyId: int("adCopyId"),
  adScriptId: int("adScriptId"),
  adImageId: int("adImageId"),
  primaryText: text("primaryText"),
  headline: varchar("headline", { length: 255 }),
  description: text("description"),
  callToAction: varchar("callToAction", { length: 64 }),
  destinationUrl: varchar("destinationUrl", { length: 512 }),
  // Presupuesto y audiencia
  dailyBudget: decimal("dailyBudget", { precision: 10, scale: 2 }),
  totalBudget: decimal("totalBudget", { precision: 10, scale: 2 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  targetLocations: text("targetLocations"), // JSON string
  targetInterests: text("targetInterests"), // JSON string
  ageMin: int("ageMin").default(18),
  ageMax: int("ageMax").default(65),
  // Meta API
  metaAdAccountId: varchar("metaAdAccountId", { length: 128 }),
  metaCampaignId: varchar("metaCampaignId", { length: 128 }),
  metaAdSetId: varchar("metaAdSetId", { length: 128 }),
  metaAdId: varchar("metaAdId", { length: 128 }),
  metaAccessToken: text("metaAccessToken"),
  // Métricas (actualizadas periódicamente desde Meta API)
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  spend: decimal("spend", { precision: 10, scale: 2 }).default("0"),
  conversions: int("conversions").default(0),
  ctr: decimal("ctr", { precision: 5, scale: 4 }).default("0"),
  cpc: decimal("cpc", { precision: 10, scale: 2 }).default("0"),
  lastMetricsUpdate: timestamp("lastMetricsUpdate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const metaConnections = mysqlTable("metaConnections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  accessToken: text("accessToken").notNull(),
  tokenExpiry: timestamp("tokenExpiry"),
  metaUserId: varchar("metaUserId", { length: 128 }),
  metaUserName: varchar("metaUserName", { length: 255 }),
  adAccountId: varchar("adAccountId", { length: 128 }),
  adAccountName: varchar("adAccountName", { length: 255 }),
  pageId: varchar("pageId", { length: 128 }),
  pageName: varchar("pageName", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type BrandBrain = typeof brandBrains.$inferSelect;
export type InsertBrandBrain = typeof brandBrains.$inferInsert;
export type GeneratedContent = typeof generatedContents.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type MetaConnection = typeof metaConnections.$inferSelect;

// ─── Meta Suite Tables ────────────────────────────────────────────────────────

export const metaCampaignCache = mysqlTable("metaCampaignCache", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  metaConnectionId: int("metaConnectionId").notNull(),
  metaCampaignId: varchar("metaCampaignId", { length: 128 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 64 }).notNull(),
  objective: varchar("objective", { length: 128 }),
  dailyBudget: decimal("dailyBudget", { precision: 12, scale: 2 }),
  lifetimeBudget: decimal("lifetimeBudget", { precision: 12, scale: 2 }),
  impressions: bigint("impressions", { mode: "number" }).default(0),
  clicks: bigint("clicks", { mode: "number" }).default(0),
  spend: decimal("spend", { precision: 12, scale: 2 }).default("0"),
  reach: bigint("reach", { mode: "number" }).default(0),
  ctr: decimal("ctr", { precision: 8, scale: 4 }).default("0"),
  cpc: decimal("cpc", { precision: 10, scale: 4 }).default("0"),
  cpm: decimal("cpm", { precision: 10, scale: 4 }).default("0"),
  conversions: int("conversions").default(0),
  costPerConversion: decimal("costPerConversion", { precision: 10, scale: 4 }).default("0"),
  roas: decimal("roas", { precision: 10, scale: 4 }).default("0"),
  frequency: decimal("frequency", { precision: 8, scale: 4 }).default("0"),
  rawData: json("rawData"),
  lastSyncAt: timestamp("lastSyncAt").notNull().defaultNow(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export const metaAdSetCache = mysqlTable("metaAdSetCache", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  metaCampaignId: varchar("metaCampaignId", { length: 128 }).notNull(),
  metaAdSetId: varchar("metaAdSetId", { length: 128 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 64 }).notNull(),
  dailyBudget: decimal("dailyBudget", { precision: 12, scale: 2 }),
  targeting: json("targeting"),
  impressions: bigint("impressions", { mode: "number" }).default(0),
  clicks: bigint("clicks", { mode: "number" }).default(0),
  spend: decimal("spend", { precision: 12, scale: 2 }).default("0"),
  ctr: decimal("ctr", { precision: 8, scale: 4 }).default("0"),
  cpc: decimal("cpc", { precision: 10, scale: 4 }).default("0"),
  rawData: json("rawData"),
  lastSyncAt: timestamp("lastSyncAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export const metaAdCache = mysqlTable("metaAdCache", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  metaCampaignId: varchar("metaCampaignId", { length: 128 }).notNull(),
  metaAdSetId: varchar("metaAdSetId", { length: 128 }).notNull(),
  metaAdId: varchar("metaAdId", { length: 128 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 64 }).notNull(),
  previewUrl: varchar("previewUrl", { length: 1024 }),
  thumbnailUrl: varchar("thumbnailUrl", { length: 512 }),
  headline: varchar("headline", { length: 255 }),
  body: text("body"),
  callToAction: varchar("callToAction", { length: 64 }),
  impressions: bigint("impressions", { mode: "number" }).default(0),
  clicks: bigint("clicks", { mode: "number" }).default(0),
  spend: decimal("spend", { precision: 12, scale: 2 }).default("0"),
  ctr: decimal("ctr", { precision: 8, scale: 4 }).default("0"),
  cpc: decimal("cpc", { precision: 10, scale: 4 }).default("0"),
  rawData: json("rawData"),
  lastSyncAt: timestamp("lastSyncAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export const metaPostCache = mysqlTable("metaPostCache", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  metaPageId: varchar("metaPageId", { length: 128 }).notNull(),
  metaPostId: varchar("metaPostId", { length: 128 }).notNull(),
  platform: mysqlEnum("platform", ["facebook", "instagram"]).notNull(),
  message: text("message"),
  mediaUrl: varchar("mediaUrl", { length: 1024 }),
  thumbnailUrl: varchar("thumbnailUrl", { length: 512 }),
  postType: varchar("postType", { length: 64 }),
  permalink: varchar("permalink", { length: 1024 }),
  likes: int("likes").default(0),
  comments: int("comments").default(0),
  shares: int("shares").default(0),
  reach: int("reach").default(0),
  impressions: int("impressions").default(0),
  saves: int("saves").default(0),
  publishedAt: timestamp("publishedAt"),
  rawData: json("rawData"),
  lastSyncAt: timestamp("lastSyncAt").notNull().defaultNow(),
});

export const metaWebhookEvents = mysqlTable("metaWebhookEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  eventType: varchar("eventType", { length: 128 }).notNull(),
  objectId: varchar("objectId", { length: 128 }),
  payload: json("payload"),
  processed: boolean("processed").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// ─── Pipeline CRM Tables ──────────────────────────────────────────────────────

export const pipelineStages = mysqlTable("pipelineStages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  color: varchar("color", { length: 7 }).default("#6366f1"),
  position: int("position").notNull().default(0),
  isDefault: boolean("isDefault").notNull().default(false),
  automations: json("automations"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stageId: int("stageId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 64 }),
  source: mysqlEnum("source", [
    "meta_lead_ad",
    "landing_page",
    "manual",
    "whatsapp",
    "email",
    "other",
  ]).default("manual"),
  metaLeadId: varchar("metaLeadId", { length: 128 }),
  metaAdId: varchar("metaAdId", { length: 128 }),
  metaCampaignId: varchar("metaCampaignId", { length: 128 }),
  metaFormId: varchar("metaFormId", { length: 128 }),
  notes: text("notes"),
  tags: json("tags"),
  customFields: json("customFields"),
  assignedTo: int("assignedTo"),
  value: decimal("value", { precision: 10, scale: 2 }),
  probability: int("probability").default(0),
  lastContactedAt: timestamp("lastContactedAt"),
  closedAt: timestamp("closedAt"),
  position: int("position").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export const leadActivities = mysqlTable("leadActivities", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "note",
    "email",
    "call",
    "whatsapp",
    "stage_change",
    "task",
    "meeting",
  ]).notNull(),
  content: text("content"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const pipelineAutomations = mysqlTable("pipelineAutomations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  isActive: boolean("isActive").notNull().default(true),
  trigger: json("trigger").notNull(),
  actions: json("actions").notNull(),
  executionCount: int("executionCount").default(0),
  lastExecutedAt: timestamp("lastExecutedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const landingPages = mysqlTable("landingPages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  brandBrainId: int("brandBrainId"),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  blocks: json("blocks").notNull(),
  settings: json("settings"),
  isPublished: boolean("isPublished").notNull().default(false),
  publishedAt: timestamp("publishedAt"),
  views: int("views").default(0),
  conversions: int("conversions").default(0),
  metaPixelId: varchar("metaPixelId", { length: 128 }),
  customDomain: varchar("customDomain", { length: 255 }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

export const aiGenerationJobs = mysqlTable("aiGenerationJobs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["copy", "script", "image", "video", "voice", "creative"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"])
    .notNull()
    .default("pending"),
  provider: varchar("provider", { length: 64 }),
  inputData: json("inputData"),
  outputData: json("outputData"),
  errorMessage: text("errorMessage"),
  creditsUsed: int("creditsUsed").default(0),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const pipelineStagesRelations = relations(pipelineStages, ({ many }) => ({
  leads: many(leads),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  stage: one(pipelineStages, { fields: [leads.stageId], references: [pipelineStages.id] }),
  activities: many(leadActivities),
}));

export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, { fields: [leadActivities.leadId], references: [leads.id] }),
}));
