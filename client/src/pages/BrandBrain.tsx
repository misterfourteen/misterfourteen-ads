import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  Brain, Sparkles, Edit2, Target, MessageSquare, Trophy, Palette,
  CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronRight,
  Save, X, Building2, Users, Mic2, Star, Brush
} from "lucide-react";

// ─── Editable field ────────────────────────────────────────────────────────────
function EditableField({
  label, value, multiline = false, onSave,
}: {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
  onSave: (val: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {multiline ? (
          <Textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={3}
            className="bg-secondary/50 border-primary/30 text-sm resize-none"
            autoFocus
          />
        ) : (
          <Input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            className="bg-secondary/50 border-primary/30 text-sm h-8"
            autoFocus
          />
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-xs px-3 bg-primary hover:bg-primary/90">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Save className="w-3 h-3 mr-1" />Guardar</>}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setDraft(value ?? ""); }} className="h-7 text-xs px-2">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm leading-relaxed">{value || <span className="text-muted-foreground/50 italic">Sin definir</span>}</p>
      </div>
      <button
        onClick={() => { setDraft(value ?? ""); setEditing(true); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
      >
        <Edit2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Accordion section ─────────────────────────────────────────────────────────
function AccordionSection({
  icon: Icon, title, defaultOpen = false, children,
}: {
  icon: React.ElementType;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-semibold text-sm">{title}</span>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border/50 pt-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function BrandBrain() {
  const [, setLocation] = useLocation();
  const { data: brain, isLoading, refetch } = trpc.brandBrain.getMine.useQuery();
  const saveMutation = trpc.brandBrain.save.useMutation({
    onSuccess: () => { refetch(); toast.success("Guardado"); },
    onError: (e) => toast.error(e.message),
  });

  const save = async (fields: Record<string, string | boolean | number>) => {
    if (!brain) return;
    await saveMutation.mutateAsync({ ...brain, ...fields } as any);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!brain) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <div className="glass-card rounded-2xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-3">Aún no tienes un Brand Brain</h2>
          <p className="text-muted-foreground mb-6">Configura tu marca para que la IA genere contenido 100% personalizado a tu negocio.</p>
          <Button onClick={() => setLocation("/onboarding")} className="gradient-brand text-white border-0">
            <Sparkles className="w-4 h-4 mr-2" /> Crear mi Brand Brain
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 py-2">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-display font-bold">Brand Brain</h1>
            {brain.isComplete ? (
              <Badge className="bg-green-500/15 text-green-400 border-green-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Activo
              </Badge>
            ) : (
              <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                <AlertCircle className="w-3 h-3 mr-1" /> Incompleto
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">Haz clic en cualquier sección para expandirla y editar cada campo individualmente.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setLocation("/onboarding")}>
          <Edit2 className="w-4 h-4 mr-2" /> Reconfigurar todo
        </Button>
      </div>

      {/* Negocio y Nicho */}
      <AccordionSection icon={Building2} title="Negocio y Nicho" defaultOpen>
        <EditableField label="Nombre del negocio" value={brain.businessName} onSave={v => save({ businessName: v })} />
        <EditableField label="Nicho principal" value={brain.niche} onSave={v => save({ niche: v })} />
        <EditableField label="Sub-nicho" value={brain.subNiche} onSave={v => save({ subNiche: v })} />
        <div className="grid grid-cols-2 gap-4">
          <EditableField label="Rango de edad objetivo" value={brain.targetAgeRange} onSave={v => save({ targetAgeRange: v })} />
          <EditableField
            label="Género objetivo"
            value={brain.targetGender === "all" ? "Todos" : brain.targetGender === "female" ? "Mujeres" : "Hombres"}
            onSave={v => save({ targetGender: v.toLowerCase().includes("mujer") ? "female" : v.toLowerCase().includes("hombre") ? "male" : "all" })}
          />
        </div>
      </AccordionSection>

      {/* Cliente Ideal */}
      <AccordionSection icon={Users} title="Cliente Potencial (Avatar)">
        <EditableField label="Dolores principales" value={brain.targetPains} multiline onSave={v => save({ targetPains: v })} />
        <EditableField label="Deseos y aspiraciones" value={brain.targetDesires} multiline onSave={v => save({ targetDesires: v })} />
        <EditableField label="Objeciones comunes" value={brain.targetObjections} multiline onSave={v => save({ targetObjections: v })} />
      </AccordionSection>

      {/* Tono y Comunicación */}
      <AccordionSection icon={Mic2} title="Tono y Comunicación">
        <EditableField
          label="Tono de comunicación"
          value={brain.communicationTone}
          onSave={v => save({ communicationTone: v as any })}
        />
        <p className="text-xs text-muted-foreground -mt-2">Opciones: motivational, scientific, direct, friendly, rebel</p>
        <EditableField label="Voz de marca (descripción libre)" value={brain.brandVoice} multiline onSave={v => save({ brandVoice: v })} />
        <EditableField label="Palabras y frases a evitar" value={brain.wordsToAvoid} multiline onSave={v => save({ wordsToAvoid: v })} />
      </AccordionSection>

      {/* Diferenciadores */}
      <AccordionSection icon={Trophy} title="Diferenciadores y Resultados">
        <EditableField label="Principal diferenciador" value={brain.mainDifferentiator} multiline onSave={v => save({ mainDifferentiator: v })} />
        <EditableField label="Casos de éxito reales" value={brain.successCases} multiline onSave={v => save({ successCases: v })} />
        <EditableField label="Metodología o proceso único" value={brain.methodology} multiline onSave={v => save({ methodology: v })} />
      </AccordionSection>

      {/* Identidad Visual */}
      <AccordionSection icon={Brush} title="Identidad Visual">
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 mb-2">
          <strong>Nota:</strong> Los colores de marca son solo referencia para la IA. Las imágenes generadas no estarán limitadas a estos tonos — se crearán con variedad visual para maximizar el rendimiento en Meta.
        </div>
        <div className="flex items-center gap-6">
          {[
            { label: "Primario", color: brain.primaryColor, field: "primaryColor" },
            { label: "Secundario", color: brain.secondaryColor, field: "secondaryColor" },
            { label: "Acento", color: brain.accentColor, field: "accentColor" },
          ].map(c => (
            <div key={c.label} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg border border-border cursor-pointer relative group" style={{ backgroundColor: c.color ?? "#000" }}>
                <input
                  type="color"
                  value={c.color ?? "#000000"}
                  onChange={e => save({ [c.field]: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-xs font-mono">{c.color}</p>
              </div>
            </div>
          ))}
        </div>
        <EditableField
          label="Estilo visual"
          value={brain.visualStyle}
          onSave={v => save({ visualStyle: v as any })}
        />
        <p className="text-xs text-muted-foreground -mt-2">Opciones: minimalist, bold, elegant, energetic, professional</p>
      </AccordionSection>

      {/* Prompt Maestro */}
      {brain.masterPrompt && (
        <AccordionSection icon={Brain} title="Prompt Maestro (generado por IA)">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{brain.masterPrompt}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => saveMutation.mutateAsync({ ...brain, masterPrompt: "" } as any)}
          >
            <Sparkles className="w-3 h-3 mr-1" /> Regenerar prompt maestro
          </Button>
        </AccordionSection>
      )}

      {/* CTA si incompleto */}
      {!brain.isComplete && (
        <div className="glass-card rounded-xl p-5 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium mb-1">Completa tu Brand Brain</p>
              <p className="text-sm text-muted-foreground">Termina la configuración para activar todos los generadores de IA.</p>
            </div>
            <Button onClick={() => setLocation("/onboarding")} className="gradient-brand text-white border-0 shrink-0 ml-4">
              Completar ahora
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
