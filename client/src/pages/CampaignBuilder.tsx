import { useState, useRef } from "react";
import { useStepNavigation } from "@/hooks/useStepNavigation";
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
  Facebook, Instagram, ArrowRight, ArrowLeft, Send,
  Upload, ImageIcon, X, Eye, Users, MessageSquare,
  Video, ShoppingBag, Store, Target, TrendingUp, MousePointer
} from "lucide-react";

// ─── Meta Objectives (exact match to Meta Ads Manager) ────────────────────────
const OBJECTIVES = [
  {
    group: "Reconocimiento",
    items: [
      { value: "awareness", label: "Reconocimiento de marca", desc: "Muestra tu marca a personas con más probabilidad de recordarla", icon: Eye, needsUrl: false },
      { value: "reach", label: "Alcance", desc: "Llega al máximo número de personas de tu audiencia", icon: Users, needsUrl: false },
    ]
  },
  {
    group: "Consideración",
    items: [
      { value: "traffic", label: "Tráfico", desc: "Dirige personas a tu sitio web, app o evento de Facebook", icon: MousePointer, needsUrl: true },
      { value: "engagement", label: "Interacción", desc: "Consigue más reacciones, comentarios, compartidos o mensajes", icon: MessageSquare, needsUrl: false },
      { value: "followers", label: "Nuevos seguidores", desc: "Aumenta los seguidores de tu página o perfil de Instagram", icon: Users, needsUrl: false },
      { value: "video_views", label: "Reproducciones de vídeo", desc: "Muestra tus vídeos a personas con más probabilidad de verlos", icon: Video, needsUrl: false },
      { value: "leads", label: "Generación de clientes potenciales", desc: "Recopila información de contacto de personas interesadas", icon: Target, needsUrl: false },
      { value: "messages", label: "Mensajes", desc: "Consigue que las personas te envíen mensajes en WhatsApp, Messenger o Instagram", icon: MessageSquare, needsUrl: false },
    ]
  },
  {
    group: "Conversión",
    items: [
      { value: "conversions", label: "Conversiones", desc: "Genera acciones valiosas en tu sitio web o app", icon: TrendingUp, needsUrl: true },
      { value: "catalog_sales", label: "Ventas del catálogo", desc: "Muestra productos de tu catálogo a personas interesadas", icon: ShoppingBag, needsUrl: true },
      { value: "store_visits", label: "Visitas al negocio", desc: "Lleva a personas a tus tiendas físicas", icon: Store, needsUrl: false },
    ]
  },
];

type ObjectiveValue = "awareness" | "reach" | "traffic" | "engagement" | "followers" | "video_views" | "leads" | "messages" | "conversions" | "catalog_sales" | "store_visits";
type ObjectiveItem = { value: ObjectiveValue; label: string; desc: string; icon: React.ElementType; needsUrl: boolean };
// Flat list for easy lookup
const ALL_OBJECTIVES: ObjectiveItem[] = OBJECTIVES.flatMap(g => g.items as ObjectiveItem[]);

// ─── Meta Placements (exact match to Meta Ads Manager) ────────────────────────
const PLACEMENT_GROUPS = [
  {
    platform: "Facebook",
    icon: Facebook,
    color: "text-blue-400",
    placements: [
      { value: "fb_feed", label: "Feed de Facebook", desc: "Noticias de escritorio y móvil" },
      { value: "fb_right_column", label: "Columna derecha", desc: "Solo escritorio" },
      { value: "fb_instant_articles", label: "Instant Articles", desc: "Artículos instantáneos" },
      { value: "fb_marketplace", label: "Marketplace", desc: "Marketplace de Facebook" },
      { value: "fb_video_feeds", label: "Vídeos en el feed", desc: "Feed de vídeos de Facebook" },
      { value: "fb_stories", label: "Stories de Facebook", desc: "Stories en móvil" },
      { value: "fb_reels", label: "Reels de Facebook", desc: "Reels en Facebook" },
      { value: "fb_search", label: "Resultados de búsqueda", desc: "Búsqueda en Facebook" },
    ]
  },
  {
    platform: "Instagram",
    icon: Instagram,
    color: "text-pink-400",
    placements: [
      { value: "ig_feed", label: "Feed de Instagram", desc: "Feed principal de Instagram" },
      { value: "ig_stories", label: "Stories de Instagram", desc: "Stories de 24h" },
      { value: "ig_reels", label: "Reels de Instagram", desc: "Reels de Instagram" },
      { value: "ig_explore", label: "Explorar de Instagram", desc: "Página de explorar" },
      { value: "ig_explore_home", label: "Inicio de Explorar", desc: "Cuadrícula de explorar" },
      { value: "ig_profile_feed", label: "Feed del perfil", desc: "Perfil de Instagram" },
      { value: "ig_search", label: "Búsqueda de Instagram", desc: "Resultados de búsqueda" },
    ]
  },
  {
    platform: "Audience Network",
    icon: Target,
    color: "text-green-400",
    placements: [
      { value: "an_native", label: "Nativo", desc: "Anuncios nativos en apps" },
      { value: "an_banner", label: "Banner", desc: "Banners en apps" },
      { value: "an_interstitial", label: "Intersticial", desc: "Pantalla completa en apps" },
      { value: "an_rewarded_video", label: "Vídeo con recompensa", desc: "Vídeos con recompensa" },
    ]
  },
  {
    platform: "Messenger",
    icon: MessageSquare,
    color: "text-purple-400",
    placements: [
      { value: "ms_inbox", label: "Bandeja de entrada", desc: "Messenger inbox" },
      { value: "ms_stories", label: "Stories de Messenger", desc: "Stories en Messenger" },
      { value: "ms_sponsored", label: "Mensajes patrocinados", desc: "Mensajes directos patrocinados" },
    ]
  },
] as const;

const CTA_OPTIONS_BY_OBJECTIVE: Record<string, string[]> = {
  awareness: ["Más información", "Ver más"],
  reach: ["Más información", "Ver más"],
  traffic: ["Más información", "Visitar sitio web", "Ver más", "Comprar ahora", "Registrarse"],
  engagement: ["Me gusta la página", "Comentar", "Compartir", "Más información"],
  followers: ["Seguir", "Más información"],
  video_views: ["Ver más", "Más información"],
  leads: ["Registrarse", "Obtener oferta", "Más información", "Suscribirse", "Descargar"],
  messages: ["Enviar mensaje", "Más información"],
  conversions: ["Comprar ahora", "Registrarse", "Obtener oferta", "Descargar", "Más información"],
  catalog_sales: ["Comprar ahora", "Ver más", "Obtener oferta"],
  store_visits: ["Cómo llegar", "Llamar ahora", "Más información"],
};

const DEFAULT_PLACEMENTS = ["fb_feed", "ig_feed", "ig_stories", "ig_reels"];

// ObjectiveValue defined above

export default function CampaignBuilder() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [savedCampaignId, setSavedCampaignId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    objective: "" as ObjectiveValue | "",
    dailyBudget: "",
    startDate: "",
    endDate: "",
    primaryText: "",
    headline: "",
    description: "",
    cta: "Más información",
    destinationUrl: "",
    placements: DEFAULT_PLACEMENTS as string[],
    externalImageUrl: "",
    selectedLibraryImageId: null as number | null,
    selectedLibraryImageUrl: "",
  });

  const { data: brain } = trpc.brandBrain.getMine.useQuery();
  const { data: generatedCopies } = trpc.generate.history.useQuery({ type: "copy" });
  const { data: generatedImages } = trpc.generate.history.useQuery({ type: "image" });
  const createMutation = trpc.campaigns.save.useMutation();
  const publishMutation = trpc.meta.publishCampaign.useMutation();

  // Intercept browser back button to go to previous step instead of leaving
  useStepNavigation(step, setStep, { minStep: 1, onExit: () => setLocation("/campaigns") });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const togglePlacement = (p: string) => {
    setForm(prev => ({
      ...prev,
      placements: prev.placements.includes(p)
        ? prev.placements.filter(x => x !== p)
        : [...prev.placements, p],
    }));
  };

  const toggleAllPlatform = (platformPlacements: readonly { value: string }[]) => {
    const values = platformPlacements.map(p => p.value);
    const allSelected = values.every(v => form.placements.includes(v));
    setForm(prev => ({
      ...prev,
      placements: allSelected
        ? prev.placements.filter(p => !values.includes(p))
        : Array.from(new Set([...prev.placements, ...values])),
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

    const selectedObjective = ALL_OBJECTIVES.find(o => o.value === form.objective) as typeof ALL_OBJECTIVES[number] | undefined;
  const needsUrl = selectedObjective?.needsUrl ?? false;
  const ctaOptions = form.objective ? (CTA_OPTIONS_BY_OBJECTIVE[form.objective] ?? ["Más información"]) : ["Más información"];

  const handleSave = async () => {
    if (!form.name || !form.objective || !form.dailyBudget) {
      toast.error("Completa nombre, objetivo y presupuesto");
      return null;
    }
    try {
      const campaign = await createMutation.mutateAsync({
        id: savedCampaignId ?? undefined,
        brandBrainId: brain!.id,
        name: form.name,
        objective: form.objective as ObjectiveValue,
        dailyBudget: form.dailyBudget ? String(parseFloat(form.dailyBudget)) : undefined,
        primaryText: form.primaryText,
        headline: form.headline,
        description: form.description,
        callToAction: form.cta,
        destinationUrl: form.destinationUrl,
        adImageId: form.selectedLibraryImageId ?? undefined,
      });
      setSavedCampaignId(campaign.id);
      return campaign;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
      return null;
    }
  };

  const goToStep = async (targetStep: number) => {
    if (targetStep > step && step === 1) {
      if (!form.name || !form.objective || !form.dailyBudget) {
        toast.error("Completa nombre, objetivo y presupuesto para continuar");
        return;
      }
    }
    if (targetStep === 3 && step < 3) {
      const campaign = await handleSave();
      if (!campaign) return;
      toast.success("Campaña guardada");
    }
    setStep(targetStep);
  };

  const handlePublish = async () => {
    const campaign = savedCampaignId ? { id: savedCampaignId } : await handleSave();
    if (!campaign) return;
    try {
      await publishMutation.mutateAsync({ campaignId: campaign.id });
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

  const activeImageUrl = form.selectedLibraryImageUrl || form.externalImageUrl;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" /> Constructor de Campaña
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Crea y publica tu anuncio en Meta Ads en minutos.</p>
        </div>
      </div>

      {/* Steps indicator — all clickable */}
      <div className="flex items-center gap-2">
        {[
          { id: 1, label: "Configuración" },
          { id: 2, label: "Creativos" },
          { id: 3, label: "Publicar" },
        ].map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              onClick={() => goToStep(s.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer hover:opacity-80 ${step === s.id ? "bg-primary text-primary-foreground" : step > s.id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}
            >
              {step > s.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 flex items-center justify-center text-xs">{s.id}</span>}
              {s.label}
            </button>
            {i < 2 && <div className={`h-px w-8 ${step > s.id ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      {/* ─── Step 1: Configuración ─────────────────────────────────────────── */}
      {step === 1 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Campaign data */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h3 className="font-semibold">Datos de la campaña</h3>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Nombre de la campaña *</Label>
              <Input placeholder="ej: Captación enero 2025" value={form.name} onChange={e => update("name", e.target.value)} />
            </div>

            {/* Objective selector grouped like Meta */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Objetivo de la campaña *</Label>
              <div className="space-y-3">
                {OBJECTIVES.map(group => (
                  <div key={group.group}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{group.group}</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {(group.items as readonly { value: ObjectiveValue; label: string; desc: string; icon: React.ElementType; needsUrl: boolean }[]).map(o => (
                        <button
                          key={o.value}
                          onClick={() => {
                            update("objective", o.value);
                            const ctaList = CTA_OPTIONS_BY_OBJECTIVE[o.value] ?? ["Más información"];
                            update("cta", ctaList[0]);
                          }}
                          className={`flex items-start gap-3 text-left p-3 rounded-lg border transition-all ${form.objective === o.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                        >
                          <o.icon className={`w-4 h-4 mt-0.5 shrink-0 ${form.objective === o.value ? "text-primary" : "text-muted-foreground"}`} />
                          <div>
                            <p className={`text-sm font-medium ${form.objective === o.value ? "text-primary" : ""}`}>{o.label}</p>
                            <p className="text-xs text-muted-foreground">{o.desc}</p>
                          </div>
                          {form.objective === o.value && <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0 mt-0.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Presupuesto diario (€) *</Label>
                <Input type="number" placeholder="ej: 10" value={form.dailyBudget} onChange={e => update("dailyBudget", e.target.value)} />
              </div>
              {/* URL only shown for objectives that need it */}
              {needsUrl && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">URL de destino *</Label>
                  <Input placeholder="https://..." value={form.destinationUrl} onChange={e => update("destinationUrl", e.target.value)} />
                </div>
              )}
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

          {/* Right: Placements */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Ubicaciones</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setForm(prev => ({ ...prev, placements: PLACEMENT_GROUPS.flatMap(g => g.placements.map(p => p.value)) }))}
                  className="text-xs text-primary hover:underline"
                >
                  Todas
                </button>
                <span className="text-xs text-muted-foreground">·</span>
                <button
                  onClick={() => setForm(prev => ({ ...prev, placements: [] }))}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Ninguna
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {PLACEMENT_GROUPS.map(group => {
                const groupValues = group.placements.map(p => p.value);
                const allSelected = groupValues.every(v => form.placements.includes(v));
                const someSelected = groupValues.some(v => form.placements.includes(v));
                return (
                  <div key={group.platform}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <group.icon className={`w-4 h-4 ${group.color}`} />
                        <p className="text-sm font-semibold">{group.platform}</p>
                        {someSelected && (
                          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                            {groupValues.filter(v => form.placements.includes(v)).length}/{groupValues.length}
                          </Badge>
                        )}
                      </div>
                      <button
                        onClick={() => toggleAllPlatform(group.placements)}
                        className={`text-xs transition-colors ${allSelected ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                      >
                        {allSelected ? "Quitar todas" : "Seleccionar todas"}
                      </button>
                    </div>
                    <div className="space-y-1">
                      {group.placements.map(p => (
                        <button
                          key={p.value}
                          onClick={() => togglePlacement(p.value)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${form.placements.includes(p.value) ? "border-primary/40 bg-primary/5" : "border-border/40 hover:border-border"}`}
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${form.placements.includes(p.value) ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                            {form.placements.includes(p.value) && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-medium">{p.label}</p>
                            <p className="text-xs text-muted-foreground">{p.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {form.placements.length > 0 && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-primary">{form.placements.length} ubicaciones</strong> seleccionadas. Meta optimizará automáticamente dónde mostrar tu anuncio para mejores resultados.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Step 2: Creativos ─────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-4">
            {/* Copy text */}
            <div className="glass-card rounded-xl p-5 space-y-4">
              <h3 className="font-semibold">Texto del anuncio</h3>

              {generatedCopies && generatedCopies.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Cargar desde biblioteca de copies</Label>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {generatedCopies.slice(0, 5).map(c => (
                      <button
                        key={c.id}
                        onClick={() => loadCopy(c.content)}
                        className="w-full text-left px-3 py-2 rounded-lg border border-border hover:border-primary/40 text-xs transition-all"
                      >
                        <span className="text-muted-foreground">{c.objective} · </span>
                        {c.content ? (() => { try { return JSON.parse(c.content)?.copies?.[0]?.primaryText?.slice(0, 50) + "..."; } catch { return c.content.slice(0, 50); } })() : "-"}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">CTA</Label>
                  <select
                    value={form.cta}
                    onChange={e => update("cta", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    {ctaOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {!needsUrl && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">URL de destino (opcional)</Label>
                    <Input placeholder="https://..." value={form.destinationUrl} onChange={e => update("destinationUrl", e.target.value)} />
                  </div>
                )}
              </div>
            </div>

            {/* Creative selector */}
            <div className="glass-card rounded-xl p-5 space-y-4">
              <h3 className="font-semibold">Creativo visual</h3>

              {/* Library images */}
              {generatedImages && generatedImages.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Desde tu biblioteca generada</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {generatedImages.slice(0, 10).map(img => img.imageUrl && (
                      <button
                        key={img.id}
                        onClick={() => setForm(prev => ({
                          ...prev,
                          selectedLibraryImageId: img.id,
                          selectedLibraryImageUrl: img.imageUrl!,
                          externalImageUrl: "",
                        }))}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${form.selectedLibraryImageId === img.id ? "border-primary" : "border-transparent hover:border-primary/40"}`}
                      >
                        <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                        {form.selectedLibraryImageId === img.id && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* External URL */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">O pega una URL de imagen externa</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={form.externalImageUrl}
                    onChange={e => {
                      update("externalImageUrl", e.target.value);
                      setForm(prev => ({ ...prev, selectedLibraryImageId: null, selectedLibraryImageUrl: "" }));
                    }}
                    className="text-sm"
                  />
                  {form.externalImageUrl && (
                    <Button size="sm" variant="outline" onClick={() => update("externalImageUrl", "")}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Upload from device */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">O sube desde tu dispositivo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setForm(prev => ({ ...prev, externalImageUrl: url, selectedLibraryImageId: null, selectedLibraryImageUrl: "" }));
                      toast.success(`Archivo "${file.name}" cargado`);
                    }
                  }}
                />
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" /> Subir imagen o vídeo
                </Button>
                <p className="text-xs text-muted-foreground mt-1">Formatos: JPG, PNG, MP4, MOV · Máx 30MB</p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-xl p-4 sticky top-4">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Vista previa del anuncio</p>
              <div className="bg-white rounded-xl overflow-hidden shadow-lg">
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
                <div className="bg-gray-50 h-36 flex items-center justify-center border-y border-gray-100 overflow-hidden">
                  {activeImageUrl ? (
                    <img src={activeImageUrl} alt="Creativo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                      <p className="text-xs text-gray-300">Selecciona un creativo</p>
                    </div>
                  )}
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

              {/* Instagram preview */}
              <p className="text-xs text-muted-foreground mt-4 mb-2 font-medium">Vista previa Instagram</p>
              <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                <div className="p-2.5 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{brain.businessName?.charAt(0) ?? "M"}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 flex-1">{brain.businessName?.toLowerCase().replace(/\s/g, "_")}</p>
                  <Instagram className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="bg-gray-100 h-40 flex items-center justify-center overflow-hidden">
                  {activeImageUrl ? (
                    <img src={activeImageUrl} alt="Creativo" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-[10px] text-gray-900 line-clamp-2">
                    <strong>{brain.businessName?.toLowerCase().replace(/\s/g, "_")}</strong>{" "}
                    {form.primaryText || <span className="text-gray-300">Tu texto...</span>}
                  </p>
                  <p className="text-[10px] text-blue-500 mt-0.5">{form.cta} →</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Step 3: Publicar ─────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="max-w-2xl mx-auto">
          <div className="glass-card rounded-xl p-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto glow-primary mb-4">
                <Send className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-display font-bold mb-2">Revisa y publica</h2>
              <p className="text-muted-foreground text-sm">Revisa todos los detalles antes de publicar en Meta Ads.</p>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl bg-secondary/50 space-y-3">
              <h3 className="text-sm font-semibold">Resumen de la campaña</h3>
              {[
                { label: "Nombre", value: form.name },
                { label: "Objetivo", value: (selectedObjective as { label?: string } | undefined)?.label ?? form.objective },
                { label: "Presupuesto diario", value: `${form.dailyBudget}€/día` },
                { label: "Ubicaciones", value: `${form.placements.length} ubicaciones seleccionadas` },
                { label: "Titular", value: form.headline || "—" },
                { label: "CTA", value: form.cta },
                ...(form.destinationUrl ? [{ label: "URL destino", value: form.destinationUrl }] : []),
                { label: "Creativo", value: activeImageUrl ? "Imagen seleccionada ✓" : "Sin creativo (se publicará sin imagen)" },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-right max-w-[60%] truncate">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Placement summary */}
            <div className="p-4 rounded-xl bg-secondary/30 space-y-2">
              <h3 className="text-sm font-semibold mb-2">Ubicaciones activas</h3>
              <div className="flex flex-wrap gap-1.5">
                {form.placements.map(p => {
                  const allPlacements = PLACEMENT_GROUPS.flatMap(g => [...g.placements] as { value: string; label: string; desc: string }[]);
                  const placement = allPlacements.find(pl => pl.value === p);
                  return placement ? (
                    <Badge key={p} variant="outline" className="text-xs border-primary/30 text-primary">
                      {placement.label}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Editar creativos
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  const campaign = await handleSave();
                  if (campaign) { toast.success("Guardado como borrador"); setLocation("/campaigns"); }
                }}
                disabled={createMutation.isPending}
              >
                Guardar borrador
              </Button>
              <Button
                className="flex-1 gradient-brand text-white border-0"
                onClick={handlePublish}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publicando...</>
                  : <><Sparkles className="w-4 h-4 mr-2" /> Publicar en Meta</>
                }
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => step > 1 ? setStep(s => s - 1) : setLocation("/campaigns")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> {step === 1 ? "Cancelar" : "Anterior"}
        </Button>
        {step < 3 && (
          <Button
            onClick={() => goToStep(step + 1)}
            disabled={step === 1 && (!form.name || !form.objective || !form.dailyBudget)}
            className="gradient-brand text-white border-0"
          >
            {step === 2 ? "Revisar y publicar" : "Siguiente"} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
