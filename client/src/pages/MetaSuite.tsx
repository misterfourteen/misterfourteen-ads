import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Eye,
  MousePointer,
  Euro,
  Users,
  Play,
  Pause,
  MoreHorizontal,
  RefreshCw,
  Link2,
  ChevronRight,
  Target,
  Zap,
  Image,
  Video,
  FileText,
  Globe,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// ─── Types ───────────────────────────────────────────────────────────────────

type DatePreset = "today" | "yesterday" | "last_7d" | "last_30d" | "last_90d";

const DATE_LABELS: Record<DatePreset, string> = {
  today: "Hoy",
  yesterday: "Ayer",
  last_7d: "Últimos 7 días",
  last_30d: "Últimos 30 días",
  last_90d: "Últimos 90 días",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("es-ES");
}

function fmtEur(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
}

function fmtPct(n: number) {
  return `${n.toFixed(2)}%`;
}

function statusColor(status: string) {
  switch (status.toUpperCase()) {
    case "ACTIVE": return "bg-green-500/15 text-green-600 border-green-500/20";
    case "PAUSED": return "bg-yellow-500/15 text-yellow-600 border-yellow-500/20";
    case "ARCHIVED": return "bg-zinc-500/15 text-zinc-500 border-zinc-500/20";
    case "ERROR":
    case "DISAPPROVED": return "bg-red-500/15 text-red-600 border-red-500/20";
    case "IN_PROCESS": return "bg-blue-500/15 text-blue-600 border-blue-500/20";
    default: return "bg-zinc-500/15 text-zinc-500 border-zinc-500/20";
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "Activa", PAUSED: "Pausada", ARCHIVED: "Archivada",
    ERROR: "Error", DISAPPROVED: "Rechazada", IN_PROCESS: "En proceso",
    DELETED: "Eliminada",
  };
  return map[status.toUpperCase()] ?? status;
}

function objectiveLabel(obj: string) {
  const map: Record<string, string> = {
    OUTCOME_LEADS: "Leads", OUTCOME_SALES: "Ventas",
    OUTCOME_TRAFFIC: "Tráfico", OUTCOME_AWARENESS: "Reconocimiento",
    OUTCOME_ENGAGEMENT: "Interacción", OUTCOME_APP_PROMOTION: "App",
    LINK_CLICKS: "Clics", CONVERSIONS: "Conversiones",
    LEAD_GENERATION: "Leads", REACH: "Alcance",
    BRAND_AWARENESS: "Reconocimiento", VIDEO_VIEWS: "Vídeos",
    MESSAGES: "Mensajes",
  };
  return map[obj?.toUpperCase()] ?? obj ?? "—";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, icon: Icon, trend, color = "default",
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; trend?: number; color?: string;
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={cn("p-2 rounded-lg", color === "blue" && "bg-blue-500/10", color === "green" && "bg-green-500/10", color === "orange" && "bg-orange-500/10", color === "purple" && "bg-purple-500/10", color === "default" && "bg-muted")}>
            <Icon className={cn("w-4 h-4", color === "blue" && "text-blue-500", color === "green" && "text-green-500", color === "orange" && "text-orange-500", color === "purple" && "text-purple-500", color === "default" && "text-muted-foreground")} />
          </div>
        </div>
        {trend !== undefined && (
          <div className={cn("flex items-center gap-1 mt-2 text-xs", trend >= 0 ? "text-green-600" : "text-red-500")}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(trend).toFixed(1)}% vs periodo anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CampaignRow({
  campaign, onToggle, onBudgetEdit, onDrill,
}: {
  campaign: any;
  onToggle: (id: string, status: "ACTIVE" | "PAUSED") => void;
  onBudgetEdit: (campaign: any) => void;
  onDrill: (campaign: any) => void;
}) {
  const isActive = campaign.status?.toUpperCase() === "ACTIVE";
  const ctr = Number(campaign.ctr ?? 0);
  const spend = Number(campaign.spend ?? 0);
  const roas = Number(campaign.roas ?? 0);

  return (
    <tr
      className="border-b border-border/40 hover:bg-muted/30 transition-colors cursor-pointer group"
      onClick={() => onDrill(campaign)}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(campaign.metaCampaignId, isActive ? "PAUSED" : "ACTIVE"); }}
            className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", isActive ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "bg-muted text-muted-foreground hover:bg-muted/80")}
          >
            {isActive ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <div>
            <p className="text-sm font-medium line-clamp-1 max-w-[220px]">{campaign.name}</p>
            <p className="text-xs text-muted-foreground">{objectiveLabel(campaign.objective)}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge variant="outline" className={cn("text-xs", statusColor(campaign.status))}>
          {statusLabel(campaign.status)}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-right tabular-nums">{fmt(Number(campaign.impressions ?? 0))}</td>
      <td className="px-4 py-3 text-sm text-right tabular-nums">{fmt(Number(campaign.clicks ?? 0))}</td>
      <td className="px-4 py-3 text-sm text-right tabular-nums">{fmtPct(ctr)}</td>
      <td className="px-4 py-3 text-sm text-right tabular-nums">{fmtEur(spend)}</td>
      <td className="px-4 py-3 text-sm text-right tabular-nums">
        {roas > 0 ? <span className={cn(roas >= 2 ? "text-green-600 font-medium" : roas >= 1 ? "text-yellow-600" : "text-red-500")}>{roas.toFixed(2)}x</span> : "—"}
      </td>
      <td className="px-4 py-3 text-sm text-right tabular-nums">
        {campaign.dailyBudget ? (
          <button
            onClick={(e) => { e.stopPropagation(); onBudgetEdit(campaign); }}
            className="hover:underline text-primary"
          >
            {fmtEur(Number(campaign.dailyBudget))}/día
          </button>
        ) : "—"}
      </td>
      <td className="px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDrill(campaign)}>Ver detalles</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBudgetEdit(campaign)}>Editar presupuesto</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggle(campaign.metaCampaignId, isActive ? "PAUSED" : "ACTIVE")}>
              {isActive ? "Pausar" : "Activar"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

function BudgetDialog({ campaign, open, onClose, onSave }: {
  campaign: any; open: boolean;
  onClose: () => void; onSave: (budget: number) => void;
}) {
  const [value, setValue] = useState(String(Number(campaign?.dailyBudget ?? 0)));
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar presupuesto diario</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground line-clamp-1">{campaign?.name}</p>
          <div className="relative">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              min={1}
              step={0.01}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={() => onSave(parseFloat(value))}>Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AdSetDrilldown({ campaign, onClose }: { campaign: any; onClose: () => void }) {
  const [datePreset, setDatePreset] = useState<DatePreset>("last_30d");
  const { data: adSets, isLoading } = trpc.meta.getAdSets.useQuery(
    { campaignId: campaign.metaCampaignId, datePreset },
    { enabled: !!campaign.metaCampaignId }
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 px-2">
              Campañas
            </Button>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium line-clamp-1">{campaign.name}</span>
          </div>
          <DialogTitle className="text-base">Conjuntos de anuncios</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left px-3 py-2 font-medium">Conjunto</th>
                  <th className="text-left px-3 py-2 font-medium">Estado</th>
                  <th className="text-right px-3 py-2 font-medium">Impresiones</th>
                  <th className="text-right px-3 py-2 font-medium">Clics</th>
                  <th className="text-right px-3 py-2 font-medium">CTR</th>
                  <th className="text-right px-3 py-2 font-medium">Gasto</th>
                </tr>
              </thead>
              <tbody>
                {(adSets ?? []).map((as: any) => (
                  <tr key={as.metaAdSetId} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="px-3 py-3">
                      <p className="font-medium">{as.name}</p>
                      {as.dailyBudget && <p className="text-xs text-muted-foreground">{fmtEur(Number(as.dailyBudget))}/día</p>}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="outline" className={cn("text-xs", statusColor(as.status))}>
                        {statusLabel(as.status)}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmt(Number(as.impressions ?? 0))}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmt(Number(as.clicks ?? 0))}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmtPct(Number(as.ctr ?? 0))}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmtEur(Number(as.spend ?? 0))}</td>
                  </tr>
                ))}
                {(!adSets || adSets.length === 0) && (
                  <tr><td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Sin conjuntos de anuncios</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MetaSuite() {
  const { toast } = useToast();
  const [datePreset, setDatePreset] = useState<DatePreset>("last_30d");
  const [budgetDialog, setBudgetDialog] = useState<any>(null);
  const [drilldown, setDrilldown] = useState<any>(null);
  const [tab, setTab] = useState("campaigns");

  // Queries
  const { data: connection } = trpc.meta.getConnection.useQuery();
  const {
    data: summary,
    refetch: refetchSummary,
  } = trpc.meta.getAccountSummary.useQuery(
    { datePreset },
    { enabled: !!connection, refetchInterval: 5 * 60 * 1000 }
  );
  const {
    data: campaigns,
    isLoading: campaignsLoading,
    refetch: refetchCampaigns,
  } = trpc.meta.getCampaigns.useQuery(
    { datePreset, forceSync: false },
    { enabled: !!connection, refetchInterval: 10 * 60 * 1000 }
  );
  const {
    data: posts,
    isLoading: postsLoading,
  } = trpc.meta.getPosts.useQuery(
    { platform: "all", limit: 20 },
    { enabled: !!connection && tab === "posts" }
  );

  // Mutations
  const toggleMut = trpc.meta.toggleCampaignStatus.useMutation({
    onSuccess: () => { refetchCampaigns(); toast({ title: "Estado actualizado" }); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const budgetMut = trpc.meta.updateBudget.useMutation({
    onSuccess: () => { setBudgetDialog(null); refetchCampaigns(); toast({ title: "Presupuesto actualizado" }); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const forceSyncMut = trpc.meta.getCampaigns.useQuery(
    { datePreset, forceSync: true },
    { enabled: false }
  );

  // Not connected state
  if (!connection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center">
          <Link2 className="w-7 h-7 text-blue-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Conecta tu cuenta de Meta</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Vincula tu cuenta publicitaria de Facebook/Instagram para ver campañas, métricas y publicaciones en tiempo real.
          </p>
        </div>
        <Button asChild>
          <a href="/meta-connect">Conectar Meta Business</a>
        </Button>
      </div>
    );
  }

  const totalSpend = Number(summary?.spend ?? 0);
  const totalImpressions = Number(summary?.impressions ?? 0);
  const totalClicks = Number(summary?.clicks ?? 0);
  const totalConversions = Number(summary?.conversions ?? 0);
  const avgCTR = Number(summary?.ctr ?? 0);
  const avgCPC = Number(summary?.cpc ?? 0);
  const avgROAS = Number(summary?.roas ?? 0);

  const activeCampaigns = (campaigns ?? []).filter((c: any) => c.status?.toUpperCase() === "ACTIVE").length;

  return (
    <div className="space-y-6 p-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">
              {connection.adAccountName ?? connection.metaUserName}
            </span>
          </div>
          <h1 className="text-2xl font-bold">Meta Business Suite</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { refetchCampaigns(); refetchSummary(); toast({ title: "Sincronizando datos..." }); }}
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <MetricCard label="Gasto total" value={fmtEur(totalSpend)} icon={Euro} color="orange" />
        <MetricCard label="Impresiones" value={fmt(totalImpressions)} icon={Eye} color="blue" />
        <MetricCard label="Clics" value={fmt(totalClicks)} icon={MousePointer} color="purple" />
        <MetricCard label="CTR" value={fmtPct(avgCTR)} icon={Target} color="green" />
        <MetricCard label="CPC" value={fmtEur(avgCPC)} icon={Zap} color="default" />
        <MetricCard label="Conversiones" value={fmt(totalConversions)} icon={CheckCircle2} color="green" />
        <MetricCard label="ROAS" value={avgROAS > 0 ? `${avgROAS.toFixed(2)}x` : "—"} icon={TrendingUp} color={avgROAS >= 2 ? "green" : "default"} />
      </div>

      {/* Quick stats bar */}
      <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground bg-muted/40 rounded-lg px-4 py-2.5">
        <span><span className="font-semibold text-foreground">{activeCampaigns}</span> campañas activas</span>
        <span className="text-border">·</span>
        <span><span className="font-semibold text-foreground">{(campaigns ?? []).length}</span> campañas totales</span>
        <span className="text-border">·</span>
        <span>Alcance: <span className="font-semibold text-foreground">{fmt(Number(summary?.reach ?? 0))}</span></span>
        <span className="text-border">·</span>
        <span>CPM: <span className="font-semibold text-foreground">{fmtEur(Number(summary?.cpm ?? 0))}</span></span>
        <span className="text-border">·</span>
        <span>Freq: <span className="font-semibold text-foreground">{Number(summary?.frequency ?? 0).toFixed(2)}</span></span>
      </div>

      {/* Main tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="campaigns">Campañas</TabsTrigger>
          <TabsTrigger value="posts">Publicaciones</TabsTrigger>
          <TabsTrigger value="creatives">Creativos</TabsTrigger>
        </TabsList>

        {/* CAMPAIGNS TAB */}
        <TabsContent value="campaigns" className="mt-4">
          {campaignsLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Card className="border-border/50">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Campaña</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Estado</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Impresiones</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Clics</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">CTR</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Gasto</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">ROAS</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Presupuesto</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {(campaigns ?? []).map((c: any) => (
                      <CampaignRow
                        key={c.metaCampaignId}
                        campaign={c}
                        onToggle={(id, status) => toggleMut.mutate({ campaignId: id, status })}
                        onBudgetEdit={setBudgetDialog}
                        onDrill={setDrilldown}
                      />
                    ))}
                    {(!campaigns || campaigns.length === 0) && (
                      <tr>
                        <td colSpan={9} className="text-center py-16 text-muted-foreground">
                          <AlertCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
                          <p>No se encontraron campañas en esta cuenta</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* POSTS TAB */}
        <TabsContent value="posts" className="mt-4">
          {postsLoading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(posts ?? []).map((post: any) => (
                <Card key={post.id} className="border-border/50 overflow-hidden">
                  {post.mediaUrl && (
                    <div className="aspect-square bg-muted relative overflow-hidden">
                      <img
                        src={post.mediaUrl}
                        alt="Post"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <Badge className="absolute top-2 right-2 text-xs" variant="secondary">
                        {post.platform === "instagram" ? "Instagram" : "Facebook"}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-3">
                    {post.message && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{post.message}</p>
                    )}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Alcance</p>
                        <p className="text-sm font-semibold">{fmt(post.reach)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Impresiones</p>
                        <p className="text-sm font-semibold">{fmt(post.impressions)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Interacción</p>
                        <p className="text-sm font-semibold">{fmt(post.engagement)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {post.publishedAt ? formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true, locale: es }) : ""}
                      </p>
                      {post.permalink && (
                        <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!posts || posts.length === 0) && (
                <div className="col-span-full text-center py-16 text-muted-foreground">
                  <Image className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p>No se encontraron publicaciones recientes</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* CREATIVES TAB */}
        <TabsContent value="creatives" className="mt-4">
          <div className="text-center py-16 text-muted-foreground">
            <Video className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Creativos de anuncios</p>
            <p className="text-sm mt-1">Selecciona una campaña en la pestaña "Campañas" para ver sus creativos</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Budget dialog */}
      {budgetDialog && (
        <BudgetDialog
          campaign={budgetDialog}
          open={!!budgetDialog}
          onClose={() => setBudgetDialog(null)}
          onSave={(budget) => budgetMut.mutate({ campaignId: budgetDialog.metaCampaignId, dailyBudget: budget })}
        />
      )}

      {/* Drilldown to ad sets */}
      {drilldown && (
        <AdSetDrilldown campaign={drilldown} onClose={() => setDrilldown(null)} />
      )}
    </div>
  );
}
