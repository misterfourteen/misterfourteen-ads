import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Sparkles, Copy, Heart, Loader2, AlertCircle, RefreshCw,
  ChevronDown, ChevronRight, History, Plus, Minus, ExternalLink, RotateCcw
} from "lucide-react";

// ─── Todos los objetivos Meta ─────────────────────────────────────────────────
const META_OBJECTIVES = [
  { group: "Reconocimiento", items: ["Reconocimiento de marca", "Alcance máximo"] },
  { group: "Consideración", items: ["Tráfico web", "Interacción con publicación", "Nuevos seguidores", "Reproducciones de vídeo", "Generación de leads", "Mensajes directos"] },
  { group: "Conversión", items: ["Conversiones web", "Ventas del catálogo", "Visitas al negocio"] },
];

type CopyVariant = { primaryText: string; headline: string; description: string; cta: string };
type HistoryItem = { id: number; objective: string | null; adFormat: string | null; content: string | null; createdAt: Date | string; isFavorite: boolean };

export default function GenerateCopy() {
  const [, setLocation] = useLocation();
  const [objective, setObjective] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [variantCount, setVariantCount] = useState(3);
  const [results, setResults] = useState<CopyVariant[]>([]);
  const [savedId, setSavedId] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);

  const { data: brain } = trpc.brandBrain.getMine.useQuery();
  const { data: history, refetch: refetchHistory } = trpc.generate.history.useQuery({ type: "copy" });
  const generateMutation = trpc.generate.copy.useMutation();
  const favoriteMutation = trpc.generate.toggleFavorite.useMutation({
    onSuccess: () => { refetchHistory(); toast.success("Guardado en favoritos"); },
  });

  const handleGenerate = async (reuseContext?: { objective: string; context: string }) => {
    const obj = reuseContext?.objective ?? objective;
    const ctx = reuseContext?.context ?? additionalContext;
    if (!obj) { toast.error("Selecciona un objetivo"); return; }
    try {
      const result = await generateMutation.mutateAsync({
        objective: obj,
        adFormat: "Flexible",
        additionalContext: ctx,
        variantCount,
      });
      setResults(result.copies);
      setSavedId(result.id);
      setSelectedHistoryItem(null);
      refetchHistory();
      toast.success(`¡${result.copies.length} variantes generadas!`);
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

  const openHistoryItem = (item: HistoryItem) => {
    setSelectedHistoryItem(item);
    try {
      const parsed = item.content ? JSON.parse(item.content) : null;
      if (parsed?.copies) setResults(parsed.copies);
      if (item.objective) setObjective(item.objective);
    } catch { /* ignore */ }
  };

  if (!brain?.isComplete) {
    return (
      <div className="max-w-2xl mx-auto py-6">
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
    <div className="max-w-5xl mx-auto space-y-5 py-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> Generador de Copies
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Genera textos publicitarios con la voz de <strong>{brain.businessName}</strong></p>
        </div>
        <Badge variant="outline" className="border-green-500/30 text-green-400">Brand Brain activo</Badge>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* ─── Form ─── */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sm">Configuración</h3>

          {/* Objetivos Meta agrupados */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Objetivo de la campaña *</Label>
            <div className="space-y-3">
              {META_OBJECTIVES.map(group => (
                <div key={group.group}>
                  <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5">{group.group}</p>
                  <div className="space-y-1">
                    {group.items.map(o => (
                      <button key={o} onClick={() => setObjective(o)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg border text-xs transition-all ${objective === o ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Número de variantes */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Número de variantes</Label>
            <div className="flex items-center gap-3">
              <button onClick={() => setVariantCount(v => Math.max(1, v - 1))} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <Input
                type="number"
                min={1}
                max={20}
                value={variantCount}
                onChange={e => setVariantCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-16 text-center h-8 text-sm bg-secondary/50"
              />
              <button onClick={() => setVariantCount(v => Math.min(20, v + 1))} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <div className="flex gap-1 ml-1">
                {[1, 3, 5, 10].map(n => (
                  <button key={n} onClick={() => setVariantCount(n)}
                    className={`w-7 h-7 rounded text-xs border transition-all ${variantCount === n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contexto */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Contexto adicional (opcional)</Label>
            <Textarea rows={3} placeholder="ej: Promoción de enero, descuento del 20%, campaña de captación..." value={additionalContext} onChange={e => setAdditionalContext(e.target.value)} className="text-sm resize-none" />
          </div>

          <Button onClick={() => handleGenerate()} disabled={generateMutation.isPending || !objective} className="w-full gradient-brand text-white border-0">
            {generateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generar {variantCount} variante{variantCount !== 1 ? "s" : ""}</>}
          </Button>

          {selectedHistoryItem && (
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleGenerate({ objective: selectedHistoryItem.objective ?? "", context: additionalContext })}>
              <RotateCcw className="w-3 h-3 mr-1.5" /> Crear más desde este copy
            </Button>
          )}
        </div>

        {/* ─── Results ─── */}
        <div className="lg:col-span-3 space-y-3">
          {results.length === 0 && !generateMutation.isPending && (
            <div className="glass-card rounded-xl p-10 text-center">
              <Sparkles className="w-10 h-10 text-primary/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Selecciona un objetivo y genera tus copies.</p>
            </div>
          )}
          {generateMutation.isPending && (
            <div className="glass-card rounded-xl p-10 text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">La IA está generando {variantCount} variantes con tu Brand Brain...</p>
            </div>
          )}
          {results.map((copy, idx) => (
            <div key={idx} className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="border-primary/30 text-primary text-xs">Variante {idx + 1}</Badge>
                <div className="flex gap-1.5">
                  {savedId && (
                    <button onClick={() => favoriteMutation.mutate({ id: savedId, isFavorite: true })} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Guardar en favoritos">
                      <Heart className="w-3.5 h-3.5 text-muted-foreground hover:text-red-400" />
                    </button>
                  )}
                  <button onClick={() => copyToClipboard(`${copy.primaryText}\n\n${copy.headline}\n${copy.description}\n\nCTA: ${copy.cta}`)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Copiar todo">
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
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
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(copy.primaryText)} className="text-xs h-7">
                  <Copy className="w-3 h-3 mr-1" /> Copiar texto
                </Button>
              </div>
            </div>
          ))}
          {results.length > 0 && (
            <Button variant="outline" onClick={() => handleGenerate()} disabled={generateMutation.isPending} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" /> Regenerar {variantCount} variante{variantCount !== 1 ? "s" : ""}
            </Button>
          )}
        </div>
      </div>

      {/* ─── Historial ─── */}
      {history && history.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <button
            onClick={() => setHistoryOpen(o => !o)}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Historial reciente</span>
              <Badge variant="outline" className="text-xs border-border">{history.length}</Badge>
            </div>
            {historyOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>
          {historyOpen && (
            <div className="border-t border-border/50">
              {history.map(item => {
                let preview = "—";
                try { preview = item.content ? JSON.parse(item.content)?.copies?.[0]?.primaryText?.slice(0, 80) + "..." : "—"; } catch { /* */ }
                const isSelected = selectedHistoryItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => openHistoryItem(item as unknown as HistoryItem)}
                    className={`flex items-start justify-between p-4 border-b border-border/30 last:border-0 cursor-pointer hover:bg-secondary/20 transition-colors ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-medium text-primary">{item.objective}</p>
                        {item.isFavorite && <Heart className="w-3 h-3 text-red-400 fill-red-400" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{preview}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString("es-ES")}</p>
                      <button
                        onClick={e => { e.stopPropagation(); handleGenerate({ objective: item.objective ?? "", context: additionalContext }); }}
                        className="p-1 rounded hover:bg-secondary transition-colors"
                        title="Crear más variantes desde este"
                      >
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
