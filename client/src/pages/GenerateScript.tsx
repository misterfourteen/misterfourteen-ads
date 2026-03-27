import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { FileText, Copy, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Streamdown } from "streamdown";

const DURATIONS = ["15s", "30s", "60s"] as const;
const PLATFORMS = [
  { value: "reels", label: "Reels / TikTok" },
  { value: "stories", label: "Stories" },
  { value: "feed", label: "Feed Video" },
] as const;

export default function GenerateScript() {
  const [, setLocation] = useLocation();
  const [duration, setDuration] = useState<"15s" | "30s" | "60s">("30s");
  const [platform, setPlatform] = useState<"reels" | "stories" | "feed">("reels");
  const [objective, setObjective] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [script, setScript] = useState("");

  const { data: brain } = trpc.brandBrain.getMine.useQuery();
  const { data: history, refetch } = trpc.generate.history.useQuery({ type: "script" });
  const generateMutation = trpc.generate.script.useMutation();

  const handleGenerate = async () => {
    if (!objective) { toast.error("Describe el objetivo del vídeo"); return; }
    try {
      const result = await generateMutation.mutateAsync({ duration, platform, objective, additionalContext });
      setScript(result.script);
      refetch();
      toast.success("¡Guión generado!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al generar";
      if (msg.includes("Brand Brain")) { setLocation("/onboarding"); }
      toast.error(msg);
    }
  };

  if (!brain?.isComplete) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="glass-card rounded-2xl p-10 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold mb-3">Brand Brain requerido</h2>
          <p className="text-muted-foreground mb-6">Configura tu Brand Brain primero para activar el generador de guiones.</p>
          <Button onClick={() => setLocation("/onboarding")} className="gradient-brand text-white border-0">Configurar Brand Brain</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Generador de Guiones
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Guiones listos para grabar con la voz de <strong>{brain.businessName}</strong></p>
        </div>
        <Badge variant="outline" className="border-green-500/30 text-green-400">Brand Brain activo</Badge>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 glass-card rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sm">Configuración</h3>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Duración</Label>
            <div className="flex gap-2">
              {DURATIONS.map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${duration === d ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Plataforma</Label>
            <div className="space-y-1.5">
              {PLATFORMS.map(p => (
                <button key={p.value} onClick={() => setPlatform(p.value)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${platform === p.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Objetivo del vídeo *</Label>
            <Textarea rows={3} placeholder="ej: Mostrar la transformación de un cliente, explicar mi metodología, lanzar una oferta..." value={objective} onChange={e => setObjective(e.target.value)} className="text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Contexto adicional</Label>
            <Textarea rows={2} placeholder="ej: Usar el caso de éxito de María, mencionar el precio..." value={additionalContext} onChange={e => setAdditionalContext(e.target.value)} className="text-sm" />
          </div>
          <Button onClick={handleGenerate} disabled={generateMutation.isPending || !objective} className="w-full gradient-brand text-white border-0">
            {generateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando...</> : <><FileText className="w-4 h-4 mr-2" /> Generar guión</>}
          </Button>
        </div>

        <div className="lg:col-span-3">
          {!script && !generateMutation.isPending && (
            <div className="glass-card rounded-xl p-10 text-center h-full flex items-center justify-center">
              <div>
                <FileText className="w-10 h-10 text-primary/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Configura los parámetros y genera tu guión de vídeo.</p>
              </div>
            </div>
          )}
          {generateMutation.isPending && (
            <div className="glass-card rounded-xl p-10 text-center h-full flex items-center justify-center">
              <div>
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Escribiendo tu guión con tu Brand Brain...</p>
              </div>
            </div>
          )}
          {script && (
            <div className="glass-card rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-primary/30 text-primary text-xs">{duration} · {platform}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(script); toast.success("Guión copiado"); }}>
                    <Copy className="w-3 h-3 mr-1.5" /> Copiar
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generateMutation.isPending}>
                    <RefreshCw className="w-3 h-3 mr-1.5" /> Regenerar
                  </Button>
                </div>
              </div>
              <div className="prose prose-sm prose-invert max-w-none">
                <Streamdown>{script}</Streamdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {history && history.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Guiones recientes</h3>
          <div className="space-y-2">
            {history.slice(0, 4).map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-xs text-muted-foreground">{item.adFormat} · {item.objective?.slice(0, 40)}</p>
                  <p className="text-sm truncate max-w-md">{item.content?.slice(0, 80)}...</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString("es-ES")}</p>
                  <Button size="sm" variant="ghost" onClick={() => setScript(item.content ?? "")}>Ver</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
