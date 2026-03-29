import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Layout, Sparkles, Loader2, AlertCircle, Copy, ExternalLink,
  ChevronDown, ChevronUp, Check, Eye, Code
} from "lucide-react";
import { Streamdown } from "streamdown";

const LANDING_TYPES = [
  { value: "lead_capture", label: "Captación de leads", desc: "Formulario + beneficios", icon: "🎯" },
  { value: "sales", label: "Página de ventas", desc: "VSL + oferta + CTA", icon: "💰" },
  { value: "webinar", label: "Registro webinar", desc: "Evento + formulario", icon: "🎥" },
  { value: "challenge", label: "Reto gratuito", desc: "Captación + comunidad", icon: "🔥" },
  { value: "consultation", label: "Consultoría gratuita", desc: "Agenda una llamada", icon: "📞" },
] as const;

const STYLES = [
  { value: "modern_dark", label: "Moderno Dark", desc: "Oscuro, premium, fitness" },
  { value: "clean_white", label: "Clean White", desc: "Minimalista, profesional" },
  { value: "bold_gradient", label: "Bold Gradient", desc: "Impactante, energético" },
  { value: "trust_blue", label: "Trust Blue", desc: "Confianza, autoridad" },
] as const;

type LandingType = typeof LANDING_TYPES[number]["value"];
type LandingStyle = typeof STYLES[number]["value"];

export default function LandingBuilder() {
  const [, setLocation] = useLocation();
  const [landingType, setLandingType] = useState<LandingType>("lead_capture");
  const [landingStyle, setLandingStyle] = useState<LandingStyle>("modern_dark");
  const [productName, setProductName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [mainBenefit, setMainBenefit] = useState("");
  const [offer, setOffer] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: brain } = trpc.brandBrain.getMine.useQuery();
  const generateMutation = trpc.generate.landing.useMutation();

  const handleGenerate = async () => {
    if (!productName || !mainBenefit) { toast.error("Rellena el producto y el beneficio principal"); return; }
    try {
      const result = await generateMutation.mutateAsync({
        landingType,
        landingStyle,
        productName,
        targetAudience,
        mainBenefit,
        offer,
      });
      setGeneratedCode(result.html);
      toast.success("¡Landing page generada!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al generar";
      toast.error(msg);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success("Código HTML copiado");
  };

  const downloadHtml = () => {
    const blob = new Blob([generatedCode], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `landing-${productName.replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML descargado");
  };

  if (!brain?.isComplete) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <div className="glass-card rounded-2xl p-10 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold mb-3">Brand Brain requerido</h2>
          <p className="text-muted-foreground mb-6">Configura tu Brand Brain para generar landing pages con tu voz de marca.</p>
          <Button onClick={() => setLocation("/onboarding")} className="gradient-brand text-white border-0">Configurar Brand Brain</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 py-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Layout className="w-6 h-6 text-primary" /> Landing Page Builder
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Genera landing pages HTML listas para publicar con la voz de <strong>{brain.businessName}</strong></p>
        </div>
        <Badge variant="outline" className="border-green-500/30 text-green-400">Brand Brain activo</Badge>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Config */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sm">Configuración</h3>

          {/* Tipo */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Tipo de landing</Label>
            <div className="space-y-1.5">
              {LANDING_TYPES.map(t => (
                <button key={t.value} onClick={() => setLandingType(t.value)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${landingType === t.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                  <span className="text-lg">{t.icon}</span>
                  <div>
                    <p className={`text-xs font-semibold ${landingType === t.value ? "text-primary" : ""}`}>{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                  {landingType === t.value && <Check className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Estilo */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Estilo visual</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {STYLES.map(s => (
                <button key={s.value} onClick={() => setLandingStyle(s.value)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-all ${landingStyle === s.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  <p className="font-semibold">{s.label}</p>
                  <p className="text-muted-foreground">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Datos */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Nombre del producto/servicio *</Label>
            <Input value={productName} onChange={e => setProductName(e.target.value)} placeholder="ej: Programa de Transformación 12 Semanas" className="text-sm h-9" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Beneficio principal *</Label>
            <Textarea rows={2} value={mainBenefit} onChange={e => setMainBenefit(e.target.value)} placeholder="ej: Pierde 10kg en 12 semanas sin pasar hambre" className="text-sm resize-none" />
          </div>

          {/* Avanzado */}
          <button onClick={() => setShowAdvanced(v => !v)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Opciones avanzadas
          </button>
          {showAdvanced && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Público objetivo</Label>
                <Input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="ej: Mujeres 30-45 años, madres ocupadas" className="text-sm h-9" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Oferta / precio</Label>
                <Input value={offer} onChange={e => setOffer(e.target.value)} placeholder="ej: 297€ · Pago único · Garantía 30 días" className="text-sm h-9" />
              </div>
            </div>
          )}

          <Button onClick={handleGenerate} disabled={generateMutation.isPending || !productName || !mainBenefit} className="w-full gradient-brand text-white border-0">
            {generateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generar Landing Page</>}
          </Button>
        </div>

        {/* Preview / Code */}
        <div className="lg:col-span-3 space-y-3">
          {!generatedCode && !generateMutation.isPending && (
            <div className="glass-card rounded-xl p-12 text-center flex items-center justify-center min-h-[400px]">
              <div>
                <Layout className="w-12 h-12 text-primary/20 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Tu landing page aparecerá aquí.</p>
                <p className="text-xs text-muted-foreground mt-1">Configura el tipo, estilo y datos del producto.</p>
              </div>
            </div>
          )}
          {generateMutation.isPending && (
            <div className="glass-card rounded-xl p-12 text-center flex items-center justify-center min-h-[400px]">
              <div>
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Generando tu landing page con IA...</p>
                <p className="text-xs text-muted-foreground mt-1">Aplicando Brand Brain de {brain.businessName}</p>
              </div>
            </div>
          )}
          {generatedCode && !generateMutation.isPending && (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-border/50">
                <div className="flex gap-1">
                  <button onClick={() => setViewMode("preview")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === "preview" ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
                    <Eye className="w-3 h-3" /> Preview
                  </button>
                  <button onClick={() => setViewMode("code")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === "code" ? "bg-primary/10 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground"}`}>
                    <Code className="w-3 h-3" /> Código HTML
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyCode} className="text-xs h-7">
                    <Copy className="w-3 h-3 mr-1" /> Copiar
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadHtml} className="text-xs h-7">
                    <ExternalLink className="w-3 h-3 mr-1" /> Descargar HTML
                  </Button>
                </div>
              </div>
              {viewMode === "preview" ? (
                <iframe
                  srcDoc={generatedCode}
                  className="w-full h-[600px] border-0"
                  title="Landing Page Preview"
                  sandbox="allow-scripts"
                />
              ) : (
                <div className="p-4 max-h-[600px] overflow-auto">
                  <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-all">{generatedCode}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
