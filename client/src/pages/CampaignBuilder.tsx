import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Megaphone, Sparkles, Loader2, AlertCircle, CheckCircle2,
  Facebook, Instagram, ArrowRight, ArrowLeft, Send
} from "lucide-react";

const OBJECTIVES = [
  { value: "awareness", label: "Reconocimiento", desc: "Llega a más personas" },
  { value: "traffic", label: "Tráfico", desc: "Lleva visitas a tu web" },
  { value: "leads", label: "Leads", desc: "Capta contactos interesados" },
  { value: "conversions", label: "Conversiones", desc: "Genera ventas directas" },
] as const;

const PLACEMENTS = [
  { value: "feed", label: "Feed Facebook" },
  { value: "instagram_feed", label: "Feed Instagram" },
  { value: "stories", label: "Stories" },
  { value: "reels", label: "Reels" },
] as const;

type Objective = typeof OBJECTIVES[number]["value"];

export default function CampaignBuilder() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: "",
    objective: "" as Objective | "",
    dailyBudget: "",
    startDate: "",
    endDate: "",
    primaryText: "",
    headline: "",
    description: "",
    cta: "Más información",
    destinationUrl: "",
    placements: ["feed", "instagram_feed"] as string[],
  });

  const { data: brain } = trpc.brandBrain.getMine.useQuery();
  const { data: generatedCopies } = trpc.generate.history.useQuery({ type: "copy" });
  const createMutation = trpc.campaigns.save.useMutation();
  const publishMutation = trpc.meta.publishCampaign.useMutation();

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const togglePlacement = (p: string) => {
    setForm(prev => ({
      ...prev,
      placements: prev.placements.includes(p)
        ? prev.placements.filter(x => x !== p)
        : [...prev.placements, p],
    }));
  };

  const loadCopy = (copyJson: string | null | undefined) => {
    if (!copyJson) return;
    try {
      const parsed = JSON.parse(copyJson);
      const first = parsed?.copies?.[0];
      if (first) {
        setForm(prev => ({
          ...prev,
          primaryText: first.primaryText ?? "",
          headline: first.headline ?? "",
          description: first.description ?? "",
          cta: first.cta ?? "Más información",
        }));
        toast.success("Copy cargado");
      }
    } catch { /* ignore */ }
  };

  const handleCreate = async () => {
    if (!form.name || !form.objective || !form.dailyBudget) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    try {
      const brain2 = brain!;
      const campaign = await createMutation.mutateAsync({
        brandBrainId: brain2.id,
        name: form.name,
        objective: form.objective as Objective,
        dailyBudget: form.dailyBudget ? String(parseFloat(form.dailyBudget)) : undefined,
        primaryText: form.primaryText,
        headline: form.headline,
        description: form.description,
        callToAction: form.cta,
        destinationUrl: form.destinationUrl,
      });
      toast.success("Campaña guardada como borrador");
      setStep(3);
      return campaign;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    }
  };

  const handlePublish = async () => {
    const campaign = await handleCreate();
    if (!campaign) return;
    try {
      await publishMutation.mutateAsync({ campaignId: campaign!.id });
      toast.success("¡Campaña enviada a Meta Ads!");
      setLocation("/campaigns");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al publicar";
      if (msg.includes("Meta")) {
        toast.error("Conecta tu cuenta de Meta Ads primero");
        setLocation("/meta-connect");
      } else {
        toast.error(msg);
      }
    }
  };

  if (!brain?.isComplete) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="glass-card rounded-2xl p-10 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold mb-3">Brand Brain requerido</h2>
          <p className="text-muted-foreground mb-6">Configura tu Brand Brain antes de crear campañas.</p>
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
            <Megaphone className="w-6 h-6 text-primary" /> Constructor de Campaña
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Crea y publica tu anuncio en Meta Ads en minutos.</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {[
          { id: 1, label: "Configuración" },
          { id: 2, label: "Creativos" },
          { id: 3, label: "Publicar" },
        ].map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${step === s.id ? "bg-primary text-primary-foreground" : step > s.id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
              {step > s.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 flex items-center justify-center text-xs">{s.id}</span>}
              {s.label}
            </div>
            {i < 2 && <div className={`h-px w-8 ${step > s.id ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Configuración */}
      {step === 1 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="font-semibold">Datos de la campaña</h3>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Nombre de la campaña *</Label>
              <Input placeholder="ej: Captación enero 2025" value={form.name} onChange={e => update("name", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Objetivo *</Label>
              <div className="grid grid-cols-2 gap-2">
                {OBJECTIVES.map(o => (
                  <button key={o.value} onClick={() => update("objective", o.value)}
                    className={`text-left p-3 rounded-lg border transition-all ${form.objective === o.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                    <p className={`text-sm font-medium ${form.objective === o.value ? "text-primary" : ""}`}>{o.label}</p>
                    <p className="text-xs text-muted-foreground">{o.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Presupuesto diario (€) *</Label>
                <Input type="number" placeholder="ej: 10" value={form.dailyBudget} onChange={e => update("dailyBudget", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">URL de destino</Label>
                <Input placeholder="https://..." value={form.destinationUrl} onChange={e => update("destinationUrl", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Fecha inicio</Label>
                <Input type="date" value={form.startDate} onChange={e => update("startDate", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Fecha fin</Label>
                <Input type="date" value={form.endDate} onChange={e => update("endDate", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="font-semibold">Ubicaciones</h3>
            <div className="space-y-2">
              {PLACEMENTS.map(p => (
                <button key={p.value} onClick={() => togglePlacement(p.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${form.placements.includes(p.value) ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${form.placements.includes(p.value) ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                    {form.placements.includes(p.value) && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex items-center gap-2">
                    {p.value.includes("instagram") ? <Instagram className="w-4 h-4 text-pink-400" /> : <Facebook className="w-4 h-4 text-blue-400" />}
                    <span className="text-sm">{p.label}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground">
                <strong className="text-primary">Tip:</strong> Seleccionar múltiples ubicaciones permite a Meta optimizar automáticamente dónde mostrar tu anuncio para mejores resultados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Creativos */}
      {step === 2 && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 glass-card rounded-xl p-5 space-y-4">
            <h3 className="font-semibold">Texto del anuncio</h3>
            {generatedCopies && generatedCopies.length > 0 && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Cargar desde historial de copies</Label>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {generatedCopies.slice(0, 5).map(c => (
                    <button key={c.id} onClick={() => loadCopy(c.content)}
                      className="w-full text-left px-3 py-2 rounded-lg border border-border hover:border-primary/40 text-xs transition-all">
                      <span className="text-muted-foreground">{c.objective} · </span>
                      {c.content ? JSON.parse(c.content)?.copies?.[0]?.primaryText?.slice(0, 50) + "..." : "-"}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Texto principal</Label>
              <Textarea rows={4} placeholder="El texto principal que verán en el anuncio..." value={form.primaryText} onChange={e => update("primaryText", e.target.value)} className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Titular</Label>
                <Input placeholder="Titular del anuncio" value={form.headline} onChange={e => update("headline", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Descripción</Label>
                <Input placeholder="Descripción breve" value={form.description} onChange={e => update("description", e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">CTA (llamada a la acción)</Label>
              <select value={form.cta} onChange={e => update("cta", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                {["Más información", "Registrarse", "Comprar ahora", "Contactar", "Descargar", "Ver más"].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Vista previa del anuncio</p>
              <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                {/* Facebook-style ad preview */}
                <div className="p-3 flex items-center gap-2 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{brain.businessName?.charAt(0) ?? "M"}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{brain.businessName}</p>
                    <p className="text-[10px] text-gray-400">Publicidad · <Facebook className="w-2.5 h-2.5 inline" /></p>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                    {form.primaryText || <span className="text-gray-300">Tu texto principal aparecerá aquí...</span>}
                  </p>
                </div>
                <div className="bg-gray-50 h-28 flex items-center justify-center border-y border-gray-100">
                  <p className="text-xs text-gray-300">Imagen del anuncio</p>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-900 truncate max-w-[140px]">
                      {form.headline || <span className="text-gray-300">Titular</span>}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate max-w-[140px]">
                      {form.description || "Descripción del anuncio"}
                    </p>
                  </div>
                  <div className="bg-gray-200 text-gray-700 text-[10px] font-semibold px-2 py-1 rounded shrink-0">
                    {form.cta}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Publicar */}
      {step === 3 && (
        <div className="max-w-lg mx-auto">
          <div className="glass-card rounded-xl p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto glow-primary">
              <Send className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold mb-2">Listo para publicar</h2>
              <p className="text-muted-foreground text-sm">Tu campaña <strong>{form.name}</strong> está configurada y lista para enviarse a Meta Ads.</p>
            </div>
            <div className="p-4 rounded-xl bg-secondary/50 text-left space-y-2">
              {[
                { label: "Objetivo", value: OBJECTIVES.find(o => o.value === form.objective)?.label },
                { label: "Presupuesto diario", value: `${form.dailyBudget}€/día` },
                { label: "Ubicaciones", value: `${form.placements.length} seleccionadas` },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => {
              createMutation.mutateAsync({
                brandBrainId: brain!.id,
                name: form.name,
                objective: form.objective as Objective,
                dailyBudget: form.dailyBudget ? String(parseFloat(form.dailyBudget)) : undefined,
                primaryText: form.primaryText,
                headline: form.headline,
                description: form.description,
                callToAction: form.cta,
                destinationUrl: form.destinationUrl,
              }).then(() => { toast.success("Guardado como borrador"); setLocation("/campaigns"); });
              }}>
                Guardar borrador
              </Button>
              <Button className="flex-1 gradient-brand text-white border-0" onClick={handlePublish} disabled={publishMutation.isPending}>
                {publishMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publicando...</> : <><Sparkles className="w-4 h-4 mr-2" /> Publicar en Meta</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step < 3 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => step > 1 ? setStep(s => s - 1) : setLocation("/campaigns")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> {step === 1 ? "Cancelar" : "Anterior"}
          </Button>
          <Button onClick={() => step === 2 ? handleCreate().then(() => {}) : setStep(s => s + 1)}
            disabled={step === 1 && (!form.name || !form.objective || !form.dailyBudget)}
            className="gradient-brand text-white border-0">
            {step === 2 ? "Guardar y continuar" : "Siguiente"} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
