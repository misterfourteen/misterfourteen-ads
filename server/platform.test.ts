import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock DB helpers
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getBrandBrainByUserId: vi.fn().mockResolvedValue(null),
  upsertBrandBrain: vi.fn().mockResolvedValue({ id: 1, userId: 1, businessName: "Test", niche: "Fitness", isComplete: false, masterPrompt: null }),
  getGeneratedContentsByUser: vi.fn().mockResolvedValue([]),
  saveGeneratedContent: vi.fn().mockResolvedValue({ id: 1, userId: 1, type: "copy", content: "{}", createdAt: new Date() }),
  toggleFavoriteContent: vi.fn().mockResolvedValue({ success: true }),
  getCampaignsByUser: vi.fn().mockResolvedValue([]),
  getCampaignById: vi.fn().mockResolvedValue(null),
  upsertCampaign: vi.fn().mockResolvedValue({ id: 1, userId: 1, name: "Test", objective: "leads", status: "draft" }),
  getMetaConnection: vi.fn().mockResolvedValue(null),
  upsertMetaConnection: vi.fn().mockResolvedValue({ id: 1, userId: 1, accessToken: "test" }),
  getAllUsersAdmin: vi.fn().mockResolvedValue([]),
  getAllBrandBrainsAdmin: vi.fn().mockResolvedValue([]),
  getPlatformStats: vi.fn().mockResolvedValue({ totalUsers: 0, totalBrains: 0, totalCampaigns: 0, totalContents: 0 }),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: '{"copies":[{"primaryText":"Test copy","headline":"Test headline","description":"Test desc","cta":"Más info"}]}' } }],
  }),
}));

vi.mock("./_core/imageGeneration.ts", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://example.com/image.png" }),
}));

function makeCtx(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = makeCtx();
    const clearedCookies: string[] = [];
    ctx.res.clearCookie = (name: string) => { clearedCookies.push(name); };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(clearedCookies.length).toBe(1);
  });
});

describe("brandBrain", () => {
  it("getMine returns null when no brand brain exists", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.brandBrain.getMine();
    expect(result).toBeNull();
  });

  it("save creates a brand brain", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.brandBrain.save({
      businessName: "Carlos Fitness",
      niche: "Pérdida de grasa",
    });
    expect(result).toBeDefined();
    expect(result.businessName).toBe("Test");
  });
});

describe("generate.history", () => {
  it("returns empty array when no content generated", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.generate.history({ type: "copy" });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

describe("campaigns", () => {
  it("list returns empty array for new user", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.campaigns.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });
});

describe("admin", () => {
  it("getStats returns platform stats for admin", async () => {
    const ctx = makeCtx("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.getStats();
    expect(result).toHaveProperty("totalUsers");
    expect(result).toHaveProperty("totalBrains");
    expect(result).toHaveProperty("totalCampaigns");
    expect(result).toHaveProperty("totalContents");
  });

  it("getStats throws FORBIDDEN for non-admin", async () => {
    const ctx = makeCtx("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getStats()).rejects.toThrow();
  });
});
