import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  Zap, Brain, Target, BarChart3, Shield, ArrowRight,
  CheckCircle2, Sparkles, Play, TrendingUp
} from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Brain,
      title: "Brand Brain",
      description: "La IA aprende tu nicho, tono y metodología. Cada contenido generado suena exactamente como tú.",
    },
    {
      icon: Sparkles,
      title: "Copies con IA",
      description: "Genera textos publicitarios de alta conversión en segundos, adaptados a tu avatar de cliente ideal.",
    },
    {
      icon: Play,
      title: "Guiones de Vídeo",
      description: "Guiones listos para grabar que siguen tu metodología y conectan con el dolor de tu cliente.",
    },
    {
      icon: Target,
      title: "Creativos Visuales",
      description: "Imágenes generadas con IA que respetan tu paleta de colores, logo y estilo de marca.",
    },
    {
      icon: Zap,
      title: "Publicación Automática",
      description: "Conecta tu cuenta de Meta y publica campañas en Facebook e Instagram con un solo clic.",
    },
    {
      icon: BarChart3,
      title: "Dashboard de Métricas",
      description: "Visualiza impresiones, clics, gasto y conversiones de todas tus campañas en tiempo real.",
    },
  ];

  const plans = [
    {
      name: "DIY",
      price: "97",
      period: "/mes",
      description: "Para entrenadores que empiezan",
      features: [
        "Brand Brain completo",
        "50 copies/mes con IA",
        "20 guiones/mes",
        "10 imágenes/mes",
        "Publicación en Meta",
        "Dashboard básico",
      ],
      cta: "Empezar ahora",
      highlight: false,
    },
    {
      name: "Done With You",
      price: "297",
      period: "/mes",
      description: "Para entrenadores en crecimiento",
      features: [
        "Todo lo del plan DIY",
        "Copies y guiones ilimitados",
        "50 imágenes/mes",
        "Llamada grupal semanal",
        "Revisión de métricas",
        "Soporte prioritario",
      ],
      cta: "El más popular",
      highlight: true,
    },
    {
      name: "Agencia",
      price: "1.000",
      period: "/mes",
      description: "Servicio completo de Mister Fourteen",
      features: [
        "Todo lo del Done With You",
        "Gestión completa de campañas",
        "Estrategia personalizada",
        "Edición de vídeos",
        "Acceso directo al equipo",
        "Resultados garantizados",
      ],
      cta: "Hablar con el equipo",
      highlight: false,
    },
  ];

  const stats = [
    { value: "250k€+", label: "Facturación media de nuestros clientes" },
    { value: "3 min", label: "Para lanzar tu primera campaña con IA" },
    { value: "100%", label: "Contenido personalizado a tu marca" },
    { value: "0 baneos", label: "Con nuestra metodología Meta-safe" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-sm">M14</span>
            </div>
            <span className="font-display font-bold text-lg">Mister Fourteen</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Precios</a>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Planes</Link>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="gradient-brand text-white border-0 glow-primary">
                  Ir al Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost" size="sm">Iniciar sesión</Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button size="sm" className="gradient-brand text-white border-0">
                    Empezar gratis
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-primary/8 blur-3xl" />
        </div>
        <div className="container relative text-center">
          <Badge variant="outline" className="mb-6 border-primary/30 text-primary bg-primary/10 px-4 py-1.5">
            <Sparkles className="w-3 h-3 mr-1.5" />
            Plataforma IA para Meta Ads
          </Badge>
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6">
            Lanza campañas en Meta<br />
            <span className="gradient-brand-text">que realmente convierten</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            La IA aprende tu marca, genera copies, guiones e imágenes personalizados y publica automáticamente en Facebook e Instagram. Sin humo. Sin baneos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={getLoginUrl()}>
              <Button size="lg" className="gradient-brand text-white border-0 glow-primary text-base px-8 h-12">
                Empezar gratis ahora <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <a href="#features">
              <Button size="lg" variant="outline" className="text-base px-8 h-12">
                Ver cómo funciona
              </Button>
            </a>
          </div>
          <p className="text-sm text-muted-foreground mt-4">Sin tarjeta de crédito · Cancela cuando quieras</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.value} className="text-center">
                <div className="text-3xl font-display font-bold gradient-brand-text mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/10">
              Funcionalidades
            </Badge>
            <h2 className="text-4xl font-display font-bold mb-4">
              Todo lo que necesitas para escalar
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Una plataforma construida específicamente para entrenadores y nutricionistas que venden servicios digitales.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all duration-300 group">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-card/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">Lanza en 3 pasos</h2>
            <p className="text-muted-foreground text-lg">Sin conocimientos técnicos. Sin agencia. Sin esperas.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Configura tu Brand Brain", desc: "Cuéntale a la IA quién eres, a quién vendes y cómo hablas. Una sola vez." },
              { step: "02", title: "Genera tu contenido", desc: "Copies, guiones e imágenes creados con tu voz de marca en segundos." },
              { step: "03", title: "Publica en Meta", desc: "Conecta tu cuenta y lanza la campaña directamente desde la plataforma." },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="text-6xl font-display font-black text-primary/10 mb-4">{item.step}</div>
                <h3 className="font-display font-semibold text-xl mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-primary/30 text-primary bg-primary/10">Precios</Badge>
            <h2 className="text-4xl font-display font-bold mb-4">Elige tu plan</h2>
            <p className="text-muted-foreground text-lg">Sin letra pequeña. Sin sorpresas.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 border transition-all duration-300 ${
                  plan.highlight
                    ? "border-primary bg-primary/5 glow-primary relative"
                    : "border-border glass-card"
                }`}
              >
                {plan.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-brand text-white border-0 px-4">
                    Más popular
                  </Badge>
                )}
                <div className="mb-6">
                  <h3 className="font-display font-bold text-xl mb-1">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-display font-black">{plan.price}€</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a href={getLoginUrl()}>
                  <Button
                    className={`w-full ${plan.highlight ? "gradient-brand text-white border-0" : ""}`}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-brand opacity-5 pointer-events-none" />
        <div className="container text-center relative">
          <TrendingUp className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            ¿Listo para escalar con IA?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
            Únete a los entrenadores que ya lanzan campañas rentables en Meta sin perder tiempo ni dinero.
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="gradient-brand text-white border-0 glow-primary text-base px-10 h-12">
              Empezar gratis <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded gradient-brand flex items-center justify-center">
              <span className="text-white font-bold text-xs">M14</span>
            </div>
            <span className="text-sm font-medium">Mister Fourteen</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Mister Fourteen. Agencia de tráfico digital para el sector fitness.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacidad</a>
            <a href="#" className="hover:text-foreground transition-colors">Términos</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
