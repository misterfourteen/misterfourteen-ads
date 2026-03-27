import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Brain, Sparkles, Edit2, Target, MessageSquare, Trophy, Palette, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function BrandBrain() {
  const [, setLocation] = useLocation();
  const { data: brain, isLoading } = trpc.brandBrain.getMine.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!brain) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="glass-card rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-3">Aún no tienes un Brand Brain</h2>
          <p className="text-muted-foreground mb-6">Configura tu marca para que la IA genere contenido 100% personalizado a tu negocio.</p>
          <Button onClick={() => setLocation("/onboarding")} className="gradient-brand text-white border-0">
            <Sparkles className="w-4 h-4 mr-2" /> Crear mi Brand Brain
          </Button>
        </div>
      </div>
    );
  }

  const sections = [
    {
      icon: Target,
      title: "Negocio y Nicho",
      items: [
        { label: "Nombre", value: brain.businessName },
        { label: "Nicho", value: brain.niche },
        { label: "Sub-nicho", value: brain.subNiche },
        { label: "Rango de edad", value: brain.targetAgeRange },
        { label: "Género objetivo", value: brain.targetGender === "all" ? "Todos" : brain.targetGender === "female" ? "Mujeres" : "Hombres" },
      ],
    },
    {
      icon: MessageSquare,
      title: "Cliente Ideal",
      items: [
        { label: "Dolores", value: brain.targetPains },
        { label: "Deseos", value: brain.targetDesires },
        { label: "Objeciones", value: brain.targetObjections },
      ],
    },
    {
      icon: MessageSquare,
      title: "Tono y Comunicación",
      items: [
        { label: "Tono", value: brain.communicationTone },
        { label: "Voz de marca", value: brain.brandVoice },
        { label: "Palabras a evitar", value: brain.wordsToAvoid },
      ],
    },
    {
      icon: Trophy,
      title: "Diferenciadores",
      items: [
        { label: "Principal diferenciador", value: brain.mainDifferentiator },
        { label: "Casos de éxito", value: brain.successCases },
        { label: "Metodología", value: brain.methodology },
      ],
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-display font-bold">Brand Brain</h1>
            {brain.isComplete ? (
              <Badge className="bg-green-500/15 text-green-400 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Activo
              </Badge>
            ) : (
              <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                <AlertCircle className="w-3 h-3 mr-1" /> Incompleto
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">El contexto de marca que la IA usa para generar todo tu contenido.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setLocation("/onboarding")}>
          <Edit2 className="w-4 h-4 mr-2" /> Editar
        </Button>
      </div>

      {/* Colores */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Identidad Visual</h3>
        </div>
        <div className="flex items-center gap-4">
          {[
            { label: "Primario", color: brain.primaryColor },
            { label: "Secundario", color: brain.secondaryColor },
            { label: "Acento", color: brain.accentColor },
          ].map(c => (
            <div key={c.label} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg border border-border" style={{ backgroundColor: c.color ?? "#000" }} />
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-xs font-mono font-medium">{c.color}</p>
              </div>
            </div>
          ))}
          <div className="ml-4 pl-4 border-l border-border">
            <p className="text-xs text-muted-foreground">Estilo</p>
            <p className="text-sm font-medium capitalize">{brain.visualStyle}</p>
          </div>
        </div>
      </div>

      {/* Info sections */}
      <div className="grid md:grid-cols-2 gap-4">
        {sections.map(section => (
          <div key={section.title} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <section.icon className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">{section.title}</h3>
            </div>
            <div className="space-y-3">
              {section.items.filter(i => i.value).map(item => (
                <div key={item.label}>
                  <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                  <p className="text-sm leading-relaxed">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Master Prompt */}
      {brain.masterPrompt && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Prompt Maestro Generado por IA</h3>
            <Badge variant="outline" className="border-primary/30 text-primary text-xs">Auto-generado</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{brain.masterPrompt}</p>
        </div>
      )}

      {/* CTA si incompleto */}
      {!brain.isComplete && (
        <div className="glass-card rounded-xl p-5 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium mb-1">Completa tu Brand Brain</p>
              <p className="text-sm text-muted-foreground">Termina la configuración para activar todos los generadores de IA.</p>
            </div>
            <Button onClick={() => setLocation("/onboarding")} className="gradient-brand text-white border-0 shrink-0 ml-4">
              Completar ahora
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
