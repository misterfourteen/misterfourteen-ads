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
} from "drizzle-orm/mysql-core";

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
