import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Brain, Megaphone, Sparkles, FileText, ImageIcon, TrendingUp,
  PlusCircle, ArrowRight, Eye, MousePointer, DollarSign, Target,
  CheckCircle2, AlertCircle, Loader2
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MOCK_CHART_DATA = [
  { day: "Lun", impressions: 1200, clicks: 45 },
  { day: "Mar", impressions: 1800, clicks: 72 },
  { day: "Mié", impressions: 1400, clicks: 58 },
  { day: "Jue", impressions: 2200, clicks: 95 },
  { day: "Vie", impressions: 2800, clicks: 120 },
  { day: "Sáb", impressions: 3200, clicks: 145 },
  { day: "Dom", impressions: 2600, clicks: 108 },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: brain, isLoading: brainLoading } = trpc.brandBrain.getMine.useQuery();
  const { data: campaigns, isLoading: campaignsLoading } = trpc.campaigns.list.useQuery();
  const { data: copies } = trpc.generate.history.useQuery({ type: "copy" });
  const { data: scripts } = trpc.generate.history.useQuery({ type: "script" });
  const { data: images } = trpc.generate.history.useQuery({ type: "image" });

  const activeCampaigns = campaigns?.filter(c => c.status === "active") ?? [];
  const totalSpend = campaigns?.reduce((acc, c) => acc + parseFloat(String(c.spend ?? 0)), 0) ?? 0;
  const totalImpressions = campaigns?.reduce((acc, c) => acc + (c.impressions ?? 0), 0) ?? 0;
  const totalClicks = campaigns?.reduce((acc, c) => acc + (c.clicks ?? 0), 0) ?? 0;

  const isLoading = brainLoading || campaignsLoading;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
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
        <Button onClick={() => setLocation("/campaigns/new")} className="gradient-brand text-white border-0">
          <PlusCircle className="w-4 h-4 mr-2" /> Nueva campaña
        </Button>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Megaphone, label: "Campañas activas", value: isLoading ? "..." : activeCampaigns.length.toString(), color: "text-primary", bg: "bg-primary/10" },
          { icon: Eye, label: "Impresiones", value: isLoading ? "..." : totalImpressions.toLocaleString("es-ES"), color: "text-blue-400", bg: "bg-blue-400/10" },
          { icon: MousePointer, label: "Clics totales", value: isLoading ? "..." : totalClicks.toLocaleString("es-ES"), color: "text-green-400", bg: "bg-green-400/10" },
          { icon: DollarSign, label: "Gasto total", value: isLoading ? "..." : `${totalSpend.toFixed(2)}€`, color: "text-yellow-400", bg: "bg-yellow-400/10" },
        ].map(stat => (
          <div key={stat.label} className="glass-card rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-display font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Chart + Quick actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm">Rendimiento últimos 7 días</h3>
              <p className="text-xs text-muted-foreground">Impresiones y clics</p>
            </div>
            <Badge variant="outline" className="border-primary/30 text-primary text-xs">Esta semana</Badge>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={MOCK_CHART_DATA}>
              <defs>
                <linearGradient id="impressionsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E84B2A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E84B2A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#888" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} />
              <Area type="monotone" dataKey="impressions" stroke="#E84B2A" fill="url(#impressionsGrad)" strokeWidth={2} name="Impresiones" />
              <Area type="monotone" dataKey="clicks" stroke="#FF6B35" fill="url(#clicksGrad)" strokeWidth={2} name="Clics" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick actions */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Acciones rápidas</h3>
          <div className="space-y-2">
            {[
              { icon: Sparkles, label: "Generar copy", desc: "Texto para anuncio", path: "/generate/copy", color: "text-primary" },
              { icon: FileText, label: "Crear guión", desc: "Para vídeo o reel", path: "/generate/script", color: "text-blue-400" },
              { icon: ImageIcon, label: "Generar imagen", desc: "Creativo visual", path: "/generate/image", color: "text-green-400" },
              { icon: Megaphone, label: "Nueva campaña", desc: "Publicar en Meta", path: "/campaigns/new", color: "text-yellow-400" },
            ].map(action => (
              <button key={action.path} onClick={() => setLocation(action.path)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
                <div className={`w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0`}>
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content stats + Recent campaigns */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Content generated */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Contenido generado</h3>
          <div className="space-y-3">
            {[
              { icon: Sparkles, label: "Copies", count: copies?.length ?? 0, color: "text-primary", bg: "bg-primary/10" },
              { icon: FileText, label: "Guiones", count: scripts?.length ?? 0, color: "text-blue-400", bg: "bg-blue-400/10" },
              { icon: ImageIcon, label: "Imágenes", count: images?.length ?? 0, color: "text-green-400", bg: "bg-green-400/10" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center`}>
                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                  </div>
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="text-sm font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
          {brain?.isComplete && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Brand Brain activo para <strong className="text-foreground">{brain.businessName}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Recent campaigns */}
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
            <div className="space-y-2">
              {campaigns.slice(0, 4).map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${c.status === "active" ? "bg-green-400" : c.status === "paused" ? "bg-yellow-400" : "bg-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{c.objective}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{parseFloat(String(c.spend ?? 0)).toFixed(2)}€</p>
                    <p className="text-xs text-muted-foreground">{(c.impressions ?? 0).toLocaleString("es-ES")} imp.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
