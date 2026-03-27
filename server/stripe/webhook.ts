import Stripe from "stripe";
import type { Request, Response } from "express";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

function planFromPriceId(priceId: string): "diy" | "done_with_you" | "agency" | "free" {
  if (priceId === process.env.STRIPE_PRICE_DIY) return "diy";
  if (priceId === process.env.STRIPE_PRICE_DWY) return "done_with_you";
  if (priceId === process.env.STRIPE_PRICE_AGENCY) return "agency";
  return "free";
}

export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return res.status(400).send("Webhook signature verification failed");
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

  const db = await getDb();
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    return res.status(500).json({ error: "Database unavailable" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId) {
          // Get subscription to find price ID
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const priceId = subscription.items.data[0]?.price.id ?? "";
            const plan = planFromPriceId(priceId);

            await db
              .update(users)
              .set({
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                subscriptionPlan: plan,
                subscriptionStatus: "active",
              })
              .where(eq(users.id, parseInt(userId)));

            console.log(`[Stripe] User ${userId} subscribed to plan: ${plan}`);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const priceId = subscription.items.data[0]?.price.id ?? "";
        const plan = planFromPriceId(priceId);
        const status = subscription.status === "active" ? "active"
          : subscription.status === "trialing" ? "trialing"
          : subscription.status === "canceled" ? "canceled"
          : "inactive";

        await db
          .update(users)
          .set({
            subscriptionPlan: plan,
            subscriptionStatus: status,
            stripeSubscriptionId: subscription.id,
          })
          .where(eq(users.stripeCustomerId, customerId));

        console.log(`[Stripe] Subscription updated for customer ${customerId}: ${plan} / ${status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await db
          .update(users)
          .set({
            subscriptionPlan: "free",
            subscriptionStatus: "canceled",
            stripeSubscriptionId: null,
          })
          .where(eq(users.stripeCustomerId, customerId));

        console.log(`[Stripe] Subscription canceled for customer ${customerId}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await db
          .update(users)
          .set({ subscriptionStatus: "inactive" })
          .where(eq(users.stripeCustomerId, customerId));

        console.log(`[Stripe] Payment failed for customer ${customerId}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("[Stripe Webhook] Error processing event:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
