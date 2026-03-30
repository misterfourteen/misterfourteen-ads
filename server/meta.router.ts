import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import {
  metaConnections,
  metaCampaignCache,
  metaAdSetCache,
  metaAdCache,
  metaPostCache,
  metaWebhookEvents,
} from "../drizzle/schema";
import { TRPCError } from "@trpc/server";

const META_API_BASE = "https://graph.facebook.com/v21.0";

// ─── Meta API helpers ────────────────────────────────────────────────────────

async function metaFetch<T>(
  path: string,
  accessToken: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${META_API_BASE}${path}`);
  url.searchParams.set("access_token", accessToken);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  const data = await res.json();

  if (data.error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Meta API error: ${data.error.message} (code ${data.error.code})`,
    });
  }

  return data as T;
}

const INSIGHTS_FIELDS =
  "impressions,clicks,spend,reach,ctr,cpc,cpm,conversions,cost_per_conversion,purchase_roas,frequency,actions,action_values";

async function fetchInsights(
  objectId: string,
  accessToken: string,
  datePreset = "last_30d"
) {
  try {
    const data = await metaFetch<{ data: any[] }>(
      `/${objectId}/insights`,
      accessToken,
      {
        fields: INSIGHTS_FIELDS,
        date_preset: datePreset,
        level: "campaign",
      }
    );
    return data.data?.[0] ?? null;
  } catch {
    return null;
  }
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const metaRouter = router({
  // Get connection status
  getConnection: protectedProcedure.query(async ({ ctx }) => {
    const conn = await db.query.metaConnections.findFirst({
      where: and(
        eq(metaConnections.userId, ctx.user.id),
        eq(metaConnections.isActive, true)
      ),
    });
    if (!conn) return null;
    return {
      id: conn.id,
      metaUserName: conn.metaUserName,
      adAccountId: conn.adAccountId,
      adAccountName: conn.adAccountName,
      pageId: conn.pageId,
      pageName: conn.pageName,
      isActive: conn.isActive,
      createdAt: conn.createdAt,
    };
  }),

  // Connect Meta account via OAuth code exchange
  connect: protectedProcedure
    .input(
      z.object({
        accessToken: z.string(),
        adAccountId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify token and get user info
      const meData = await metaFetch<{
        id: string;
        name: string;
        email?: string;
      }>("/me", input.accessToken, {
        fields: "id,name,email",
      });

      // Get ad accounts
      const adAccountsData = await metaFetch<{
        data: Array<{ id: string; name: string; account_status: number }>;
      }>("/me/adaccounts", input.accessToken, {
        fields: "id,name,account_status",
        limit: "25",
      });

      // Get pages
      const pagesData = await metaFetch<{
        data: Array<{ id: string; name: string }>;
      }>("/me/accounts", input.accessToken, {
        fields: "id,name",
        limit: "25",
      });

      const firstAdAccount = adAccountsData.data?.[0];
      const firstPage = pagesData.data?.[0];

      // Upsert connection
      await db
        .insert(metaConnections)
        .values({
          userId: ctx.user.id,
          accessToken: input.accessToken,
          metaUserId: meData.id,
          metaUserName: meData.name,
          adAccountId: input.adAccountId ?? firstAdAccount?.id ?? null,
          adAccountName: firstAdAccount?.name ?? null,
          pageId: firstPage?.id ?? null,
          pageName: firstPage?.name ?? null,
          isActive: true,
        })
        .onDuplicateKeyUpdate({
          set: {
            accessToken: input.accessToken,
            metaUserId: meData.id,
            metaUserName: meData.name,
            adAccountId: input.adAccountId ?? firstAdAccount?.id ?? null,
            adAccountName: firstAdAccount?.name ?? null,
            pageId: firstPage?.id ?? null,
            pageName: firstPage?.name ?? null,
            isActive: true,
            updatedAt: new Date(),
          },
        });

      return {
        success: true,
        userName: meData.name,
        adAccountName: firstAdAccount?.name,
        adAccounts: adAccountsData.data,
        pages: pagesData.data,
      };
    }),

  // Get available ad accounts to switch between
  getAdAccounts: protectedProcedure.query(async ({ ctx }) => {
    const conn = await db.query.metaConnections.findFirst({
      where: and(
        eq(metaConnections.userId, ctx.user.id),
        eq(metaConnections.isActive, true)
      ),
    });
    if (!conn) throw new TRPCError({ code: "NOT_FOUND", message: "No Meta connection" });

    const data = await metaFetch<{
      data: Array<{ id: string; name: string; account_status: number; currency: string }>;
    }>("/me/adaccounts", conn.accessToken, {
      fields: "id,name,account_status,currency",
      limit: "50",
    });

    return data.data ?? [];
  }),

  // Switch active ad account
  switchAdAccount: protectedProcedure
    .input(z.object({ adAccountId: z.string(), adAccountName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(metaConnections)
        .set({
          adAccountId: input.adAccountId,
          adAccountName: input.adAccountName,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(metaConnections.userId, ctx.user.id),
            eq(metaConnections.isActive, true)
          )
        );
      return { success: true };
    }),

  // Sync and return all campaigns with metrics
  getCampaigns: protectedProcedure
    .input(
      z.object({
        datePreset: z.string().default("last_30d"),
        forceSync: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const conn = await db.query.metaConnections.findFirst({
        where: and(
          eq(metaConnections.userId, ctx.user.id),
          eq(metaConnections.isActive, true)
        ),
      });
      if (!conn) throw new TRPCError({ code: "NOT_FOUND", message: "No Meta connection found" });
      if (!conn.adAccountId) throw new TRPCError({ code: "BAD_REQUEST", message: "No ad account selected" });

      // Check cache freshness (15 min)
      const cached = await db.query.metaCampaignCache.findFirst({
        where: eq(metaCampaignCache.userId, ctx.user.id),
        orderBy: [desc(metaCampaignCache.lastSyncAt)],
      });

      const cacheAge = cached
        ? (Date.now() - new Date(cached.lastSyncAt).getTime()) / 1000 / 60
        : Infinity;

      if (!input.forceSync && cacheAge < 15 && cached) {
        // Return from cache
        return await db.query.metaCampaignCache.findMany({
          where: eq(metaCampaignCache.userId, ctx.user.id),
          orderBy: [desc(metaCampaignCache.spend)],
        });
      }

      // Fetch from Meta API
      const campaignsData = await metaFetch<{
        data: Array<{
          id: string;
          name: string;
          status: string;
          objective: string;
          daily_budget?: string;
          lifetime_budget?: string;
          start_time?: string;
          stop_time?: string;
        }>;
      }>(
        `/${conn.adAccountId}/campaigns`,
        conn.accessToken,
        {
          fields: "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time",
          limit: "100",
        }
      );

      // Fetch insights for all campaigns in batch
      const insightsData = await metaFetch<{
        data: Array<{
          campaign_id: string;
          impressions: string;
          clicks: string;
          spend: string;
          reach: string;
          ctr: string;
          cpc: string;
          cpm: string;
          frequency: string;
          actions?: Array<{ action_type: string; value: string }>;
          purchase_roas?: Array<{ action_type: string; value: string }>;
        }>;
      }>(
        `/${conn.adAccountId}/insights`,
        conn.accessToken,
        {
          fields:
            "campaign_id,campaign_name,impressions,clicks,spend,reach,ctr,cpc,cpm,frequency,actions,purchase_roas",
          date_preset: input.datePreset,
          level: "campaign",
          limit: "100",
        }
      ).catch(() => ({ data: [] }));

      const insightsByCampaign = new Map(
        (insightsData.data ?? []).map((i) => [i.campaign_id, i])
      );

      const now = new Date();

      // Upsert each campaign to cache
      for (const campaign of campaignsData.data ?? []) {
        const ins = insightsByCampaign.get(campaign.id);
        const conversions =
          ins?.actions?.find((a) => a.action_type === "purchase")?.value ?? "0";
        const roas =
          ins?.purchase_roas?.find((r) => r.action_type === "omni_purchase")?.value ?? "0";

        await db
          .insert(metaCampaignCache)
          .values({
            userId: ctx.user.id,
            metaConnectionId: conn.id,
            metaCampaignId: campaign.id,
            name: campaign.name,
            status: campaign.status,
            objective: campaign.objective,
            dailyBudget: campaign.daily_budget
              ? parseFloat(campaign.daily_budget) / 100
              : null,
            lifetimeBudget: campaign.lifetime_budget
              ? parseFloat(campaign.lifetime_budget) / 100
              : null,
            impressions: parseInt(ins?.impressions ?? "0"),
            clicks: parseInt(ins?.clicks ?? "0"),
            spend: parseFloat(ins?.spend ?? "0"),
            reach: parseInt(ins?.reach ?? "0"),
            ctr: parseFloat(ins?.ctr ?? "0"),
            cpc: parseFloat(ins?.cpc ?? "0"),
            cpm: parseFloat(ins?.cpm ?? "0"),
            conversions: parseInt(conversions),
            roas: parseFloat(roas),
            frequency: parseFloat(ins?.frequency ?? "0"),
            rawData: { campaign, insights: ins },
            lastSyncAt: now,
          })
          .onDuplicateKeyUpdate({
            set: {
              name: campaign.name,
              status: campaign.status,
              objective: campaign.objective,
              dailyBudget: campaign.daily_budget
                ? parseFloat(campaign.daily_budget) / 100
                : null,
              impressions: parseInt(ins?.impressions ?? "0"),
              clicks: parseInt(ins?.clicks ?? "0"),
              spend: parseFloat(ins?.spend ?? "0"),
              reach: parseInt(ins?.reach ?? "0"),
              ctr: parseFloat(ins?.ctr ?? "0"),
              cpc: parseFloat(ins?.cpc ?? "0"),
              cpm: parseFloat(ins?.cpm ?? "0"),
              conversions: parseInt(conversions),
              roas: parseFloat(roas),
              rawData: { campaign, insights: ins },
              lastSyncAt: now,
              updatedAt: now,
            },
          });
      }

      return await db.query.metaCampaignCache.findMany({
        where: eq(metaCampaignCache.userId, ctx.user.id),
        orderBy: [desc(metaCampaignCache.spend)],
      });
    }),

  // Get ad sets for a campaign
  getAdSets: protectedProcedure
    .input(z.object({ campaignId: z.string(), datePreset: z.string().default("last_30d") }))
    .query(async ({ ctx, input }) => {
      const conn = await db.query.metaConnections.findFirst({
        where: and(
          eq(metaConnections.userId, ctx.user.id),
          eq(metaConnections.isActive, true)
        ),
      });
      if (!conn) throw new TRPCError({ code: "NOT_FOUND", message: "No Meta connection" });

      const adSetsData = await metaFetch<{
        data: Array<{
          id: string;
          name: string;
          status: string;
          daily_budget?: string;
          targeting?: object;
          billing_event?: string;
          optimization_goal?: string;
        }>;
      }>(
        `/${input.campaignId}/adsets`,
        conn.accessToken,
        {
          fields:
            "id,name,status,daily_budget,targeting,billing_event,optimization_goal",
          limit: "50",
        }
      );

      const insightsData = await metaFetch<{
        data: Array<{
          adset_id: string;
          impressions: string;
          clicks: string;
          spend: string;
          ctr: string;
          cpc: string;
        }>;
      }>(
        `/${input.campaignId}/insights`,
        conn.accessToken,
        {
          fields: "adset_id,impressions,clicks,spend,ctr,cpc",
          date_preset: input.datePreset,
          level: "adset",
          limit: "50",
        }
      ).catch(() => ({ data: [] }));

      const insightsByAdSet = new Map(
        (insightsData.data ?? []).map((i) => [i.adset_id, i])
      );

      const now = new Date();
      const result = [];

      for (const adSet of adSetsData.data ?? []) {
        const ins = insightsByAdSet.get(adSet.id);
        const row = {
          userId: ctx.user.id,
          metaCampaignId: input.campaignId,
          metaAdSetId: adSet.id,
          name: adSet.name,
          status: adSet.status,
          dailyBudget: adSet.daily_budget ? parseFloat(adSet.daily_budget) / 100 : null,
          targeting: adSet.targeting ?? {},
          impressions: parseInt(ins?.impressions ?? "0"),
          clicks: parseInt(ins?.clicks ?? "0"),
          spend: parseFloat(ins?.spend ?? "0"),
          ctr: parseFloat(ins?.ctr ?? "0"),
          cpc: parseFloat(ins?.cpc ?? "0"),
          rawData: adSet,
          lastSyncAt: now,
        };

        await db
          .insert(metaAdSetCache)
          .values(row)
          .onDuplicateKeyUpdate({ set: { ...row, updatedAt: now } });

        result.push(row);
      }

      return result;
    }),

  // Get ads for an ad set with creative previews
  getAds: protectedProcedure
    .input(z.object({ adSetId: z.string(), datePreset: z.string().default("last_30d") }))
    .query(async ({ ctx, input }) => {
      const conn = await db.query.metaConnections.findFirst({
        where: and(
          eq(metaConnections.userId, ctx.user.id),
          eq(metaConnections.isActive, true)
        ),
      });
      if (!conn) throw new TRPCError({ code: "NOT_FOUND", message: "No Meta connection" });

      const adsData = await metaFetch<{
        data: Array<{
          id: string;
          name: string;
          status: string;
          creative?: {
            id: string;
            title?: string;
            body?: string;
            thumbnail_url?: string;
            object_story_spec?: object;
          };
          adset_id: string;
          campaign_id: string;
        }>;
      }>(
        `/${input.adSetId}/ads`,
        conn.accessToken,
        {
          fields: "id,name,status,creative{id,title,body,thumbnail_url,object_story_spec},adset_id,campaign_id",
          limit: "50",
        }
      );

      const insightsData = await metaFetch<{
        data: Array<{
          ad_id: string;
          impressions: string;
          clicks: string;
          spend: string;
          ctr: string;
          cpc: string;
        }>;
      }>(
        `/${input.adSetId}/insights`,
        conn.accessToken,
        {
          fields: "ad_id,impressions,clicks,spend,ctr,cpc",
          date_preset: input.datePreset,
          level: "ad",
          limit: "50",
        }
      ).catch(() => ({ data: [] }));

      const insightsByAd = new Map(
        (insightsData.data ?? []).map((i) => [i.ad_id, i])
      );

      const result = [];
      const now = new Date();

      for (const ad of adsData.data ?? []) {
        const ins = insightsByAd.get(ad.id);
        const row = {
          userId: ctx.user.id,
          metaCampaignId: ad.campaign_id,
          metaAdSetId: ad.adset_id,
          metaAdId: ad.id,
          name: ad.name,
          status: ad.status,
          thumbnailUrl: ad.creative?.thumbnail_url ?? null,
          headline: ad.creative?.title ?? null,
          body: ad.creative?.body ?? null,
          impressions: parseInt(ins?.impressions ?? "0"),
          clicks: parseInt(ins?.clicks ?? "0"),
          spend: parseFloat(ins?.spend ?? "0"),
          ctr: parseFloat(ins?.ctr ?? "0"),
          cpc: parseFloat(ins?.cpc ?? "0"),
          rawData: ad,
          lastSyncAt: now,
        };

        await db
          .insert(metaAdCache)
          .values(row)
          .onDuplicateKeyUpdate({ set: { ...row, updatedAt: now } });

        result.push(row);
      }

      return result;
    }),

  // Get organic posts (Facebook + Instagram)
  getPosts: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["facebook", "instagram", "all"]).default("all"),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const conn = await db.query.metaConnections.findFirst({
        where: and(
          eq(metaConnections.userId, ctx.user.id),
          eq(metaConnections.isActive, true)
        ),
      });
      if (!conn || !conn.pageId)
        throw new TRPCError({ code: "NOT_FOUND", message: "No page connected" });

      const results: any[] = [];

      // Facebook posts
      if (input.platform === "facebook" || input.platform === "all") {
        try {
          const fbPosts = await metaFetch<{
            data: Array<{
              id: string;
              message?: string;
              story?: string;
              full_picture?: string;
              permalink_url?: string;
              created_time: string;
              attachments?: { data: Array<{ type: string; media?: { image?: { src: string } } }> };
              insights?: { data: Array<{ name: string; values: Array<{ value: number }> }> };
            }>;
          }>(
            `/${conn.pageId}/posts`,
            conn.accessToken,
            {
              fields:
                "id,message,story,full_picture,permalink_url,created_time,attachments,insights.metric(post_impressions,post_reach,post_engaged_users)",
              limit: input.limit.toString(),
            }
          );

          for (const post of fbPosts.data ?? []) {
            const insightMap: Record<string, number> = {};
            for (const insight of post.insights?.data ?? []) {
              insightMap[insight.name] = insight.values?.[0]?.value ?? 0;
            }

            results.push({
              id: post.id,
              platform: "facebook" as const,
              message: post.message ?? post.story,
              mediaUrl: post.full_picture,
              permalink: post.permalink_url,
              publishedAt: post.created_time,
              impressions: insightMap["post_impressions"] ?? 0,
              reach: insightMap["post_reach"] ?? 0,
              engagement: insightMap["post_engaged_users"] ?? 0,
              likes: 0,
              comments: 0,
              shares: 0,
            });
          }
        } catch { /* no FB page */ }
      }

      return results.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    }),

  // Get account-level summary metrics
  getAccountSummary: protectedProcedure
    .input(z.object({ datePreset: z.string().default("last_30d") }))
    .query(async ({ ctx, input }) => {
      const conn = await db.query.metaConnections.findFirst({
        where: and(
          eq(metaConnections.userId, ctx.user.id),
          eq(metaConnections.isActive, true)
        ),
      });
      if (!conn) throw new TRPCError({ code: "NOT_FOUND", message: "No Meta connection" });
      if (!conn.adAccountId) throw new TRPCError({ code: "BAD_REQUEST", message: "No ad account selected" });

      const insightsData = await metaFetch<{
        data: Array<{
          impressions: string;
          clicks: string;
          spend: string;
          reach: string;
          ctr: string;
          cpc: string;
          cpm: string;
          frequency: string;
          actions?: Array<{ action_type: string; value: string }>;
          purchase_roas?: Array<{ action_type: string; value: string }>;
        }>;
      }>(
        `/${conn.adAccountId}/insights`,
        conn.accessToken,
        {
          fields:
            "impressions,clicks,spend,reach,ctr,cpc,cpm,frequency,actions,purchase_roas",
          date_preset: input.datePreset,
          level: "account",
        }
      );

      const ins = insightsData.data?.[0];
      if (!ins) {
        return {
          impressions: 0, clicks: 0, spend: 0, reach: 0,
          ctr: 0, cpc: 0, cpm: 0, conversions: 0, roas: 0, frequency: 0,
        };
      }

      const conversions =
        parseInt(ins.actions?.find((a) => a.action_type === "purchase")?.value ?? "0") +
        parseInt(ins.actions?.find((a) => a.action_type === "lead")?.value ?? "0");

      const roas = parseFloat(
        ins.purchase_roas?.find((r) => r.action_type === "omni_purchase")?.value ?? "0"
      );

      return {
        impressions: parseInt(ins.impressions ?? "0"),
        clicks: parseInt(ins.clicks ?? "0"),
        spend: parseFloat(ins.spend ?? "0"),
        reach: parseInt(ins.reach ?? "0"),
        ctr: parseFloat(ins.ctr ?? "0"),
        cpc: parseFloat(ins.cpc ?? "0"),
        cpm: parseFloat(ins.cpm ?? "0"),
        conversions,
        roas,
        frequency: parseFloat(ins.frequency ?? "0"),
      };
    }),

  // Toggle campaign status
  toggleCampaignStatus: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        status: z.enum(["ACTIVE", "PAUSED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conn = await db.query.metaConnections.findFirst({
        where: and(
          eq(metaConnections.userId, ctx.user.id),
          eq(metaConnections.isActive, true)
        ),
      });
      if (!conn) throw new TRPCError({ code: "NOT_FOUND", message: "No Meta connection" });

      const res = await fetch(
        `${META_API_BASE}/${input.campaignId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: input.status,
            access_token: conn.accessToken,
          }),
        }
      );

      const data = await res.json();
      if (data.error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: data.error.message,
        });
      }

      // Update cache
      await db
        .update(metaCampaignCache)
        .set({ status: input.status, updatedAt: new Date() })
        .where(
          and(
            eq(metaCampaignCache.userId, ctx.user.id),
            eq(metaCampaignCache.metaCampaignId, input.campaignId)
          )
        );

      return { success: true };
    }),

  // Update campaign budget
  updateBudget: protectedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        dailyBudget: z.number().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conn = await db.query.metaConnections.findFirst({
        where: and(
          eq(metaConnections.userId, ctx.user.id),
          eq(metaConnections.isActive, true)
        ),
      });
      if (!conn) throw new TRPCError({ code: "NOT_FOUND", message: "No Meta connection" });

      const res = await fetch(
        `${META_API_BASE}/${input.campaignId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            daily_budget: Math.round(input.dailyBudget * 100),
            access_token: conn.accessToken,
          }),
        }
      );

      const data = await res.json();
      if (data.error) throw new TRPCError({ code: "BAD_REQUEST", message: data.error.message });

      await db
        .update(metaCampaignCache)
        .set({ dailyBudget: input.dailyBudget, updatedAt: new Date() })
        .where(
          and(
            eq(metaCampaignCache.userId, ctx.user.id),
            eq(metaCampaignCache.metaCampaignId, input.campaignId)
          )
        );

      return { success: true };
    }),

  // Disconnect Meta account
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(metaConnections)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(metaConnections.userId, ctx.user.id));
    return { success: true };
  }),
});
