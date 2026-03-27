import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Megaphone, PlusCircle, Loader2, TrendingUp, Eye, MousePointer, DollarSign, Target } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "border-border text-muted-foreground",
  active: "border-green-500/30 text-green-400 bg-green-500/10",
  paused: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
  completed: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  error: "border-red-500/30 text-red-400 bg-red-500/10",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador", active: "Activa", paused: "Pausada", completed: "Completada", error: "Error",
};

const OBJECTIVE_LABELS: Record<string, string> = {
  awareness: "Reconocimiento", traffic: "Tráfico", engagement: "Interacción",
  leads: "Leads", conversions: "Conversiones", sales: "Ventas",
};

export default function Campaigns() {
  const [, setLocation] = useLocation();
  const { data: campaigns, isLoading } = trpc.campaigns.list.useQuery();

  const totalStats = campaigns?.reduce((acc, c) => ({
    impressions: acc.impressions + (c.impressions ?? 0),
    clicks: acc.clicks + (c.clicks ?? 0),
    spend: acc.spend + parseFloat(String(c.spend ?? 0)),
    conversions: acc.conversions + (c.conversions ?? 0),
  }), { impressions: 0, clicks: 0, spend: 0, conversions: 0 });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" /> Mis Campañas
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gestiona y monitorea todas tus campañas de Meta Ads.</p>
        </div>
        <Button onClick={() => setLocation("/campaigns/new")} className="gradient-brand text-white border-0">
          <PlusCircle className="w-4 h-4 mr-2" /> Nueva campaña
        </Button>
      </div>

      {/* Stats overview */}
      {campaigns && campaigns.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Eye, label: "Impresiones", value: (totalStats?.impressions ?? 0).toLocaleString("es-ES"), color: "text-blue-400" },
            { icon: MousePointer, label: "Clics", value: (totalStats?.clicks ?? 0).toLocaleString("es-ES"), color: "text-green-400" },
            { icon: DollarSign, label: "Gasto total", value: `${(totalStats?.spend ?? 0).toFixed(2)}€`, color: "text-yellow-400" },
            { icon: Target, label: "Conversiones", value: (totalStats?.conversions ?? 0).toLocaleString("es-ES"), color: "text-primary" },
          ].map(stat => (
            <div key={stat.label} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-display font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (!campaigns || campaigns.length === 0) && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Megaphone className="w-12 h-12 text-primary/20 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold mb-2">Sin campañas todavía</h2>
          <p className="text-muted-foreground mb-6">Crea tu primera campaña y lánzala en Meta en minutos.</p>
          <Button onClick={() => setLocation("/campaigns/new")} className="gradient-brand text-white border-0">
            <PlusCircle className="w-4 h-4 mr-2" /> Crear primera campaña
          </Button>
        </div>
      )}

      {campaigns && campaigns.length > 0 && (
        <div className="space-y-3">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="glass-card rounded-xl p-5 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold truncate">{campaign.name}</h3>
                    <Badge variant="outline" className={`text-xs shrink-0 ${STATUS_COLORS[campaign.status] ?? ""}`}>
                      {STATUS_LABELS[campaign.status] ?? campaign.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs shrink-0 border-border text-muted-foreground">
                      {OBJECTIVE_LABELS[campaign.objective] ?? campaign.objective}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-3">
                    {[
                      { label: "Impresiones", value: (campaign.impressions ?? 0).toLocaleString("es-ES") },
                      { label: "Clics", value: (campaign.clicks ?? 0).toLocaleString("es-ES") },
                      { label: "CTR", value: `${(parseFloat(String(campaign.ctr ?? 0)) * 100).toFixed(2)}%` },
                      { label: "Gasto", value: `${parseFloat(String(campaign.spend ?? 0)).toFixed(2)}€` },
                    ].map(m => (
                      <div key={m.label}>
                        <p className="text-xs text-muted-foreground">{m.label}</p>
                        <p className="text-sm font-semibold">{m.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setLocation(`/campaigns/new?id=${campaign.id}`)}>
                    <TrendingUp className="w-3 h-3 mr-1.5" /> Ver
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
