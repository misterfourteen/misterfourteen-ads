import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { CheckCircle2, Zap, Rocket, Crown } from "lucide-react";

const PLANS = [
  {
    id: "diy",
    icon: Zap,
    name: "DIY",
    subtitle: "Para entrenadores que empiezan",
    price: 97,
    period: "mes",
    badge: null,
    features: [
      "Brand Brain personalizado",
      "Generador de copies con IA",
      "Generador de guiones",
      "5 imágenes/mes con IA",
      "Hasta 3 campañas activas",
      "Previsualización de anuncios",
      "Soporte por email",
    ],
    cta: "Empezar gratis 14 días",
    color: "border-border",
    buttonClass: "border-primary text-primary hover:bg-primary/10",
  },
  {
    id: "dwu",
    icon: Rocket,
    name: "Done With You",
    subtitle: "Para coaches en crecimiento",
    price: 297,
    period: "mes",
    badge: "Más popular",
    features: [
      "Todo lo del plan DIY",
      "Imágenes ilimitadas con IA",
      "Campañas ilimitadas",
      "Publicación automática en Meta",
      "Dashboard de métricas avanzado",
      "Integración Meta Ads API",
      "Soporte prioritario",
      "Sesión estratégica mensual",
    ],
    cta: "Empezar gratis 14 días",
    color: "border-primary",
    buttonClass: "gradient-brand text-white border-0",
  },
  {
    id: "premium",
    icon: Crown,
    name: "Premium Agency",
    subtitle: "Estrategia completa con equipo",
    price: 997,
    period: "mes",
    badge: "White label",
    features: [
      "Todo lo del plan Done With You",
      "Gestión de múltiples marcas",
      "Panel white label personalizable",
      "Acceso API completo",
      "Gestor de cuenta dedicado",
      "Revisión semanal de campañas",
      "Estrategia de contenido mensual",
      "Soporte 24/7",
    ],
    cta: "Hablar con el equipo",
    color: "border-yellow-500/50",
    buttonClass: "border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10",
  },
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  const handleCTA = (planId: string) => {
    if (planId === "premium") {
      window.open("https://misterfourteen.com/contacto", "_blank");
      return;
    }
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    // Stripe integration placeholder
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="text-center pt-16 pb-12 px-6">
        <Badge variant="outline" className="border-primary/30 text-primary mb-4">Planes y precios</Badge>
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
          Escala tus anuncios con IA
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Desde entrenadores que empiezan hasta agencias que gestionan múltiples clientes. Sin permanencia, cancela cuando quieras.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div key={plan.id} className={`glass-card rounded-2xl p-6 border-2 relative flex flex-col ${plan.color} ${plan.badge === "Más popular" ? "glow-primary" : ""}`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className={`${plan.badge === "Más popular" ? "gradient-brand text-white border-0" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}`}>
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${plan.badge === "Más popular" ? "gradient-brand" : "bg-secondary"}`}>
                  <plan.icon className={`w-5 h-5 ${plan.badge === "Más popular" ? "text-white" : "text-primary"}`} />
                </div>
                <h3 className="text-xl font-display font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold">{plan.price}€</span>
                  <span className="text-muted-foreground text-sm">/{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button onClick={() => handleCTA(plan.id)} className={`w-full ${plan.buttonClass}`} variant="outline">
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ / Guarantee */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm">
            ✓ 14 días de prueba gratis &nbsp;·&nbsp; ✓ Sin permanencia &nbsp;·&nbsp; ✓ Cancela en cualquier momento &nbsp;·&nbsp; ✓ Soporte en español
          </p>
        </div>
      </div>
    </div>
  );
}
