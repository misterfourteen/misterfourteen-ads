// Stripe Products & Prices for Mister Fourteen AI Ads Platform
// Plans: DIY (97€/mes), Done With You (297€/mes), Agency/Premium (997€/mes)

export const PLANS = {
  diy: {
    name: "DIY",
    description: "Gestiona tus campañas con IA. Ideal para entrenadores que empiezan.",
    priceMonthly: 9700, // cents (97€)
    currency: "eur",
    features: [
      "30 copies generados/mes",
      "15 guiones de vídeo/mes",
      "10 imágenes con IA/mes",
      "1 Brand Brain",
      "Constructor de campañas",
      "Soporte por email",
    ],
    limits: {
      copies: 30,
      scripts: 15,
      images: 10,
      brandBrains: 1,
      campaigns: 5,
    },
    stripePriceId: process.env.STRIPE_PRICE_DIY ?? "",
  },
  done_with_you: {
    name: "Done With You",
    description: "Campañas + edición + guiones. Para entrenadores en crecimiento.",
    priceMonthly: 29700, // cents (297€)
    currency: "eur",
    features: [
      "150 copies generados/mes",
      "75 guiones de vídeo/mes",
      "50 imágenes con IA/mes",
      "3 Brand Brains",
      "A/B Testing automático",
      "Informes semanales",
      "Soporte prioritario",
    ],
    limits: {
      copies: 150,
      scripts: 75,
      images: 50,
      brandBrains: 3,
      campaigns: 20,
    },
    stripePriceId: process.env.STRIPE_PRICE_DWY ?? "",
  },
  agency: {
    name: "Agency / Premium",
    description: "Estrategia completa, contenido y publicidad. Sin límites.",
    priceMonthly: 99700, // cents (997€)
    currency: "eur",
    features: [
      "Generaciones ilimitadas",
      "Brand Brains ilimitados",
      "Campañas ilimitadas",
      "A/B Testing avanzado",
      "Informes personalizados",
      "Soporte 1:1 dedicado",
      "Acceso API",
    ],
    limits: {
      copies: -1, // -1 = unlimited
      scripts: -1,
      images: -1,
      brandBrains: -1,
      campaigns: -1,
    },
    stripePriceId: process.env.STRIPE_PRICE_AGENCY ?? "",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanLimits(plan: string) {
  if (plan === "diy") return PLANS.diy.limits;
  if (plan === "done_with_you") return PLANS.done_with_you.limits;
  if (plan === "agency") return PLANS.agency.limits;
  // Free plan
  return {
    copies: 5,
    scripts: 3,
    images: 2,
    brandBrains: 1,
    campaigns: 1,
  };
}

export function isUnlimited(limit: number) {
  return limit === -1;
}
