import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { FileText, Copy, Loader2, AlertCircle, RefreshCw, Sparkles, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Streamdown } from "streamdown";

const DURATIONS = [
  { value: "15s", label: "15s", desc: "Hook rápido" },
  { value: "30s", label: "30s", desc: "Estándar" },
  { value: "60s", label: "60s", desc: "Completo" },
  { value: "90s", label: "90s", desc: "Largo" },
  { value: "2min", label: "2min", desc: "Detallado" },
] as const;

const PLATFORMS = [
  { value: "reels", label: "Reels", desc: "Instagram & Facebook Reels" },
  { value: "stories", label: "Stories", desc: "Stories 24h" },
  { value: "feed", label: "Feed Video", desc: "Vídeo en el feed" },
  { value: "youtube_shorts", label: "YouTube Shorts", desc: "Shorts de YouTube" },
] as const;

const SCRIPT_STYLES = [
  { value: "storytelling", label: "Storytelling", desc: "Historia de transformación", color: "border-purple-500/40 bg-purple-500/10" },
  { value: "direct", label: "Directo", desc: "Beneficios sin rodeos", color: "border-blue-500/40 bg-blue-500/10" },
  { value: "testimonial", label: "Testimonial", desc: "Voz de cliente real", color: "border-green-500/40 bg-green-500/10" },
  { value: "educational", label: "Educativo", desc: "Enseña antes de vender", color: "border-yellow-500/40 bg-yellow-500/10" },
  { value: "provocative", label: "Provocador", desc: "Rompe creencias", color: "border-red-500/40 bg-red-500/10" },
] as const;

const TONES = [
  { value: "urgency", label: "Urgencia", icon: "⚡" },
  { value: "curiosity", label: "Curiosidad", icon: "🔍" },
  { value: "authority", label: "Autoridad", icon: "🎯" },
  { value: "empathy", label: "Empatía", icon: "💙" },
  { value: "motivational", label: "Motivacional", icon: "🔥" },
] as const;

type Duration = typeof DURATIONS[number]["value"];
type Platform = typeof PLATFORMS[number]["value"];
type ScriptStyle = typeof SCRIPT_STYLES[number]["value"];
type Tone = typeof TONES[number]["value"];

interface ScriptItem {
  id: number;
  script: string;
  style: string;
  tone: string;
}

export default function GenerateScript() {
  const [, setLocation] = useLocation();
  const [duration, setDuration] = useState<Duration>("30s");
  const [platform, setPlatform] = useState<Platform>("reels");
  const [scriptStyle, setScriptStyle] = useState<ScriptStyle>("direct");
  const [tone, setTone] = useState<Tone>("motivational");
  const [objective, setObjective] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [generatedScripts, setGeneratedScripts] = useState<ScriptItem[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  const { data: brain } = trpc.brandBrain.getMine.useQuery();
  const { data: history, refetch } = trpc.generate.history.useQuery({ type: "script" });
  const generateMutation = trpc.generate.script.useMutation();

  const handleGenerate = async () => {
    if (!objective) { toast.error("Describe el objetivo del vídeo"); return; }
    try {
      const result = await generateMutation.mutateAsync({
        duration,
        platform,
        objective,
        scriptStyle,
        tone,
        additionalContext,
        quantity,
      });
      const scripts: ScriptItem[] = (result.scripts as ScriptItem[] | undefined) ?? [{ id: result.id, script: result.script, style: scriptStyle, tone }];
      setGeneratedScripts(scripts);
      setActiveTab(0);
      refetch();
      toast.success(`¡${scripts.length} guión${scripts.length > 1 ? "es" : ""} generado${scripts.length > 1 ? "s" : ""}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al generar";
      if (msg.includes("Brand Brain")) { setLocation("/onboarding"); }
      toast.error(msg);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Guión copiado al portapapeles");
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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Generador de Guiones
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Guiones listos para grabar con la voz de <strong>{brain.businessName}</strong>
          </p>
        </div>
        <Badge variant="outline" className="border-green-500/30 text-green-400">Brand Brain activo</Badge>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Config panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-xl p-5 space-y-5">
            {/* Duration */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block font-medium">Duración</Label>
              <div className="flex gap-1.5 flex-wrap">
                {DURATIONS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${duration === d.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                  >
                    <span className="block">{d.label}</span>
                    <span className="text-xs opacity-70">{d.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block font-medium">Plataforma</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {PLATFORMS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${platform === p.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                  >
                    <p className="font-medium text-xs">{p.label}</p>
                    <p className="text-xs opacity-70">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Script Style */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block font-medium">Estilo de guión</Label>
              <div className="space-y-1.5">
                {SCRIPT_STYLES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setScriptStyle(s.value)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all ${scriptStyle === s.value ? s.color : "border-border hover:border-primary/40"}`}
                  >
                    <div>
                      <p className={`text-sm font-medium ${scriptStyle === s.value ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                    {scriptStyle === s.value && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block font-medium">Tono emocional</Label>
              <div className="flex flex-wrap gap-1.5">
                {TONES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${tone === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                  >
                    <span>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Objective */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block font-medium">Objetivo del vídeo *</Label>
              <Textarea
                rows={3}
                placeholder="ej: Mostrar la transformación de un cliente, explicar mi metodología, lanzar una oferta de 297€..."
                value={objective}
                onChange={e => setObjective(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Additional context */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block font-medium">Contexto adicional</Label>
              <Textarea
                rows={2}
                placeholder="ej: Usar el caso de éxito de María, mencionar el precio, incluir oferta de tiempo limitado..."
                value={additionalContext}
                onChange={e => setAdditionalContext(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Quantity */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block font-medium">Variaciones a generar</Label>
              <div className="flex gap-2">
                {[1, 2, 3].map(q => (
                  <button
                    key={q}
                    onClick={() => setQuantity(q)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all ${quantity === q ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
              {quantity > 1 && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  ⚡ {quantity} guiones con enfoques diferentes en paralelo
                </p>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !objective}
              className="w-full gradient-brand text-white border-0"
            >
              {generateMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando{quantity > 1 ? ` ${quantity} guiones` : ""}...</>
                : <><Sparkles className="w-4 h-4 mr-2" /> Generar {quantity > 1 ? `${quantity} variaciones` : "guión"}</>
              }
            </Button>
          </div>
        </div>

        {/* Output panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Loading */}
          {generateMutation.isPending && (
            <div className="glass-card rounded-xl p-12 text-center flex items-center justify-center min-h-[400px]">
              <div>
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground text-sm font-medium">
                  Escribiendo {quantity > 1 ? `${quantity} guiones` : "tu guión"} con el Brand Brain de {brain.businessName}...
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Estilo: {SCRIPT_STYLES.find(s => s.value === scriptStyle)?.label} · Tono: {TONES.find(t => t.value === tone)?.label}
                </p>
              </div>
            </div>
          )}

          {/* Empty */}
          {!generateMutation.isPending && generatedScripts.length === 0 && (
            <div className="glass-card rounded-xl p-12 text-center flex items-center justify-center min-h-[400px]">
              <div>
                <FileText className="w-10 h-10 text-primary/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Configura los parámetros y genera tu guión de vídeo.</p>
                <p className="text-xs text-muted-foreground mt-1">Puedes generar hasta 3 variaciones a la vez.</p>
              </div>
            </div>
          )}

          {/* Results */}
          {!generateMutation.isPending && generatedScripts.length > 0 && (
            <div className="glass-card rounded-xl overflow-hidden">
              {/* Tab bar for multiple scripts */}
              {generatedScripts.length > 1 && (
                <div className="flex border-b border-border">
                  {generatedScripts.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveTab(i)}
                      className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${activeTab === i ? "border-b-2 border-primary text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Variación {i + 1}
                      <span className="ml-1.5 text-xs opacity-70 capitalize">
                        ({SCRIPT_STYLES.find(st => st.value === s.style)?.label ?? s.style})
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="border-primary/30 text-primary text-xs">{duration} · {platform}</Badge>
                    <Badge variant="outline" className="border-secondary/30 text-muted-foreground text-xs capitalize">
                      {SCRIPT_STYLES.find(s => s.value === generatedScripts[activeTab]?.style)?.label ?? scriptStyle}
                    </Badge>
                    <Badge variant="outline" className="border-secondary/30 text-muted-foreground text-xs">
                      {TONES.find(t => t.value === generatedScripts[activeTab]?.tone)?.icon} {TONES.find(t => t.value === generatedScripts[activeTab]?.tone)?.label ?? tone}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedScripts[activeTab]?.script ?? "")}
                    >
                      <Copy className="w-3 h-3 mr-1.5" /> Copiar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGenerate}
                      disabled={generateMutation.isPending}
                    >
                      <RefreshCw className="w-3 h-3 mr-1.5" /> Regenerar
                    </Button>
                  </div>
                </div>

                <div className="prose prose-sm prose-invert max-w-none border-t border-border/30 pt-4">
                  <Streamdown>{generatedScripts[activeTab]?.script ?? ""}</Streamdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {history && history.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full"
          >
            <h3 className="font-semibold text-sm">Guiones recientes ({history.length})</h3>
            {showHistory ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showHistory && (
            <div className="space-y-2 mt-4">
              {history.slice(0, 8).map(item => (
                <div key={item.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-border/30 hover:border-border/60 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground shrink-0">{item.adFormat}</Badge>
                      <p className="text-xs text-muted-foreground truncate">{item.objective?.slice(0, 50)}</p>
                    </div>
                    <p className="text-sm truncate text-foreground/80">{item.content?.slice(0, 80)}...</p>
                  </div>
                  <div className="flex items-center gap-3 ml-3 shrink-0">
                    <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString("es-ES")}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setGeneratedScripts([{ id: item.id, script: item.content ?? "", style: scriptStyle, tone }]);
                        setActiveTab(0);
                      }}
                    >
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(item.content ?? "")}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
