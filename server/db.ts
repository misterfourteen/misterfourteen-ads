import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import { InsertUser, users, brandBrains, generatedContents, campaigns, metaConnections } from "../drizzle/schema";
import type { InsertBrandBrain, Campaign } from "../drizzle/schema";
import { ENV } from './_core/env';
import type { MySql2Database } from 'drizzle-orm/mysql2';

type DbType = MySql2Database<typeof schema>;
let _db: DbType | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL, { schema, mode: "default" });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Synchronous proxy for new routers that import `db` directly.
// Lazily initialises on first use so it works even before getDb() is called.
export const db = new Proxy({} as DbType, {
  get(_target, prop) {
    if (!_db && process.env.DATABASE_URL) {
      try {
        _db = drizzle(process.env.DATABASE_URL, { schema, mode: "default" });
      } catch (e) {
        console.warn("[Database] Lazy init failed:", e);
      }
    }
    if (!_db) throw new Error("Database not available");
    return (_db as any)[prop];
  },
});

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Brand Brain ──────────────────────────────────────────────────────────────
export async function getBrandBrainByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(brandBrains).where(eq(brandBrains.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertBrandBrain(userId: number, data: Partial<InsertBrandBrain>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getBrandBrainByUserId(userId);
  if (existing) {
    await db.update(brandBrains).set({ ...data, updatedAt: new Date() }).where(eq(brandBrains.userId, userId));
    const updated = await getBrandBrainByUserId(userId);
    return updated!;
  } else {
    const toInsert: InsertBrandBrain = {
      userId,
      businessName: data.businessName ?? "",
      niche: data.niche ?? "",
      ...data,
    };
    await db.insert(brandBrains).values(toInsert);
    const created = await getBrandBrainByUserId(userId);
    return created!;
  }
}

// ─── Generated Contents ───────────────────────────────────────────────────────
export async function getGeneratedContentsByUser(userId: number, type?: "copy" | "script" | "image") {
  const db = await getDb();
  if (!db) return [];
  const conditions = type
    ? and(eq(generatedContents.userId, userId), eq(generatedContents.type, type))
    : eq(generatedContents.userId, userId);
  return db.select().from(generatedContents).where(conditions).orderBy(desc(generatedContents.createdAt)).limit(50);
}

export async function saveGeneratedContent(data: {
  userId: number;
  brandBrainId: number;
  type: "copy" | "script" | "image";
  content?: string;
  prompt?: string;
  imageUrl?: string;
  imagePrompt?: string;
  adFormat?: string;
  objective?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(generatedContents).values({
    userId: data.userId,
    brandBrainId: data.brandBrainId,
    type: data.type,
    content: data.content,
    prompt: data.prompt,
    imageUrl: data.imageUrl,
    imagePrompt: data.imagePrompt,
    adFormat: data.adFormat,
    objective: data.objective,
  });
  const result = await db.select().from(generatedContents)
    .where(eq(generatedContents.userId, data.userId))
    .orderBy(desc(generatedContents.createdAt))
    .limit(1);
  return result[0]!;
}

export async function toggleFavoriteContent(id: number, userId: number, isFavorite: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(generatedContents)
    .set({ isFavorite })
    .where(and(eq(generatedContents.id, id), eq(generatedContents.userId, userId)));
  return { success: true };
}

// ─── Campaigns ────────────────────────────────────────────────────────────────
export async function getCampaignsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campaigns).where(eq(campaigns.userId, userId)).orderBy(desc(campaigns.createdAt));
}

export async function getCampaignById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertCampaign(userId: number, data: Partial<Campaign> & { brandBrainId: number; name: string; objective: Campaign["objective"] }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.id) {
    await db.update(campaigns).set({ ...data, updatedAt: new Date() }).where(and(eq(campaigns.id, data.id), eq(campaigns.userId, userId)));
    const updated = await getCampaignById(data.id, userId);
    return updated!;
  } else {
    await db.insert(campaigns).values({ ...data, userId });
    const result = await db.select().from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt))
      .limit(1);
    return result[0]!;
  }
}

// ─── Meta Connection ──────────────────────────────────────────────────────────
export async function getMetaConnection(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(metaConnections).where(eq(metaConnections.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertMetaConnection(userId: number, data: Partial<typeof metaConnections.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getMetaConnection(userId);
  if (existing) {
    await db.update(metaConnections).set({ ...data, updatedAt: new Date() }).where(eq(metaConnections.userId, userId));
  } else {
    await db.insert(metaConnections).values({ userId, accessToken: data.accessToken ?? "", ...data });
  }
  return getMetaConnection(userId);
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export async function getAllUsersAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getAllBrandBrainsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(brandBrains).orderBy(desc(brandBrains.createdAt));
}

export async function getPlatformStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalBrains: 0, totalCampaigns: 0, totalContents: 0 };
  const [usersResult, brainsResult, campaignsResult, contentsResult] = await Promise.all([
    db.select().from(users),
    db.select().from(brandBrains),
    db.select().from(campaigns),
    db.select().from(generatedContents),
  ]);
  return {
    totalUsers: usersResult.length,
    totalBrains: brainsResult.length,
    totalCampaigns: campaignsResult.length,
    totalContents: contentsResult.length,
  };
}
