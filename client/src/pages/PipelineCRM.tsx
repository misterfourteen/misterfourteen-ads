import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  User,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  Euro,
  Zap,
  MoreHorizontal,
  X,
  ChevronRight,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Settings,
  Play,
  Pause,
  Trash2,
  Edit,
  Tag,
  Instagram,
  Globe,
  PhoneCall,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

// ─── Types ───────────────────────────────────────────────────────────────────

type Stage = {
  id: number;
  name: string;
  color: string | null;
  position: number;
  leads: Lead[];
  leadCount: number;
};

type Lead = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  source: string | null;
  value?: number | string | null;
  tags?: string | null;
  notes?: string | null;
  stageId: number;
  position: number;
  metaCampaignId?: string | null;
  lastContactedAt?: Date | null;
  createdAt: Date;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sourceIcon(source: string) {
  switch (source) {
    case "meta_lead_ad": return <Instagram className="w-3 h-3" />;
    case "landing_page": return <Globe className="w-3 h-3" />;
    case "whatsapp": return <MessageSquare className="w-3 h-3" />;
    case "email": return <Mail className="w-3 h-3" />;
    case "manual": return <User className="w-3 h-3" />;
    default: return <User className="w-3 h-3" />;
  }
}

function sourceLabel(source: string) {
  const map: Record<string, string> = {
    meta_lead_ad: "Meta Lead Ad",
    landing_page: "Landing Page",
    whatsapp: "WhatsApp",
    email: "Email",
    manual: "Manual",
    other: "Otro",
  };
  return map[source] ?? source;
}

function fmtEur(n: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-500/20 text-blue-600",
  "bg-purple-500/20 text-purple-600",
  "bg-green-500/20 text-green-600",
  "bg-orange-500/20 text-orange-600",
  "bg-pink-500/20 text-pink-600",
  "bg-indigo-500/20 text-indigo-600",
];

function avatarColor(name: string) {
  const i = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({
  lead,
  onDrag,
  onClick,
}: {
  lead: Lead;
  onDrag: (e: React.DragEvent) => void;
  onClick: () => void;
}) {
  const tags: string[] = (() => {
    try { return JSON.parse(lead.tags ?? "[]"); } catch { return []; }
  })();

  return (
    <div
      draggable
      onDragStart={onDrag}
      onClick={onClick}
      className="bg-card border border-border/60 rounded-lg p-3 cursor-pointer hover:border-border hover:shadow-sm transition-all group select-none"
    >
      <div className="flex items-start gap-2.5 mb-2">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0", avatarColor(lead.name))}>
          {initials(lead.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{lead.name}</p>
          {lead.email && <p className="text-xs text-muted-foreground truncate">{lead.email}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className={cn("flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md", "bg-muted text-muted-foreground")}>
          {sourceIcon(lead.source ?? "manual")}
          <span>{sourceLabel(lead.source ?? "manual")}</span>
        </div>

        {lead.value && Number(lead.value) > 0 && (
          <span className="text-xs font-medium text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-md">
            {fmtEur(Number(lead.value))}
          </span>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>{formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: es })}</span>
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity"
          >
            <Phone className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  onDrop,
  onLeadClick,
  onDragLead,
  onAddLead,
}: {
  stage: Stage;
  onDrop: (e: React.DragEvent, stageId: number) => void;
  onLeadClick: (lead: Lead) => void;
  onDragLead: (e: React.DragEvent, lead: Lead) => void;
  onAddLead: (stageId: number) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const stageValue = stage.leads.reduce((s, l) => s + (Number(l.value) || 0), 0);

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color ?? "#6366f1" }} />
          <span className="text-sm font-medium">{stage.name}</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {stage.leadCount}
          </span>
        </div>
        {stageValue > 0 && (
          <span className="text-xs text-muted-foreground">{fmtEur(stageValue)}</span>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { setIsDragOver(false); onDrop(e, stage.id); }}
        className={cn(
          "flex-1 rounded-xl p-2 space-y-2 min-h-[200px] transition-colors",
          isDragOver ? "bg-primary/5 border-2 border-primary/20 border-dashed" : "bg-muted/30"
        )}
      >
        {stage.leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onDrag={(e) => onDragLead(e, lead)}
            onClick={() => onLeadClick(lead)}
          />
        ))}

        {isDragOver && stage.leads.length === 0 && (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
            Soltar aquí
          </div>
        )}
      </div>

      {/* Add lead button */}
      <button
        onClick={() => onAddLead(stage.id)}
        className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg px-3 py-2 transition-colors w-full"
      >
        <Plus className="w-3.5 h-3.5" />
        Añadir lead
      </button>
    </div>
  );
}

// ─── Lead Detail Sheet ────────────────────────────────────────────────────────

function LeadSheet({ leadId, onClose }: { leadId: number; onClose: () => void }) {
  
  const [activityTab, setActivityTab] = useState("timeline");
  const [noteText, setNoteText] = useState("");
  const utils = trpc.useUtils();

  const { data: lead, isLoading } = trpc.pipeline.getLead.useQuery({ id: leadId });

  const addActivityMut = trpc.pipeline.addActivity.useMutation({
    onSuccess: () => {
      setNoteText("");
      utils.pipeline.getLead.invalidate({ id: leadId });
      toast.success("Actividad añadida");
    },
  });

  if (isLoading || !lead) {
    return (
      <Sheet open onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const tags: string[] = (() => {
    try { return JSON.parse(lead.tags ?? "[]"); } catch { return []; }
  })();

  const activityIcons: Record<string, React.ElementType> = {
    note: FileText, email: Mail, call: PhoneCall,
    whatsapp: MessageSquare, stage_change: ArrowRight,
    task: CheckCircle, meeting: Calendar,
  };

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold", avatarColor(lead.name))}>
              {initials(lead.name)}
            </div>
            <div>
              <SheetTitle className="text-base">{lead.name}</SheetTitle>
              <p className="text-sm text-muted-foreground">{sourceLabel(lead.source)}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="py-4 space-y-4">
          {/* Contact info */}
          <div className="space-y-2">
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {lead.email}
              </a>
            )}
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm hover:text-primary">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {lead.phone}
              </a>
            )}
            {lead.value && Number(lead.value) > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Euro className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-green-600">{fmtEur(Number(lead.value))}</span>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            {lead.phone && (
              <a href={`https://wa.me/${lead.phone?.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  WhatsApp
                </Button>
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Mail className="w-4 h-4 text-blue-500" />
                  Email
                </Button>
              </a>
            )}
            {lead.phone && (
              <a href={`tel:${lead.phone}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Phone className="w-4 h-4 text-purple-500" />
                  Llamar
                </Button>
              </a>
            )}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Campaign source */}
          {lead.metaCampaignId && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg px-3 py-2">
              <p className="text-xs text-blue-600 font-medium">Origen: Meta Lead Ad</p>
              <p className="text-xs text-muted-foreground mt-0.5">Campaign ID: {lead.metaCampaignId}</p>
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <div className="bg-muted/40 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Notas</p>
              <p className="text-sm">{lead.notes}</p>
            </div>
          )}

          {/* Add note */}
          <div className="space-y-2">
            <Textarea
              placeholder="Añadir nota, llamada, email..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[80px] text-sm resize-none"
            />
            <div className="flex gap-2">
              {(["note", "call", "email", "whatsapp", "meeting"] as const).map((type) => {
                const Icon = activityIcons[type] ?? FileText;
                const labels: Record<string, string> = { note: "Nota", call: "Llamada", email: "Email", whatsapp: "WhatsApp", meeting: "Reunión" };
                return (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={!noteText.trim() || addActivityMut.isPending}
                    onClick={() => addActivityMut.mutate({ leadId: lead.id, type, content: noteText })}
                  >
                    <Icon className="w-3.5 h-3.5 mr-1" />
                    {labels[type]}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Activity timeline */}
          <div>
            <p className="text-sm font-medium mb-3">Actividad</p>
            <div className="space-y-3">
              {(lead.activities ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sin actividad registrada</p>
              ) : (
                (lead.activities ?? []).map((act: any) => {
                  const Icon = activityIcons[act.type] ?? FileText;
                  return (
                    <div key={act.id} className="flex gap-3">
                      <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{act.content}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Create Lead Dialog ───────────────────────────────────────────────────────

function CreateLeadDialog({
  stageId,
  onClose,
}: {
  stageId: number;
  onClose: () => void;
}) {
  
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    name: "", email: "", phone: "", notes: "",
    value: "", source: "manual" as const,
  });

  const createMut = trpc.pipeline.createLead.useMutation({
    onSuccess: () => {
      utils.pipeline.getBoard.invalidate();
      toast.success("Lead creado");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nombre *</label>
            <Input
              placeholder="Nombre del lead"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="email@ejemplo.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Teléfono</label>
              <Input
                placeholder="+34 600 000 000"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor estimado (€)</label>
              <Input
                type="number"
                placeholder="0"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Origen</label>
              <Select
                value={form.source}
                onValueChange={(v) => setForm((f) => ({ ...f, source: v as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="meta_lead_ad">Meta Lead Ad</SelectItem>
                  <SelectItem value="landing_page">Landing Page</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notas</label>
            <Textarea
              placeholder="Información adicional..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="resize-none min-h-[80px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() =>
              createMut.mutate({
                stageId,
                name: form.name,
                email: form.email || undefined,
                phone: form.phone || undefined,
                notes: form.notes || undefined,
                value: form.value ? parseFloat(form.value) : undefined,
                source: form.source,
              })
            }
            disabled={!form.name.trim() || createMut.isPending}
          >
            {createMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Crear lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: any }) {
  if (!stats) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {[
        { label: "Total leads", value: stats.totalLeads, icon: Users, color: "blue" },
        { label: "Este mes", value: stats.thisMonth, icon: Calendar, color: "purple" },
        { label: "Valor pipeline", value: stats.totalValue > 0 ? fmtEur(stats.totalValue) : "€0", icon: Euro, color: "green" },
        { label: "Conversión", value: `${stats.byStage?.find((s: any) => s.stageName?.includes("Cerrado"))?.count ?? 0} cerrados`, icon: Target, color: "orange" },
      ].map(({ label, value, icon: Icon, color }) => (
        <Card key={label} className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", color === "blue" && "bg-blue-500/10", color === "purple" && "bg-purple-500/10", color === "green" && "bg-green-500/10", color === "orange" && "bg-orange-500/10")}>
              <Icon className={cn("w-4 h-4", color === "blue" && "text-blue-500", color === "purple" && "text-purple-500", color === "green" && "text-green-500", color === "orange" && "text-orange-500")} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-semibold">{String(value)}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  
  const utils = trpc.useUtils();
  const dragLeadRef = useRef<Lead | null>(null);

  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [createLeadStageId, setCreateLeadStageId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"board" | "automations">("board");

  const { data: board, isLoading } = trpc.pipeline.getBoard.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const { data: stats } = trpc.pipeline.getStats.useQuery();
  const { data: automations } = trpc.pipeline.getAutomations.useQuery();

  const moveLeadMut = trpc.pipeline.moveLead.useMutation({
    onSuccess: () => utils.pipeline.getBoard.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const toggleAutomMut = trpc.pipeline.toggleAutomation.useMutation({
    onSuccess: () => utils.pipeline.getAutomations.invalidate(),
  });

  function handleDrop(e: React.DragEvent, toStageId: number) {
    e.preventDefault();
    const lead = dragLeadRef.current;
    if (!lead) return;
    if (lead.stageId === toStageId) return;

    const targetStage = board?.stages.find((s) => s.id === toStageId);
    const newPosition = (targetStage?.leads.length ?? 0);

    moveLeadMut.mutate({ leadId: lead.id, toStageId, position: newPosition });
    dragLeadRef.current = null;
  }

  const filteredBoard = board
    ? {
        ...board,
        stages: board.stages.map((stage) => ({
          ...stage,
          leads: stage.leads.filter((lead) => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
              lead.name.toLowerCase().includes(q) ||
              lead.email?.toLowerCase().includes(q) ||
              lead.phone?.includes(q)
            );
          }),
        })),
      }
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pipeline CRM</h1>
          <p className="text-sm text-muted-foreground">Gestión de leads y automatizaciones</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar lead..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-52 h-9"
            />
          </div>
          <Button
            variant={tab === "board" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("board")}
          >
            Tablero
          </Button>
          <Button
            variant={tab === "automations" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("automations")}
          >
            <Zap className="w-4 h-4 mr-1.5" />
            Automatizaciones
          </Button>
        </div>
      </div>

      <StatsBar stats={stats} />

      {tab === "board" ? (
        /* Kanban Board */
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {(filteredBoard?.stages ?? []).map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage as unknown as Stage}
              onDrop={handleDrop}
              onLeadClick={(lead) => setSelectedLeadId(lead.id)}
              onDragLead={(e, lead) => { e.dataTransfer.effectAllowed = "move"; dragLeadRef.current = lead; }}
              onAddLead={setCreateLeadStageId}
            />
          ))}

          {(!filteredBoard?.stages || filteredBoard.stages.length === 0) && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Cargando pipeline...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Automations */
        <div className="space-y-3 max-w-3xl">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{(automations ?? []).length} automatizaciones configuradas</p>
            <Button size="sm" onClick={() => toast.info("Editor de automatizaciones en construcción")}>
              <Plus className="w-4 h-4 mr-1.5" />
              Nueva automatización
            </Button>
          </div>

          {(automations ?? []).length === 0 ? (
            <Card className="border-dashed border-border">
              <CardContent className="py-12 text-center">
                <Zap className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="font-medium mb-1">Sin automatizaciones</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Crea flujos automáticos: cuando un lead cambia de etapa, envía un WhatsApp, email o notificación.
                </p>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Crear primera automatización
                </Button>
              </CardContent>
            </Card>
          ) : (
            (automations ?? []).map((auto: any) => {
              const trigger = typeof auto.trigger === "string" ? JSON.parse(auto.trigger) : auto.trigger;
              const actions = typeof auto.actions === "string" ? JSON.parse(auto.actions) : auto.actions;
              return (
                <Card key={auto.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", auto.isActive ? "bg-green-500/10" : "bg-muted")}>
                          <Zap className={cn("w-4 h-4", auto.isActive ? "text-green-500" : "text-muted-foreground")} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{auto.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Disparador: {trigger?.type} → {(actions ?? []).length} accion(es)
                          </p>
                          {auto.executionCount > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Ejecutada {auto.executionCount} veces
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAutomMut.mutate({ id: auto.id, isActive: !auto.isActive })}
                      >
                        {auto.isActive ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                        {auto.isActive ? "Pausar" : "Activar"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Lead detail sheet */}
      {selectedLeadId && (
        <LeadSheet leadId={selectedLeadId} onClose={() => setSelectedLeadId(null)} />
      )}

      {/* Create lead dialog */}
      {createLeadStageId && (
        <CreateLeadDialog stageId={createLeadStageId} onClose={() => setCreateLeadStageId(null)} />
      )}
    </div>
  );
}
