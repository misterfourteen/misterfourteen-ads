import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import {
  TrendingUp, Users, DollarSign, Target, ArrowRight,
  Quote, Star, CheckCircle2, Zap
} from "lucide-react";

interface CaseStudy {
  id: string;
  name: string;
  role: string;
  niche: string;
  avatar: string;
  before: { revenue: string; spend: string; roas: string };
  after: { revenue: string; spend: string; roas: string };
  timeframe: string;
  quote: string;
  results: string[];
  tags: string[];
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: "1",
    name: "Carlos M.",
    role: "Entrenador Personal Online",
    niche: "Pérdida de grasa hombres 30-45",
    avatar: "CM",
    before: { revenue: "3.200€/mes", spend: "800€/mes", roas: "1.8x" },
    after: { revenue: "18.500€/mes", spend: "2.400€/mes", roas: "6.2x" },
    timeframe: "4 meses",
    quote: "Pasé de gastar en anuncios sin saber si funcionaban a tener un sistema que me genera clientes todos los días. El Brand Brain fue el cambio total.",
    results: [
      "ROAS de 1.8x a 6.2x en 4 meses",
      "Coste por lead reducido un 68%",
      "12 clientes nuevos al mes de forma consistente",
      "Facturación multiplicada por 5.8x",
    ],
    tags: ["Entrenamiento", "Pérdida de grasa", "Meta Ads"],
  },
  {
    id: "2",
    name: "Laura S.",
    role: "Nutricionista Online",
    niche: "Nutrición hormonal mujeres 25-40",
    avatar: "LS",
    before: { revenue: "1.800€/mes", spend: "400€/mes", roas: "2.1x" },
    after: { revenue: "11.200€/mes", spend: "1.800€/mes", roas: "5.1x" },
    timeframe: "3 meses",
    quote: "Los copies que genera la IA con mi Brand Brain suenan exactamente como yo. Mis clientes me dicen que el anuncio les pareció muy auténtico. Eso no lo consigues con una herramienta genérica.",
    results: [
      "De 4 a 28 consultas mensuales",
      "Ticket medio aumentado un 40%",
      "CTR del 4.8% en campañas de leads",
      "Primer mes con 10k€+ de facturación",
    ],
    tags: ["Nutrición", "Salud hormonal", "Instagram Ads"],
  },
  {
    id: "3",
    name: "Marcos R.",
    role: "Coach de Transformación Física",
    niche: "Ganancia muscular hombres 18-35",
    avatar: "MR",
    before: { revenue: "5.500€/mes", spend: "1.200€/mes", roas: "2.8x" },
    after: { revenue: "32.000€/mes", spend: "4.500€/mes", roas: "6.8x" },
    timeframe: "6 meses",
    quote: "El A/B testing automático me ahorró semanas de trabajo. En 3 días sabía qué copy funcionaba mejor. Ahora escalo lo que funciona y paro lo que no.",
    results: [
      "Escalado de 1.2k€ a 4.5k€/mes en ads",
      "ROAS sostenido por encima de 6x",
      "Programa de 6 meses con lista de espera",
      "32k€/mes de facturación recurrente",
    ],
    tags: ["Musculación", "Transformación", "Facebook Ads"],
  },
];

const METRICS = [
  { icon: <TrendingUp className="w-5 h-5" />, value: "5.8x", label: "ROAS promedio de clientes" },
  { icon: <Users className="w-5 h-5" />, value: "200+", label: "Entrenadores y nutricionistas" },
  { icon: <DollarSign className="w-5 h-5" />, value: "2.4M€", label: "Facturación generada" },
  { icon: <Target className="w-5 h-5" />, value: "68%", label: "Reducción coste por lead" },
];

export default function CaseStudies() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="pt-20 pb-12 text-center px-4">
        <Badge variant="outline" className="border-primary/30 text-primary mb-4">
          Resultados reales
        </Badge>
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
          Entrenadores que pasaron de{" "}
          <span className="text-primary">sobrevivir a escalar</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Sin humo. Sin pantallas de resultados inventadas. Casos reales de clientes que usaron la plataforma para multiplicar su facturación.
        </p>
      </div>

      {/* Metrics */}
      <div className="max-w-4xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {METRICS.map((m, i) => (
            <Card key={i} className="bg-card border-border text-center">
              <CardContent className="pt-6 pb-6">
                <div className="flex justify-center text-primary mb-2">{m.icon}</div>
                <p className="text-3xl font-display font-bold text-foreground">{m.value}</p>
                <p className="text-muted-foreground text-xs mt-1">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Case studies */}
      <div className="max-w-5xl mx-auto px-4 pb-20 space-y-8">
        {CASE_STUDIES.map((cs) => (
          <Card key={cs.id} className="bg-card border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-5">
                {/* Left: profile + quote */}
                <div className="md:col-span-2 p-6 border-b md:border-b-0 md:border-r border-border bg-secondary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center text-white font-bold text-sm">
                      {cs.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{cs.name}</p>
                      <p className="text-muted-foreground text-xs">{cs.role}</p>
                    </div>
                  </div>

                  <div className="flex gap-1 mb-3">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <div className="relative">
                    <Quote className="w-6 h-6 text-primary/20 absolute -top-1 -left-1" />
                    <p className="text-sm text-muted-foreground leading-relaxed pl-4 italic">
                      "{cs.quote}"
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1">
                    {cs.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-[10px] border-border text-muted-foreground">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Right: metrics + results */}
                <div className="md:col-span-3 p-6 space-y-5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                      {cs.timeframe}
                    </Badge>
                    <span className="text-muted-foreground text-xs">{cs.niche}</span>
                  </div>

                  {/* Before / After */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                      <p className="text-xs text-red-400/70 font-medium mb-2">Antes</p>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{cs.before.revenue}</p>
                        <p className="text-xs text-muted-foreground">Gasto: {cs.before.spend}</p>
                        <p className="text-xs text-muted-foreground">ROAS: {cs.before.roas}</p>
                      </div>
                    </div>
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                      <p className="text-xs text-green-400/70 font-medium mb-2">Después</p>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-green-400">{cs.after.revenue}</p>
                        <p className="text-xs text-muted-foreground">Gasto: {cs.after.spend}</p>
                        <p className="text-xs text-muted-foreground">ROAS: {cs.after.roas}</p>
                      </div>
                    </div>
                  </div>

                  {/* Results list */}
                  <ul className="space-y-1.5">
                    {cs.results.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-secondary/30 border-t border-border py-16 px-4 text-center">
        <Zap className="w-8 h-8 text-primary mx-auto mb-4" />
        <h2 className="text-3xl font-display font-bold mb-3">
          ¿Cuándo es tu turno?
        </h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Empieza gratis hoy. Sin tarjeta. Sin permanencia. Solo resultados.
        </p>
        <Button
          className="gradient-brand text-white border-0 font-semibold px-8"
          onClick={() => (window.location.href = getLoginUrl())}
        >
          Empezar ahora gratis <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
