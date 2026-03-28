/**
 * Script to create Stripe products and prices for Mister Fourteen AI Ads Platform
 * Run: node scripts/create-stripe-products.mjs
 */
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

const plans = [
  {
    key: "diy",
    envVar: "STRIPE_PRICE_DIY",
    name: "DIY — Mister Fourteen",
    description: "Gestiona tus campañas con IA. Ideal para entrenadores que empiezan.",
    amount: 9700, // 97€ in cents
    currency: "eur",
  },
  {
    key: "done_with_you",
    envVar: "STRIPE_PRICE_DWY",
    name: "Done With You — Mister Fourteen",
    description: "Campañas + edición + guiones. Para entrenadores en crecimiento.",
    amount: 29700, // 297€ in cents
    currency: "eur",
  },
  {
    key: "agency",
    envVar: "STRIPE_PRICE_AGENCY",
    name: "Agency / Premium — Mister Fourteen",
    description: "Estrategia completa, contenido y publicidad. Sin límites.",
    amount: 99700, // 997€ in cents
    currency: "eur",
  },
];

console.log("Creating Stripe products and prices...\n");

const results = {};

for (const plan of plans) {
  try {
    // Create product
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: { plan_key: plan.key },
    });

    // Create recurring price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amount,
      currency: plan.currency,
      recurring: { interval: "month" },
      metadata: { plan_key: plan.key },
    });

    results[plan.envVar] = price.id;
    console.log(`✅ ${plan.name}`);
    console.log(`   Product ID: ${product.id}`);
    console.log(`   Price ID:   ${price.id}`);
    console.log(`   Env var:    ${plan.envVar}=${price.id}\n`);
  } catch (err) {
    console.error(`❌ Failed to create ${plan.name}:`, err.message);
  }
}

console.log("\n=== Add these to your environment secrets ===");
for (const [key, value] of Object.entries(results)) {
  console.log(`${key}=${value}`);
}
console.log("\nGo to Settings → Secrets in the Manus UI and add these values.");
