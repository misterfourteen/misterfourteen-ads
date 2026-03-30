import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  MessageSquare, Instagram, Facebook, Sparkles, Loader2,
  AlertCircle, Copy, ChevronDown, ChevronUp, Plus, Trash2, ArrowRight
} from "lucide-react";
import { Streamdown } from "streamdown";

const PLATFORMS = [
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "text-green-400 border-green-500/30 bg-green-500/10", desc: "Secuencias de mensajes y respuestas automáticas" },
  { value: "instagram", label: "Instagram DM", icon: Instagram, color: "text-pink-400 border-pink-500/30 bg-pink-500/10", desc: "Flujos de DM para leads desde anuncios" },
  { value: "facebook", label: "Facebook Messenger", icon: Facebook, color: "text-blue-400 border-blue-500/30 bg-blue-500/10", desc: "Chatbot y secuencias de Messenger" },
] as const;

const PIPELINE_TYPES = [
  { value: "welcome", label: "Bienvenida nuevo lead", desc: "Primer contacto tras opt-in" },
  { value: "nurture", label: "Nutrición de leads", desc: "Secuencia de 5-7 mensajes" },
  { value: "sales", label: "Cierre de ventas", desc: "Conversación orientada a compra" },
  { value: "reactivation", label: "Reactivación", desc: "Recuperar leads fríos" },
  { value: "post_purchase", label: "Post-compra", desc: "Onboarding y retención" },
  { value: "keyword_trigger", label: "Trigger por palabra clave", desc: "Respuesta automática a palabra" },
] as const;

type Platform = typeof PLATFORMS[number]["value"];
type PipelineType = typeof PIPELINE_TYPES[number]["value"];

interface PipelineStep {
  id: number;
  delay: string;
  message: string;
  type: "message" | "question" | "cta";
}

export default function Pipelines() {
  const [, setLocation] = useLocation();
  const [platform, setPlatform] = useState<Platform>("whatsapp");
  const [pipelineType, setPipelineType] = useState<PipelineType>("welcome");
  const [objective, setObjective] = useState("");
  const [keyword, setKeyword] = useState("");
  const [generatedPipeline, setGeneratedPipeline] = useState<PipelineStep[]>([]);
  const [rawContent, setRawContent] = useState("");
  const [showSteps, setShowSteps] = useState(true);

  const { data: brain } = trpc.brandBrain.getMine.useQuery();
  const generateMutation = trpc.generate.pipeline.useMutation();

  const handleGenerate = async () => {
    if (!objective) { toast.error("Describe el objetivo del pipeline"); return; }
    try {
      const result = await generateMutation.mutateAsync({
        platform,
        type: pipelineType,
        steps: 5,
        additionalContext: `Objetivo: ${objective}${pipelineType === "keyword_trigger" ? `. Palabra clave: ${keyword}` : ""}`,
      });
      const rawResult = result as Record<string, unknown>;
      const rawSteps = rawResult.steps;
      const parsedSteps: PipelineStep[] = Array.isArray(rawSteps)
        ? (rawSteps as Array<Record<string, unknown>>).map((s, i) => ({
            id: i + 1,
            delay: String(s.delay ?? `Día ${i + 1}`),
            message: String(s.message ?? ""),
            type: (["message", "question", "cta"].includes(String(s.type)) ? String(s.type) : "message") as "message" | "question" | "cta",
          }))
        : [];
      setRawContent(parsedSteps.length > 0 ? JSON.stringify(rawResult) : JSON.stringify(rawResult));
      setGeneratedPipeline(parsedSteps);
      toast.success("¡Pipeline generado!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al generar";
      toast.error(msg);
    }
  };

  const copyStep = (msg: string) => {
    navigator.clipboard.writeText(msg);
    toast.success("Mensaje copiado");
  };

  const copyAll = () => {
    const text = generatedPipeline.map((s, i) => `Paso ${i + 1} (${s.delay}):\n${s.message}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(text || rawContent);
    toast.success("Pipeline completo copiado");
  };

  if (!brain?.isComplete) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <div className="glass-card rounded-2xl p-10 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold mb-3">Brand Brain requerido</h2>
          <p className="text-muted-foreground mb-6">Configura tu Brand Brain para generar pipelines con tu voz de marca.</p>
          <Button onClick={() => setLocation("/onboarding")} className="gradient-brand text-white border-0">Configurar Brand Brain</Button>
        </div>
      </div>
    );
  }

  const selectedPlatform = PLATFORMS.find(p => p.value === platform)!;

  return (
    <div className="max-w-5xl mx-auto space-y-5 py-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" /> Pipelines de Mensajería
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Secuencias automatizadas para WhatsApp, Instagram DM y Facebook Messenger</p>
        </div>
        <Badge variant="outline" className="border-green-500/30 text-green-400">Brand Brain activo</Badge>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Config */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5 space-y-4">
          {/* Platform */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Plataforma</Label>
            <div className="space-y-1.5">
              {PLATFORMS.map(p => (
                <button key={p.value} onClick={() => setPlatform(p.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${platform === p.value ? p.color : "border-border hover:border-primary/40"}`}>
                  <p.icon className={`w-4 h-4 shrink-0 ${platform === p.value ? "" : "text-muted-foreground"}`} />
                  <div className="text-left">
                    <p className={`text-xs font-semibold ${platform === p.value ? "" : "text-muted-foreground"}`}>{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Tipo de pipeline</Label>
            <div className="space-y-1">
              {PIPELINE_TYPES.map(t => (
                <button key={t.value} onClick={() => setPipelineType(t.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${pipelineType === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  <span className="font-medium">{t.label}</span>
                  <span className="text-muted-foreground">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Keyword trigger */}
          {pipelineType === "keyword_trigger" && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Palabra clave que activa el flujo</Label>
              <Input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder='ej: "INFO", "QUIERO", "PRECIO"' className="text-sm h-9" />
            </div>
          )}

          {/* Objective */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Objetivo del pipeline *</Label>
            <Textarea rows={3} value={objective} onChange={e => setObjective(e.target.value)}
              placeholder="ej: Convertir leads de anuncio de captación en llamada de consultoría gratuita"
              className="text-sm resize-none" />
          </div>

          <Button onClick={handleGenerate} disabled={generateMutation.isPending || !objective} className="w-full gradient-brand text-white border-0">
            {generateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generar Pipeline</>}
          </Button>
        </div>

        {/* Output */}
        <div className="lg:col-span-3 space-y-3">
          {!rawContent && !generateMutation.isPending && (
            <div className="glass-card rounded-xl p-12 text-center flex items-center justify-center min-h-[400px]">
              <div>
                <selectedPlatform.icon className="w-12 h-12 text-primary/20 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Tu pipeline aparecerá aquí.</p>
                <p className="text-xs text-muted-foreground mt-1">Selecciona plataforma, tipo y describe el objetivo.</p>
              </div>
            </div>
          )}
          {generateMutation.isPending && (
            <div className="glass-card rounded-xl p-12 text-center flex items-center justify-center min-h-[400px]">
              <div>
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Generando secuencia de mensajes...</p>
              </div>
            </div>
          )}
          {rawContent && !generateMutation.isPending && (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <selectedPlatform.icon className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">{selectedPlatform.label} Pipeline</span>
                  <Badge variant="outline" className={`text-xs ${selectedPlatform.color}`}>{PIPELINE_TYPES.find(t => t.value === pipelineType)?.label}</Badge>
                </div>
                <Button size="sm" variant="outline" onClick={copyAll} className="text-xs h-7">
                  <Copy className="w-3 h-3 mr-1" /> Copiar todo
                </Button>
              </div>

              {generatedPipeline.length > 0 ? (
                <div className="p-4 space-y-3">
                  {generatedPipeline.map((step, idx) => (
                    <div key={step.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">{idx + 1}</div>
                        {idx < generatedPipeline.length - 1 && <div className="w-0.5 h-full bg-border/50 mt-1" />}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">{step.delay}</Badge>
                          <Badge variant="outline" className={`text-xs ${step.type === "cta" ? "border-primary/30 text-primary" : step.type === "question" ? "border-yellow-500/30 text-yellow-400" : "border-border/50 text-muted-foreground"}`}>
                            {step.type === "cta" ? "CTA" : step.type === "question" ? "Pregunta" : "Mensaje"}
                          </Badge>
                        </div>
                        <div className="glass-card rounded-lg p-3 text-sm relative group">
                          <p className="leading-relaxed whitespace-pre-wrap">{step.message}</p>
                          <button onClick={() => copyStep(step.message)}
                            className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all">
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5">
                  <div className="prose prose-sm prose-invert max-w-none">
                    <Streamdown>{rawContent}</Streamdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
