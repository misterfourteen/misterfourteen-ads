import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Brain, Building2, Users, MessageSquare, Trophy,
  Palette, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, Loader2
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Tu Negocio", icon: Building2, desc: "Cuéntanos sobre tu marca" },
  { id: 2, title: "Cliente Ideal", icon: Users, desc: "¿A quién le vendes?" },
  { id: 3, title: "Tono de Marca", icon: MessageSquare, desc: "¿Cómo hablas?" },
  { id: 4, title: "Diferenciadores", icon: Trophy, desc: "¿Por qué tú?" },
  { id: 5, title: "Identidad Visual", icon: Palette, desc: "Tu estilo visual" },
];

const TONE_OPTIONS = [
  { value: "motivational", label: "Motivacional", desc: "Energía, acción, resultados" },
  { value: "scientific", label: "Científico", desc: "Datos, evidencia, rigor" },
  { value: "direct", label: "Directo", desc: "Sin rodeos, claro, honesto" },
  { value: "friendly", label: "Cercano", desc: "Empático, conversacional" },
  { value: "rebel", label: "Rebelde", desc: "Rompe esquemas, provocador" },
];

const VISUAL_STYLES = [
  { value: "minimalist", label: "Minimalista" },
  { value: "bold", label: "Impactante" },
  { value: "elegant", label: "Elegante" },
  { value: "energetic", label: "Energético" },
  { value: "professional", label: "Profesional" },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const [form, setForm] = useState({
    businessName: "",
    niche: "",
    subNiche: "",
    targetAgeRange: "",
    targetGender: "all" as "male" | "female" | "all",
    targetPains: "",
    targetDesires: "",
    targetObjections: "",
    communicationTone: "direct" as "motivational" | "scientific" | "direct" | "friendly" | "rebel",
    brandVoice: "",
    wordsToAvoid: "",
    mainDifferentiator: "",
    successCases: "",
    methodology: "",
    primaryColor: "#E84B2A",
    secondaryColor: "#1A1A2E",
    accentColor: "#FF6B35",
    visualStyle: "professional" as "minimalist" | "bold" | "elegant" | "energetic" | "professional",
  });

  const saveMutation = trpc.brandBrain.save.useMutation();
  const generatePromptMutation = trpc.brandBrain.generateMasterPrompt.useMutation();

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleNext = async () => {
    if (step < 5) {
      await saveMutation.mutateAsync({ ...form, onboardingStep: step + 1 });
      setStep(s => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsGenerating(true);
    try {
      await saveMutation.mutateAsync({ ...form, onboardingStep: 5, isComplete: false });
      await generatePromptMutation.mutateAsync();
      toast.success("¡Brand Brain creado! La IA ya conoce tu marca.");
      setLocation("/brand-brain");
    } catch {
      toast.error("Error al generar el Brand Brain. Inténtalo de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const progress = (step / 5) * 100;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4 glow-primary">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">Configura tu Brand Brain</h1>
          <p className="text-muted-foreground">La IA aprenderá tu marca para generar contenido 100% personalizado.</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  s.id < step ? "bg-primary text-primary-foreground" :
                  s.id === step ? "bg-primary/20 text-primary border-2 border-primary" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {s.id < step ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${s.id === step ? "text-primary" : "text-muted-foreground"}`}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div className="h-full gradient-brand rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            {(() => { const S = STEPS[step - 1]; return S ? <S.icon className="w-5 h-5 text-primary" /> : null; })()}
            <div>
              <h2 className="font-display font-bold text-xl">{STEPS[step - 1]?.title}</h2>
              <p className="text-sm text-muted-foreground">{STEPS[step - 1]?.desc}</p>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <Label>Nombre de tu negocio *</Label>
                <Input className="mt-1.5" placeholder="ej: Carlos Fitness Coach" value={form.businessName} onChange={e => update("businessName", e.target.value)} />
              </div>
              <div>
                <Label>Nicho principal *</Label>
                <Input className="mt-1.5" placeholder="ej: Pérdida de grasa para mujeres mayores de 35" value={form.niche} onChange={e => update("niche", e.target.value)} />
              </div>
              <div>
                <Label>Sub-nicho (opcional)</Label>
                <Input className="mt-1.5" placeholder="ej: Mujeres postparto que quieren recuperar su figura" value={form.subNiche} onChange={e => update("subNiche", e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <Label>Rango de edad de tu cliente ideal</Label>
                <Input className="mt-1.5" placeholder="ej: 30-45 años" value={form.targetAgeRange} onChange={e => update("targetAgeRange", e.target.value)} />
              </div>
              <div>
                <Label>Género</Label>
                <div className="flex gap-3 mt-1.5">
                  {[{ v: "all", l: "Todos" }, { v: "female", l: "Mujeres" }, { v: "male", l: "Hombres" }].map(g => (
                    <button key={g.v} onClick={() => update("targetGender", g.v)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${form.targetGender === g.v ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                      {g.l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Principales dolores de tu cliente ideal</Label>
                <Textarea className="mt-1.5" rows={3} placeholder="ej: No tiene tiempo para ir al gym, ha probado mil dietas sin resultado..." value={form.targetPains} onChange={e => update("targetPains", e.target.value)} />
              </div>
              <div>
                <Label>Deseos y aspiraciones</Label>
                <Textarea className="mt-1.5" rows={3} placeholder="ej: Quiere verse bien en el espejo, tener energía para sus hijos..." value={form.targetDesires} onChange={e => update("targetDesires", e.target.value)} />
              </div>
              <div>
                <Label>Objeciones más comunes</Label>
                <Textarea className="mt-1.5" rows={2} placeholder="ej: No tengo tiempo, es muy caro, ya lo he intentado antes..." value={form.targetObjections} onChange={e => update("targetObjections", e.target.value)} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <Label className="mb-3 block">Tono de comunicación</Label>
                <div className="grid grid-cols-1 gap-2">
                  {TONE_OPTIONS.map(t => (
                    <button key={t.value} onClick={() => update("communicationTone", t.value)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${form.communicationTone === t.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${form.communicationTone === t.value ? "border-primary" : "border-muted-foreground"}`}>
                        {form.communicationTone === t.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <span className="font-medium text-sm">{t.label}</span>
                        <span className="text-muted-foreground text-xs ml-2">{t.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Describe tu voz de marca con tus propias palabras</Label>
                <Textarea className="mt-1.5" rows={3} placeholder="ej: Hablo como un amigo que sabe mucho de fitness. Sin tecnicismos. Directo, sin rodeos..." value={form.brandVoice} onChange={e => update("brandVoice", e.target.value)} />
              </div>
              <div>
                <Label>Palabras o frases que NUNCA debes usar</Label>
                <Input className="mt-1.5" placeholder="ej: milagro, fácil, sin esfuerzo, garantizado..." value={form.wordsToAvoid} onChange={e => update("wordsToAvoid", e.target.value)} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <Label>¿Cuál es tu principal diferenciador?</Label>
                <Textarea className="mt-1.5" rows={3} placeholder="ej: Soy el único coach que combina entrenamiento de fuerza con psicología del comportamiento..." value={form.mainDifferentiator} onChange={e => update("mainDifferentiator", e.target.value)} />
              </div>
              <div>
                <Label>Casos de éxito reales</Label>
                <Textarea className="mt-1.5" rows={4} placeholder="ej: María, 38 años, perdió 12kg en 4 meses sin pasar hambre. Empezó con nosotros después de 3 años de fracasos..." value={form.successCases} onChange={e => update("successCases", e.target.value)} />
              </div>
              <div>
                <Label>Tu metodología o proceso único</Label>
                <Textarea className="mt-1.5" rows={3} placeholder="ej: Método RESET: 3 fases de 6 semanas. Fase 1 activación metabólica..." value={form.methodology} onChange={e => update("methodology", e.target.value)} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div>
                <Label className="mb-3 block">Estilo visual de tu marca</Label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {VISUAL_STYLES.map(s => (
                    <button key={s.value} onClick={() => update("visualStyle", s.value)}
                      className={`py-2.5 px-2 rounded-lg border text-xs font-medium transition-all ${form.visualStyle === s.value ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { field: "primaryColor", label: "Color primario" },
                  { field: "secondaryColor", label: "Color secundario" },
                  { field: "accentColor", label: "Color de acento" },
                ].map(c => (
                  <div key={c.field}>
                    <Label>{c.label}</Label>
                    <div className="flex items-center gap-2 mt-1.5">
                      <input type="color" value={form[c.field as keyof typeof form] as string}
                        onChange={e => update(c.field, e.target.value)}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent" />
                      <Input value={form[c.field as keyof typeof form] as string}
                        onChange={e => update(c.field, e.target.value)}
                        className="font-mono text-sm" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">Listo para generar tu Brand Brain</p>
                    <p className="text-xs text-muted-foreground">La IA procesará toda la información y creará tu prompt maestro personalizado. Esto puede tardar unos segundos.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8">
            <Button variant="outline" onClick={() => step > 1 ? setStep(s => s - 1) : setLocation("/dashboard")} disabled={isGenerating}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 1 ? "Cancelar" : "Anterior"}
            </Button>
            <Button onClick={handleNext}
              disabled={saveMutation.isPending || isGenerating || (step === 1 && (!form.businessName || !form.niche))}
              className="gradient-brand text-white border-0">
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando...</>
              ) : step === 5 ? (
                <><Sparkles className="w-4 h-4 mr-2" /> Generar Brand Brain</>
              ) : (
                <>Siguiente <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
