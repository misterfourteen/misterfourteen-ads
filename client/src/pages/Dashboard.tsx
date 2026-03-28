import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import OnboardingGuide from "@/components/OnboardingGuide";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Brain, Megaphone, Sparkles, FileText, ImageIcon, TrendingUp,
  PlusCircle, ArrowRight, Eye, MousePointer, DollarSign, Target,
  CheckCircle2, AlertCircle, Loader2, Settings, GripVertical,
  BarChart2, Users, Percent, Clock, RefreshCw, ChevronRight,
  Activity, Zap, X, Check
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, LineChart, Line
} from "recharts";

const MOCK_CHART_DATA = [
  { day: "Lun", impressions: 1200, clicks: 45, spend: 8.5, conversions: 3, ctr: 3.75, cpc: 0.19 },
  { day: "Mar", impressions: 1800, clicks: 72, spend: 12.3, conversions: 5, ctr: 4.0, cpc: 0.17 },
  { day: "Mié", impressions: 1400, clicks: 58, spend: 9.8, conversions: 4, ctr: 4.14, cpc: 0.17 },
  { day: "Jue", impressions: 2200, clicks: 95, spend: 15.2, conversions: 7, ctr: 4.32, cpc: 0.16 },
  { day: "Vie", impressions: 2800, clicks: 120, spend: 18.9, conversions: 9, ctr: 4.29, cpc: 0.16 },
  { day: "Sáb", impressions: 3200, clicks: 145, spend: 22.1, conversions: 11, ctr: 4.53, cpc: 0.15 },
  { day: "Dom", impressions: 2600, clicks: 108, spend: 17.4, conversions: 8, ctr: 4.15, cpc: 0.16 },
];

// All available metrics
const ALL_METRICS = [
  { key: "impressions", label: "Impresiones", icon: Eye, color: "text-blue-400", bg: "bg-blue-400/10", format: (v: number) => v.toLocaleString("es-ES"), desc: "Veces que se mostró el anuncio" },
  { key: "clicks", label: "Clics", icon: MousePointer, color: "text-green-400", bg: "bg-green-400/10", format: (v: number) => v.toLocaleString("es-ES"), desc: "Clics en el anuncio" },
  { key: "spend", label: "Gasto", icon: DollarSign, color: "text-yellow-400", bg: "bg-yellow-400/10", format: (v: number) => `${v.toFixed(2)}€`, desc: "Presupuesto gastado" },
  { key: "conversions", label: "Conversiones", icon: Target, color: "text-purple-400", bg: "bg-purple-400/10", format: (v: number) => v.toLocaleString("es-ES"), desc: "Acciones completadas" },
  { key: "ctr", label: "CTR", icon: Percent, color: "text-orange-400", bg: "bg-orange-400/10", format: (v: number) => `${v.toFixed(2)}%`, desc: "Tasa de clics" },
  { key: "cpc", label: "CPC", icon: BarChart2, color: "text-pink-400", bg: "bg-pink-400/10", format: (v: number) => `${v.toFixed(2)}€`, desc: "Coste por clic" },
  { key: "reach", label: "Alcance", icon: Users, color: "text-cyan-400", bg: "bg-cyan-400/10", format: (v: number) => v.toLocaleString("es-ES"), desc: "Personas únicas alcanzadas" },
  { key: "frequency", label: "Frecuencia", icon: RefreshCw, color: "text-indigo-400", bg: "bg-indigo-400/10", format: (v: number) => v.toFixed(2), desc: "Veces que vio el anuncio cada persona" },
] as const;

type MetricKey = typeof ALL_METRICS[number]["key"];

const DEFAULT_VISIBLE_METRICS: MetricKey[] = ["impressions", "clicks", "spend", "conversions"];

const QUICK_ACTIONS = [
  { icon: Sparkles, label: "Generar copy", desc: "Texto para anuncio", path: "/generate/copy", color: "text-primary" },
  { icon: FileText, label: "Crear guión", desc: "Para vídeo o reel", path: "/generate/script", color: "text-blue-400" },
  { icon: ImageIcon, label: "Generar imagen", desc: "Creativo visual", path: "/generate/image", color: "text-green-400" },
  { icon: Megaphone, label: "Nueva campaña", desc: "Publicar en Meta", path: "/campaigns/new", color: "text-yellow-400" },
  { icon: Brain, label: "Brand Brain", desc: "Identidad de marca", path: "/onboarding", color: "text-purple-400" },
  { icon: TrendingUp, label: "Campañas", desc: "Ver todas", path: "/campaigns", color: "text-orange-400" },
];

const CHART_METRICS = [
  { key: "impressions", label: "Impresiones", color: "#E84B2A" },
  { key: "clicks", label: "Clics", color: "#FF6B35" },
  { key: "spend", label: "Gasto (€)", color: "#FFD700" },
  { key: "conversions", label: "Conversiones", color: "#9B59B6" },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: brain, isLoading: brainLoading } = trpc.brandBrain.getMine.useQuery();
  const { data: campaigns, isLoading: campaignsLoading } = trpc.campaigns.list.useQuery();
  const { data: copies } = trpc.generate.history.useQuery({ type: "copy" });
  const { data: scripts } = trpc.generate.history.useQuery({ type: "script" });
  const { data: images } = trpc.generate.history.useQuery({ type: "image" });

  // Customization state
  const [visibleMetrics, setVisibleMetrics] = useState<MetricKey[]>(DEFAULT_VISIBLE_METRICS);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [chartMetric, setChartMetric] = useState<string>("impressions");
  const [chartType, setChartType] = useState<"area" | "bar" | "line">("area");

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem("dashboard_metrics");
    if (saved) {
      try { setVisibleMetrics(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const saveMetrics = (metrics: MetricKey[]) => {
    setVisibleMetrics(metrics);
    localStorage.setItem("dashboard_metrics", JSON.stringify(metrics));
  };

  const toggleMetric = (key: MetricKey) => {
    const next = visibleMetrics.includes(key)
      ? visibleMetrics.filter(m => m !== key)
      : [...visibleMetrics, key];
    if (next.length === 0) return; // at least 1
    saveMetrics(next);
  };

  const activeCampaigns = campaigns?.filter(c => c.status === "active") ?? [];
  const totalSpend = campaigns?.reduce((acc, c) => acc + parseFloat(String(c.spend ?? 0)), 0) ?? 0;
  const totalImpressions = campaigns?.reduce((acc, c) => acc + (c.impressions ?? 0), 0) ?? 0;
  const totalClicks = campaigns?.reduce((acc, c) => acc + (c.clicks ?? 0), 0) ?? 0;
  const totalConversions = campaigns?.reduce((acc, c) => acc + (c.conversions ?? 0), 0) ?? 0;
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

  const metricValues: Record<string, number> = {
    impressions: totalImpressions,
    clicks: totalClicks,
    spend: totalSpend,
    conversions: totalConversions,
    ctr: avgCtr,
    cpc: avgCpc,
    reach: Math.round(totalImpressions * 0.72),
    frequency: totalImpressions > 0 ? 1.38 : 0,
  };

  const isLoading = brainLoading || campaignsLoading;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <OnboardingGuide />

      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">
            Hola, {user?.name?.split(" ")[0] ?? "bienvenido"} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={isCustomizing ? "border-primary text-primary" : ""}
          >
            <Settings className="w-4 h-4 mr-1.5" />
            {isCustomizing ? "Guardar panel" : "Personalizar"}
          </Button>
          <Button onClick={() => setLocation("/campaigns/new")} className="gradient-brand text-white border-0">
            <PlusCircle className="w-4 h-4 mr-2" /> Nueva campaña
          </Button>
        </div>
      </div>

      {/* Brand Brain status */}
      {!brainLoading && !brain?.isComplete && (
        <div className="glass-card rounded-xl p-4 border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
              <div>
                <p className="font-medium text-sm">Configura tu Brand Brain para empezar</p>
                <p className="text-xs text-muted-foreground">Sin Brand Brain, la IA no puede personalizar tu contenido.</p>
              </div>
            </div>
            <Button size="sm" onClick={() => setLocation("/onboarding")} className="gradient-brand text-white border-0 shrink-0">
              Configurar ahora <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Metric customizer */}
      {isCustomizing && (
        <div className="glass-card rounded-xl p-5 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm">Personalizar métricas del panel</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Selecciona las métricas que quieres ver en tu panel principal</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setIsCustomizing(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ALL_METRICS.map(m => {
              const isActive = visibleMetrics.includes(m.key);
              return (
                <button
                  key={m.key}
                  onClick={() => toggleMetric(m.key)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-left ${isActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}
                >
                  <div className={`w-7 h-7 rounded-lg ${m.bg} flex items-center justify-center shrink-0`}>
                    <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium truncate ${isActive ? "text-primary" : ""}`}>{m.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.desc}</p>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats — clickable, only visible ones */}
      <div className={`grid gap-4 ${visibleMetrics.length <= 2 ? "grid-cols-2" : visibleMetrics.length <= 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-4"}`}>
        {visibleMetrics.map(key => {
          const metric = ALL_METRICS.find(m => m.key === key)!;
          const value = metricValues[key] ?? 0;
          const routeMap: Record<string, string> = {
            impressions: "/campaigns",
            clicks: "/campaigns",
            spend: "/campaigns",
            conversions: "/campaigns",
            ctr: "/campaigns",
            cpc: "/campaigns",
            reach: "/campaigns",
            frequency: "/campaigns",
          };
          return (
            <button
              key={key}
              onClick={() => setLocation(routeMap[key] ?? "/campaigns")}
              className="glass-card rounded-xl p-4 text-left hover:border-primary/30 hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${metric.bg} flex items-center justify-center`}>
                  <metric.icon className={`w-4.5 h-4.5 ${metric.color}`} />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
              {isLoading
                ? <div className="h-7 w-16 bg-secondary animate-pulse rounded" />
                : <p className="text-2xl font-display font-bold">{metric.format(value)}</p>
              }
              <p className="text-xs text-muted-foreground mt-0.5">{metric.label}</p>
            </button>
          );
        })}
      </div>

      {/* Chart + Quick actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm">Rendimiento últimos 7 días</h3>
              <p className="text-xs text-muted-foreground">Datos de campañas activas</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Metric selector */}
              <div className="flex gap-1">
                {CHART_METRICS.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setChartMetric(m.key)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${chartMetric === m.key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {/* Chart type */}
              <div className="flex gap-1 border border-border rounded-lg p-0.5">
                {(["area", "bar", "line"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`p-1 rounded transition-all ${chartType === type ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}
                    title={type}
                  >
                    {type === "area" ? <Activity className="w-3.5 h-3.5" /> : type === "bar" ? <BarChart2 className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {(() => {
            const selectedChart = CHART_METRICS.find(m => m.key === chartMetric)!;
            const commonProps = {
              data: MOCK_CHART_DATA,
              children: [
                <CartesianGrid key="grid" strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />,
                <XAxis key="x" dataKey="day" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />,
                <YAxis key="y" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />,
                <Tooltip key="tooltip" contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} />,
              ]
            };
            return (
              <ResponsiveContainer width="100%" height={180}>
                {chartType === "area" ? (
                  <AreaChart data={MOCK_CHART_DATA}>
                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={selectedChart.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={selectedChart.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    {commonProps.children}
                    <Area type="monotone" dataKey={chartMetric} stroke={selectedChart.color} fill="url(#chartGrad)" strokeWidth={2} name={selectedChart.label} />
                  </AreaChart>
                ) : chartType === "bar" ? (
                  <BarChart data={MOCK_CHART_DATA}>
                    {commonProps.children}
                    <Bar dataKey={chartMetric} fill={selectedChart.color} radius={[4, 4, 0, 0]} name={selectedChart.label} />
                  </BarChart>
                ) : (
                  <LineChart data={MOCK_CHART_DATA}>
                    {commonProps.children}
                    <Line type="monotone" dataKey={chartMetric} stroke={selectedChart.color} strokeWidth={2} dot={{ fill: selectedChart.color, r: 3 }} name={selectedChart.label} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            );
          })()}
        </div>

        {/* Quick actions */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Acciones rápidas</h3>
          <div className="space-y-2">
            {QUICK_ACTIONS.map(action => (
              <button
                key={action.path}
                onClick={() => setLocation(action.path)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content stats + Recent campaigns */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Content generated — clickable */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Contenido generado</h3>
          <div className="space-y-2">
            {[
              { icon: Sparkles, label: "Copies", count: copies?.length ?? 0, color: "text-primary", bg: "bg-primary/10", path: "/generate/copy" },
              { icon: FileText, label: "Guiones", count: scripts?.length ?? 0, color: "text-blue-400", bg: "bg-blue-400/10", path: "/generate/script" },
              { icon: ImageIcon, label: "Imágenes", count: images?.length ?? 0, color: "text-green-400", bg: "bg-green-400/10", path: "/generate/image" },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => setLocation(item.path)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center`}>
                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{item.count}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </div>
              </button>
            ))}
          </div>
          {brain?.isComplete && (
            <button
              onClick={() => setLocation("/onboarding")}
              className="w-full mt-4 pt-4 border-t border-border/50 flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Brand Brain: <strong className="text-foreground">{brain.businessName}</strong></span>
              <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
            </button>
          )}
        </div>

        {/* Recent campaigns — clickable */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Campañas recientes</h3>
            <Button variant="ghost" size="sm" onClick={() => setLocation("/campaigns")} className="text-xs text-primary">
              Ver todas <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          {campaignsLoading && <div className="flex items-center justify-center h-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
          {!campaignsLoading && (!campaigns || campaigns.length === 0) && (
            <div className="text-center py-8">
              <Megaphone className="w-8 h-8 text-primary/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin campañas todavía.</p>
              <Button size="sm" variant="link" onClick={() => setLocation("/campaigns/new")} className="text-primary mt-1">
                Crear primera campaña
              </Button>
            </div>
          )}
          {campaigns && campaigns.length > 0 && (
            <div className="space-y-1">
              {campaigns.slice(0, 5).map(c => (
                <button
                  key={c.id}
                  onClick={() => setLocation(`/campaigns`)}
                  className="w-full flex items-center justify-between py-2.5 px-3 rounded-lg border border-transparent hover:border-border/40 hover:bg-secondary/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${c.status === "active" ? "bg-green-400" : c.status === "paused" ? "bg-yellow-400" : "bg-muted-foreground"}`} />
                    <div className="text-left">
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{c.objective?.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">{(c.impressions ?? 0).toLocaleString("es-ES")} imp.</p>
                      <p className="text-xs text-muted-foreground">{(c.clicks ?? 0)} clics</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{parseFloat(String(c.spend ?? 0)).toFixed(2)}€</p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${c.status === "active" ? "border-green-500/30 text-green-400" : c.status === "paused" ? "border-yellow-500/30 text-yellow-400" : "border-border text-muted-foreground"}`}
                      >
                        {c.status === "active" ? "Activa" : c.status === "paused" ? "Pausada" : c.status === "draft" ? "Borrador" : c.status}
                      </Badge>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance summary */}
      {campaigns && campaigns.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Resumen de rendimiento</h3>
            <button onClick={() => setLocation("/campaigns")} className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver métricas detalladas <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Campañas activas", value: activeCampaigns.length, icon: Zap, color: "text-green-400" },
              { label: "CTR promedio", value: `${avgCtr.toFixed(2)}%`, icon: Percent, color: "text-orange-400" },
              { label: "CPC promedio", value: `${avgCpc.toFixed(2)}€`, icon: BarChart2, color: "text-pink-400" },
              { label: "Contenido creado", value: (copies?.length ?? 0) + (scripts?.length ?? 0) + (images?.length ?? 0), icon: Activity, color: "text-blue-400" },
            ].map(item => (
              <div key={item.label} className="text-center p-3 rounded-lg bg-secondary/30">
                <item.icon className={`w-5 h-5 ${item.color} mx-auto mb-1.5`} />
                <p className="text-lg font-display font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
