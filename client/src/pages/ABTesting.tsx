import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  FlaskConical, Sparkles, Loader2, Copy, Trophy, TrendingUp,
  BarChart3, RefreshCw, CheckCircle2, ArrowRight, Lightbulb
} from "lucide-react";

interface Variant {
  id: string;
  label: string;
  content: string;
  angle: string;
  hook: string;
}

interface ABResult {
  variants: Variant[];
  recommendation: string;
  testingTip: string;
}

const AD_FORMATS = [
  { value: "feed", label: "Feed (imagen cuadrada)" },
  { value: "story", label: "Story / Reels (vertical)" },
  { value: "reel_cover", label: "Portada de Reel" },
  { value: "carousel", label: "Carrusel" },
];

const OBJECTIVES = [
  { value: "leads", label: "Captación de leads" },
  { value: "sales", label: "Venta directa" },
  { value: "awareness", label: "Notoriedad de marca" },
  { value: "engagement", label: "Engagement / Interacción" },
  { value: "traffic", label: "Tráfico a web o landing" },
];

export default function ABTesting() {
  const [, navigate] = useLocation();
  const [objective, setObjective] = useState("");
  const [adFormat, setAdFormat] = useState("feed");
  const [context, setContext] = useState("");
  const [result, setResult] = useState<ABResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [winnerVote, setWinnerVote] = useState<string | null>(null);

  const { data: brandBrain } = trpc.brandBrain.getMine.useQuery();

  const generateAB = trpc.generate.abTest.useMutation({
    onSuccess: (data) => {
      setResult(data as ABResult);
      setWinnerVote(null);
      toast.success("3 variantes generadas. ¡Pruébalas en Meta Ads!");
    },
    onError: (err) => {
      toast.error(err.message || "Error al generar las variantes");
    },
  });

  function handleGenerate() {
    if (!objective) {
      toast.error("Selecciona un objetivo para el anuncio");
      return;
    }
    if (!brandBrain?.isComplete) {
      toast.error("Completa tu Brand Brain primero", {
        action: { label: "Configurar", onClick: () => navigate("/brand-brain") },
      });
      return;
    }
    generateAB.mutate({ objective, adFormat, additionalContext: context });
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copy copiado al portapapeles");
  }

  const variantColors = [
    "border-blue-500/40 bg-blue-500/5",
    "border-purple-500/40 bg-purple-500/5",
    "border-emerald-500/40 bg-emerald-500/5",
  ];

  const variantLabels = ["Variante A", "Variante B", "Variante C"];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">A/B Testing Automático</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Genera 3 variantes de copy con ángulos distintos. Pruébalas en Meta y deja que los datos decidan.
          </p>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary hidden md:flex">
          <Sparkles className="w-3 h-3 mr-1" /> IA Generativa
        </Badge>
      </div>

      {/* Brand Brain warning */}
      {!brandBrain?.isComplete && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-yellow-400 font-medium text-sm">Brand Brain incompleto</p>
            <p className="text-yellow-400/70 text-xs mt-0.5">
              Configura tu Brand Brain para que la IA use tu voz de marca en las variantes
            </p>
          </div>
          <Button size="sm" className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold" onClick={() => navigate("/brand-brain")}>
            Configurar
          </Button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Config panel */}
        <div className="md:col-span-1 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Configurar test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Objetivo del anuncio</Label>
                <Select value={objective} onValueChange={setObjective}>
                  <SelectTrigger className="bg-secondary/50 border-border text-sm">
                    <SelectValue placeholder="Selecciona objetivo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {OBJECTIVES.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Formato del anuncio</Label>
                <Select value={adFormat} onValueChange={setAdFormat}>
                  <SelectTrigger className="bg-secondary/50 border-border text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AD_FORMATS.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Contexto adicional (opcional)</Label>
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Ej: Promoción de verano, precio especial, oferta limitada..."
                  className="bg-secondary/50 border-border text-sm resize-none"
                  rows={3}
                />
              </div>

              <Button
                className="w-full gradient-brand text-white border-0 font-semibold"
                disabled={generateAB.isPending || !objective}
                onClick={handleGenerate}
              >
                {generateAB.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generando 3 variantes...</>
                ) : (
                  <><FlaskConical className="w-4 h-4 mr-2" /> Generar A/B Test</>
                )}
              </Button>

              {result && (
                <Button
                  variant="outline"
                  className="w-full border-border text-muted-foreground text-sm"
                  onClick={handleGenerate}
                  disabled={generateAB.isPending}
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Regenerar variantes
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Tip card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">Cómo hacer el test</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Crea 3 conjuntos de anuncios idénticos en Meta (mismo presupuesto, audiencia y creativos) y usa una variante de copy en cada uno. Deja correr 3-5 días con al menos 50€ de presupuesto total.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="md:col-span-2 space-y-4">
          {!result && !generateAB.isPending && (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-xl text-center p-6">
              <FlaskConical className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">Las 3 variantes aparecerán aquí</p>
              <p className="text-muted-foreground/60 text-sm mt-1">
                Configura el objetivo y pulsa "Generar A/B Test"
              </p>
            </div>
          )}

          {generateAB.isPending && (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-primary/30 rounded-xl text-center p-6 bg-primary/5">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
              <p className="text-primary font-medium">Generando 3 variantes con ángulos distintos...</p>
              <p className="text-muted-foreground text-sm mt-1">La IA está usando tu Brand Brain</p>
            </div>
          )}

          {result && !generateAB.isPending && (
            <div className="space-y-4">
              {/* Recommendation */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-primary mb-1">Recomendación de la IA</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{result.recommendation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Variants */}
              {result.variants.map((variant, i) => (
                <Card key={variant.id} className={`border transition-all ${variantColors[i] ?? "border-border"} ${winnerVote === variant.id ? "ring-2 ring-yellow-500/50" : ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs font-bold border-current">
                          {variantLabels[i]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{variant.angle}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {winnerVote === variant.id && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                            <Trophy className="w-3 h-3 mr-1" /> Mi favorita
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => setWinnerVote(variant.id === winnerVote ? null : variant.id)}
                        >
                          <Trophy className="w-3 h-3 mr-1" />
                          {variant.id === winnerVote ? "Quitar" : "Marcar favorita"}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-primary mt-1">
                      Hook: <span className="text-foreground font-normal">{variant.hook}</span>
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-background/50 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap">
                      {variant.content}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-border text-xs"
                        onClick={() => copyToClipboard(variant.content, variant.id)}
                      >
                        {copiedId === variant.id ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1 text-green-400" /> Copiado</>
                        ) : (
                          <><Copy className="w-3 h-3 mr-1" /> Copiar</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 gradient-brand text-white border-0 text-xs"
                        onClick={() => navigate("/campaigns/new")}
                      >
                        <ArrowRight className="w-3 h-3 mr-1" /> Usar en campaña
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Testing tip */}
              {result.testingTip && (
                <Card className="bg-secondary/30 border-border">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-2">
                      <BarChart3 className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">{result.testingTip}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
