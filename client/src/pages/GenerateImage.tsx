import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { ImageIcon, Download, Loader2, AlertCircle, RefreshCw, Heart } from "lucide-react";

const FORMATS = [
  { value: "feed", label: "Feed (1:1)", desc: "Cuadrado para el feed" },
  { value: "story", label: "Story (9:16)", desc: "Vertical para stories" },
  { value: "reel_cover", label: "Reel Cover (9:16)", desc: "Portada de reel" },
] as const;

export default function GenerateImage() {
  const [, setLocation] = useLocation();
  const [adFormat, setAdFormat] = useState<"feed" | "story" | "reel_cover">("feed");
  const [concept, setConcept] = useState("");
  const [generatedImage, setGeneratedImage] = useState<{ url: string; id: number } | null>(null);

  const { data: brain } = trpc.brandBrain.getMine.useQuery();
  const { data: history, refetch } = trpc.generate.history.useQuery({ type: "image" });
  const generateMutation = trpc.generate.image.useMutation();
  const favoriteMutation = trpc.generate.toggleFavorite.useMutation();

  const handleGenerate = async () => {
    if (!concept) { toast.error("Describe el concepto de la imagen"); return; }
    try {
      const result = await generateMutation.mutateAsync({ adFormat, concept });
      setGeneratedImage({ url: result.imageUrl ?? "", id: result.id });
      refetch();
      toast.success("¡Imagen generada!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al generar";
      if (msg.includes("Brand Brain")) { setLocation("/onboarding"); }
      toast.error(msg);
    }
  };

  const handleDownload = async (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `ad-image-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  if (!brain?.isComplete) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="glass-card rounded-2xl p-10 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-display font-bold mb-3">Brand Brain requerido</h2>
          <p className="text-muted-foreground mb-6">Configura tu Brand Brain para generar imágenes con tu identidad visual.</p>
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
            <ImageIcon className="w-6 h-6 text-primary" /> Generador de Imágenes
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Creativos visuales con la identidad de <strong>{brain.businessName}</strong></p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[brain.primaryColor, brain.secondaryColor, brain.accentColor].map((c, i) => (
              <div key={i} className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: c ?? "#000" }} />
            ))}
          </div>
          <Badge variant="outline" className="border-green-500/30 text-green-400">Paleta activa</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 glass-card rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sm">Configuración</h3>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Formato del anuncio</Label>
            <div className="space-y-2">
              {FORMATS.map(f => (
                <button key={f.value} onClick={() => setAdFormat(f.value)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${adFormat === f.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                  <p className={`text-sm font-medium ${adFormat === f.value ? "text-primary" : ""}`}>{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Concepto de la imagen *</Label>
            <Textarea rows={4} placeholder="ej: Persona fitness entrenando en un gym moderno, atmósfera motivacional, iluminación dramática, sin texto..." value={concept} onChange={e => setConcept(e.target.value)} className="text-sm" />
            <p className="text-xs text-muted-foreground mt-1">La IA aplicará automáticamente tu paleta de colores y estilo visual.</p>
          </div>
          <Button onClick={handleGenerate} disabled={generateMutation.isPending || !concept} className="w-full gradient-brand text-white border-0">
            {generateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando (10-20s)...</> : <><ImageIcon className="w-4 h-4 mr-2" /> Generar imagen</>}
          </Button>
        </div>

        <div className="lg:col-span-3">
          {!generatedImage && !generateMutation.isPending && (
            <div className="glass-card rounded-xl p-10 text-center h-full flex items-center justify-center">
              <div>
                <ImageIcon className="w-12 h-12 text-primary/20 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Tu creativo aparecerá aquí.</p>
                <p className="text-xs text-muted-foreground mt-1">La generación tarda entre 10 y 20 segundos.</p>
              </div>
            </div>
          )}
          {generateMutation.isPending && (
            <div className="glass-card rounded-xl p-10 text-center h-full flex items-center justify-center">
              <div>
                <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <p className="text-muted-foreground text-sm">Generando tu creativo con IA...</p>
                <p className="text-xs text-muted-foreground mt-1">Aplicando tu paleta de colores y estilo visual</p>
              </div>
            </div>
          )}
          {generatedImage && (
            <div className="glass-card rounded-xl overflow-hidden">
              <img src={generatedImage.url} alt="Creativo generado" className="w-full object-cover" />
              <div className="p-4 flex items-center justify-between">
                <Badge variant="outline" className="border-primary/30 text-primary text-xs capitalize">{adFormat.replace("_", " ")}</Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => favoriteMutation.mutate({ id: generatedImage.id, isFavorite: true })}>
                    <Heart className="w-3 h-3 mr-1.5" /> Guardar
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generateMutation.isPending}>
                    <RefreshCw className="w-3 h-3 mr-1.5" /> Regenerar
                  </Button>
                  <Button size="sm" className="gradient-brand text-white border-0" onClick={() => handleDownload(generatedImage.url)}>
                    <Download className="w-3 h-3 mr-1.5" /> Descargar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {history && history.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Imágenes recientes</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {history.slice(0, 12).map(item => item.imageUrl && (
              <div key={item.id} className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square" onClick={() => setGeneratedImage({ url: item.imageUrl!, id: item.id })}>
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Download className="w-4 h-4 text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
