import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { Check, Zap, Rocket, Crown, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

const planIcons: Record<string, React.ReactNode> = {
  diy: <Zap className="w-5 h-5 text-yellow-400" />,
  done_with_you: <Rocket className="w-5 h-5 text-primary" />,
  agency: <Crown className="w-5 h-5 text-purple-400" />,
};

const planColors: Record<string, string> = {
  diy: "border-yellow-500/30 hover:border-yellow-500/60",
  done_with_you: "border-primary/50 hover:border-primary ring-1 ring-primary/20",
  agency: "border-purple-500/30 hover:border-purple-500/60",
};

const planBadge: Record<string, string | null> = {
  diy: null,
  done_with_you: "Más popular",
  agency: "Para agencias",
};

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { data: plans } = trpc.stripe.getPlans.useQuery();
  const { data: subscription } = trpc.stripe.getMySubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createCheckout = trpc.stripe.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.success("Redirigiendo a la pasarela de pago...");
      }
      setLoadingPlan(null);
    },
    onError: (err) => {
      toast.error(err.message || "Error al crear la sesión de pago");
      setLoadingPlan(null);
    },
  });

  const createPortal = trpc.stripe.createPortal.useMutation({
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
    },
    onError: () => toast.error("Error al abrir el portal de facturación"),
  });

  function handleSelectPlan(planKey: string) {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setLoadingPlan(planKey);
    createCheckout.mutate({ planKey: planKey as "diy" | "done_with_you" | "agency" });
  }

  const currentPlan = subscription?.plan ?? "free";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="pt-20 pb-12 text-center px-4">
        <Badge variant="outline" className="border-primary/30 text-primary mb-4">
          Planes y precios
        </Badge>
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
          Escala tus anuncios.{" "}
          <span className="text-primary">Con IA.</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Empieza gratis. Actualiza cuando necesites más potencia. Sin permanencia, cancela cuando quieras.
        </p>

        {isAuthenticated && currentPlan !== "free" && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              Plan activo: {currentPlan.replace("_", " ").toUpperCase()}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="border-border text-muted-foreground"
              onClick={() => createPortal.mutate()}
            >
              Gestionar suscripción
            </Button>
          </div>
        )}
      </div>

      {/* Free plan banner */}
      <div className="max-w-5xl mx-auto px-4 mb-6">
        <Card className="bg-secondary/30 border-border p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-semibold">Plan Gratuito</p>
              <p className="text-muted-foreground text-sm">5 copies · 3 guiones · 2 imágenes al mes. Sin tarjeta.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">0€</span>
              {!isAuthenticated && (
                <Button
                  variant="outline"
                  className="border-border"
                  onClick={() => (window.location.href = getLoginUrl())}
                >
                  Empezar gratis
                </Button>
              )}
              {isAuthenticated && currentPlan === "free" && (
                <Badge variant="outline" className="text-muted-foreground">Plan actual</Badge>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Paid plans */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {(plans ?? []).map((plan) => {
            const isCurrentPlan = currentPlan === plan.key;
            const badge = planBadge[plan.key];

            return (
              <Card
                key={plan.key}
                className={`bg-card transition-all duration-200 relative ${planColors[plan.key] ?? "border-border"}`}
              >
                {badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-brand text-white border-0 text-xs px-3">
                      {badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4 pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    {planIcons[plan.key]}
                    <span className="font-bold text-lg">{plan.name}</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-display font-bold">
                      {(plan.priceMonthly / 100).toFixed(0)}€
                    </span>
                    <span className="text-muted-foreground text-sm">/mes</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full font-semibold ${
                      plan.key === "done_with_you"
                        ? "gradient-brand text-white border-0"
                        : plan.key === "agency"
                        ? "bg-purple-600 hover:bg-purple-700 text-white border-0"
                        : "border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                    }`}
                    variant={plan.key === "diy" ? "outline" : "default"}
                    disabled={isCurrentPlan || loadingPlan === plan.key}
                    onClick={() => handleSelectPlan(plan.key)}
                  >
                    {loadingPlan === plan.key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isCurrentPlan ? (
                      <><CheckCircle2 className="w-4 h-4 mr-1" /> Plan actual</>
                    ) : (
                      <>
                        Empezar con {plan.name}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust signals */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-muted-foreground text-sm">
            ✓ 14 días de prueba gratis &nbsp;·&nbsp; ✓ Sin permanencia &nbsp;·&nbsp; ✓ Cancela en cualquier momento &nbsp;·&nbsp; ✓ Soporte en español
          </p>
          <p className="text-muted-foreground/50 text-xs">
            Prueba con tarjeta: 4242 4242 4242 4242 · Cualquier fecha futura · Cualquier CVV
          </p>
        </div>
      </div>
    </div>
  );
}
