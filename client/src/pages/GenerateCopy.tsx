import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Sparkles, Copy, Heart, Loader2, AlertCircle, RefreshCw, ChevronDown } from "lucide-react";

const OBJECTIVES = ["Captación de leads", "Ventas directas", "Reconocimiento de marca", "Tráfico web", "Interacción"];
const FORMATS = ["Feed (cuadrado)", "Story (vertical)", "Reel", "Carrusel", "Video feed"];

type CopyVariant = { primaryText: string; headline: string; description: string; cta: string };

export default function GenerateCopy() {
  const [, setLocation] = useLocation();
  const [objective, setObjective] = useState("");
  const [adFormat, setAdFormat] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [results, setResults] = useState<CopyVariant[]>([]);
  const [savedId, setSavedId] = useState<number | null>(null);

  const { data: brain } = trpc.brandBrain.getMine.useQuery();
  const { data: history, refetch: refetchHistory } = trpc.generate.history.useQuery({ type: "copy" });
  const generateMutation = trpc.generate.copy.useMutation();
  const favoriteMutation = trpc.generate.toggleFavorite.useMutation();

  const handleGenerate = async () => {
    if (!objective || !adFormat) { toast.error("Selecciona objetivo y formato"); return; }
    try {
      const result = await generateMutation.mutateAsync({ objective, adFormat, additionalContext });
      setResults(result.copies);
      setSavedId(result.id);
      refetchHistory();
      toast.success("¡3 variantes generadas!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al generar";
      if (msg.includes("Brand Brain")) {
        toast.error("Completa tu Brand Brain primero");
        setLocation("/onboarding");
      } else {
        toast.error(msg);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  if (!brain?.isComplete) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="glass-card rounded-2xl p-10 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold mb-3">Brand Brain requerido</h2>
          <p className="text-muted-foreground mb-6">Configura tu Brand Brain para que la IA genere copies con tu voz de marca.</p>
          <Button onClick={() => setLocation("/onboarding")} className="gradient-brand text-white border-0">
            Configurar Brand Brain
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> Generador de Copies
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Genera textos publicitarios con la voz de <strong>{brain.businessName}</strong></p>
        </div>
        <Badge variant="outline" className="border-green-500/30 text-green-400">Brand Brain activo</Badge>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sm">Configuración</h3>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Objetivo de la campaña *</Label>
            <div className="space-y-1.5">
              {OBJECTIVES.map(o => (
                <button key={o} onClick={() => setObjective(o)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${objective === o ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Formato del anuncio *</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {FORMATS.map(f => (
                <button key={f} onClick={() => setAdFormat(f)}
                  className={`text-center px-2 py-2 rounded-lg border text-xs transition-all ${adFormat === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Contexto adicional (opcional)</Label>
            <Textarea rows={3} placeholder="ej: Promoción de enero, descuento del 20%..." value={additionalContext} onChange={e => setAdditionalContext(e.target.value)} className="text-sm" />
          </div>
          <Button onClick={handleGenerate} disabled={generateMutation.isPending || !objective || !adFormat} className="w-full gradient-brand text-white border-0">
            {generateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generar 3 variantes</>}
          </Button>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {results.length === 0 && !generateMutation.isPending && (
            <div className="glass-card rounded-xl p-10 text-center">
              <Sparkles className="w-10 h-10 text-primary/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Configura los parámetros y genera tus primeras variantes de copy.</p>
            </div>
          )}
          {generateMutation.isPending && (
            <div className="glass-card rounded-xl p-10 text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">La IA está generando copies con tu Brand Brain...</p>
            </div>
          )}
          {results.map((copy, idx) => (
            <div key={idx} className="glass-card rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-primary/30 text-primary text-xs">Variante {idx + 1}</Badge>
                <div className="flex gap-2">
                  {savedId && (
                    <button onClick={() => favoriteMutation.mutate({ id: savedId, isFavorite: true })} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <Heart className="w-4 h-4 text-muted-foreground hover:text-red-400" />
                    </button>
                  )}
                  <button onClick={() => copyToClipboard(`${copy.primaryText}\n\n${copy.headline}\n${copy.description}\n\nCTA: ${copy.cta}`)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Texto principal</p>
                <p className="text-sm leading-relaxed">{copy.primaryText}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Titular</p>
                  <p className="text-sm font-medium">{copy.headline}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                  <p className="text-sm">{copy.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div>
                  <p className="text-xs text-muted-foreground">CTA sugerido</p>
                  <p className="text-sm font-semibold text-primary">{copy.cta}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(copy.primaryText)}>
                  <Copy className="w-3 h-3 mr-1.5" /> Copiar texto
                </Button>
              </div>
            </div>
          ))}
          {results.length > 0 && (
            <Button variant="outline" onClick={handleGenerate} disabled={generateMutation.isPending} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" /> Regenerar variantes
            </Button>
          )}
        </div>
      </div>

      {/* History */}
      {history && history.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Historial reciente</h3>
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-xs text-muted-foreground">{item.objective} · {item.adFormat}</p>
                  <p className="text-sm truncate max-w-md">{item.content ? JSON.parse(item.content)?.copies?.[0]?.primaryText?.slice(0, 60) + "..." : "-"}</p>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString("es-ES")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
