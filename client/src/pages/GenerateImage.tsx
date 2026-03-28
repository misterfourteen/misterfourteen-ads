import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  ImageIcon, Download, Loader2, AlertCircle, RefreshCw,
  Heart, Grid2X2, Grid3X3, Square, Layers, Film, Monitor,
  Check, Sparkles, ChevronDown, ChevronUp
} from "lucide-react";

const FORMATS = [
  { value: "feed", label: "Feed 1:1", desc: "Cuadrado", icon: Square, dims: "1080×1080", meta: "Facebook & Instagram Feed" },
  { value: "story", label: "Story 9:16", desc: "Vertical", icon: Film, dims: "1080×1920", meta: "Stories & Reels" },
  { value: "reel_cover", label: "Reel Cover", desc: "Portada", icon: Film, dims: "1080×1920", meta: "Portada de Reel" },
  { value: "portrait", label: "Portrait 4:5", desc: "Retrato", icon: Square, dims: "1080×1350", meta: "Feed optimizado" },
  { value: "banner", label: "Banner 1.91:1", desc: "Horizontal", icon: Monitor, dims: "1200×628", meta: "Facebook Feed & Audience Network" },
  { value: "carousel", label: "Carrusel 1:1", desc: "Tarjeta", icon: Layers, dims: "1080×1080", meta: "Anuncios carrusel" },
] as const;

const STYLES = [
  { value: "photorealistic", label: "Fotorrealista", desc: "Fotografía profesional", color: "from-blue-500/20 to-blue-600/20 border-blue-500/30" },
  { value: "illustration", label: "Ilustración", desc: "Arte digital vectorial", color: "from-purple-500/20 to-purple-600/20 border-purple-500/30" },
  { value: "minimalist", label: "Minimalista", desc: "Limpio y espacioso", color: "from-gray-500/20 to-gray-600/20 border-gray-500/30" },
  { value: "bold", label: "Bold", desc: "Colores fuertes, impacto", color: "from-orange-500/20 to-red-500/20 border-orange-500/30" },
  { value: "cinematic", label: "Cinematográfico", desc: "Dramático y cinematográfico", color: "from-amber-500/20 to-yellow-600/20 border-amber-500/30" },
] as const;

type Format = typeof FORMATS[number]["value"];
type Style = typeof STYLES[number]["value"];

interface GeneratedImageItem {
  id: number;
  imageUrl: string;
  format: string;
  style: string;
}

export default function GenerateImage() {
  const [, setLocation] = useLocation();
  const [adFormat, setAdFormat] = useState<Format>("feed");
  const [visualStyle, setVisualStyle] = useState<Style>("photorealistic");
  const [concept, setConcept] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImageItem | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: brain } = trpc.brandBrain.getMine.useQuery();
  const { data: history, refetch } = trpc.generate.history.useQuery({ type: "image" });
  const generateMutation = trpc.generate.image.useMutation();
  const favoriteMutation = trpc.generate.toggleFavorite.useMutation();

  const handleGenerate = async () => {
    if (!concept) { toast.error("Describe el concepto de la imagen"); return; }
    try {
      const result = await generateMutation.mutateAsync({
        adFormat,
        concept,
        visualStyle,
        quantity,
      });
      const fallback: GeneratedImageItem = { id: result.id, imageUrl: result.imageUrl ?? "", format: adFormat, style: visualStyle };
      const images: GeneratedImageItem[] = (result.images as GeneratedImageItem[] | undefined) ?? [fallback];
      setGeneratedImages(images);
      setSelectedImage(images[0]);
      refetch();
      toast.success(`¡${images.length} imagen${images.length > 1 ? "es" : ""} generada${images.length > 1 ? "s" : ""}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al generar";
      if (msg.includes("Brand Brain")) { setLocation("/onboarding"); }
      toast.error(msg);
    }
  };

  const handleDownload = async (url: string, format: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `ad-${format}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      toast.success("Imagen descargada");
    } catch {
      // Fallback
      const a = document.createElement("a");
      a.href = url;
      a.download = `ad-${format}-${Date.now()}.png`;
      a.target = "_blank";
      a.click();
    }
  };

  const handleFavorite = (id: number) => {
    favoriteMutation.mutate({ id, isFavorite: true });
    toast.success("Guardado en favoritos");
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

  const selectedFormat = FORMATS.find(f => f.value === adFormat);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-primary" /> Generador de Imágenes
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Creativos visuales con la identidad de <strong>{brain.businessName}</strong>
          </p>
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
        {/* Config panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-xl p-5 space-y-5">
            {/* Format selector */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block font-medium">Formato del anuncio</Label>
              <div className="grid grid-cols-2 gap-2">
                {FORMATS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setAdFormat(f.value)}
                    className={`text-left p-3 rounded-lg border transition-all ${adFormat === f.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <f.icon className={`w-3.5 h-3.5 ${adFormat === f.value ? "text-primary" : "text-muted-foreground"}`} />
                      <p className={`text-xs font-semibold ${adFormat === f.value ? "text-primary" : ""}`}>{f.label}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{f.dims}</p>
                    <p className="text-xs text-muted-foreground/70 truncate">{f.meta}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Style selector */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block font-medium">Estilo visual</Label>
              <div className="space-y-1.5">
                {STYLES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setVisualStyle(s.value)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border bg-gradient-to-r transition-all ${visualStyle === s.value ? s.color : "border-border hover:border-primary/40"}`}
                  >
                    <div>
                      <p className={`text-sm font-medium ${visualStyle === s.value ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.desc}</p>
                    </div>
                    {visualStyle === s.value && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Concept */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block font-medium">Concepto de la imagen *</Label>
              <Textarea
                rows={4}
                placeholder="ej: Persona fitness entrenando en un gym moderno, atmósfera motivacional, iluminación dramática, sin texto..."
                value={concept}
                onChange={e => setConcept(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">La IA aplicará tu paleta de colores y estilo de marca automáticamente.</p>
            </div>

            {/* Quantity */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block font-medium">Cantidad de variaciones</Label>
              <div className="flex gap-2">
                {[1, 2, 4].map(q => (
                  <button
                    key={q}
                    onClick={() => setQuantity(q)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${quantity === q ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                  >
                    {q === 1 ? <Square className="w-4 h-4" /> : q === 2 ? <Grid2X2 className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
                    {q}
                  </button>
                ))}
              </div>
              {quantity > 1 && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  ⚡ Se generarán {quantity} variaciones en paralelo ({quantity * 15}-{quantity * 20}s)
                </p>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !concept}
              className="w-full gradient-brand text-white border-0"
            >
              {generateMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando{quantity > 1 ? ` ${quantity} imágenes` : ""}...</>
                : <><Sparkles className="w-4 h-4 mr-2" /> Generar {quantity > 1 ? `${quantity} variaciones` : "imagen"}</>
              }
            </Button>
          </div>

          {/* Format info */}
          {selectedFormat && (
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Formato seleccionado</p>
              <p className="text-sm font-semibold">{selectedFormat.label} — {selectedFormat.dims}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedFormat.meta}</p>
            </div>
          )}
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Loading state */}
          {generateMutation.isPending && (
            <div className="glass-card rounded-xl p-12 text-center flex items-center justify-center min-h-[400px]">
              <div>
                <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">Generando {quantity > 1 ? `${quantity} variaciones` : "tu creativo"} con IA...</p>
                <p className="text-xs text-muted-foreground mt-1">Aplicando paleta de colores y estilo visual de {brain.businessName}</p>
                <div className="flex justify-center gap-1 mt-4">
                  {Array.from({ length: quantity }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!generateMutation.isPending && generatedImages.length === 0 && (
            <div className="glass-card rounded-xl p-12 text-center flex items-center justify-center min-h-[400px]">
              <div>
                <ImageIcon className="w-12 h-12 text-primary/20 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Tus creativos aparecerán aquí.</p>
                <p className="text-xs text-muted-foreground mt-1">Elige formato, estilo y describe el concepto.</p>
              </div>
            </div>
          )}

          {/* Results grid */}
          {!generateMutation.isPending && generatedImages.length > 0 && (
            <>
              {/* Selected image large view */}
              {selectedImage && (
                <div className="glass-card rounded-xl overflow-hidden">
                  <img
                    src={selectedImage.imageUrl}
                    alt="Creativo generado"
                    className="w-full object-cover max-h-[500px]"
                  />
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-primary/30 text-primary text-xs capitalize">
                        {FORMATS.find(f => f.value === selectedImage.format)?.label ?? selectedImage.format}
                      </Badge>
                      <Badge variant="outline" className="border-secondary/30 text-muted-foreground text-xs capitalize">
                        {STYLES.find(s => s.value === selectedImage.style)?.label ?? selectedImage.style}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleFavorite(selectedImage.id)}>
                        <Heart className="w-3 h-3 mr-1.5" /> Guardar
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleGenerate} disabled={generateMutation.isPending}>
                        <RefreshCw className="w-3 h-3 mr-1.5" /> Regenerar
                      </Button>
                      <Button size="sm" className="gradient-brand text-white border-0" onClick={() => handleDownload(selectedImage.imageUrl, selectedImage.format)}>
                        <Download className="w-3 h-3 mr-1.5" /> Descargar PNG
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Thumbnail grid for multiple images */}
              {generatedImages.length > 1 && (
                <div className="glass-card rounded-xl p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-3">
                    {generatedImages.length} variaciones generadas — haz clic para seleccionar
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {generatedImages.map((img, i) => (
                      <div
                        key={img.id}
                        onClick={() => setSelectedImage(img)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden aspect-square border-2 transition-all ${selectedImage?.id === img.id ? "border-primary" : "border-transparent hover:border-primary/40"}`}
                      >
                        <img src={img.imageUrl} alt={`Variación ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="flex gap-1">
                            <button
                              onClick={e => { e.stopPropagation(); handleFavorite(img.id); }}
                              className="p-1.5 bg-white/20 rounded-full hover:bg-white/40"
                            >
                              <Heart className="w-3 h-3 text-white" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDownload(img.imageUrl, img.format); }}
                              className="p-1.5 bg-white/20 rounded-full hover:bg-white/40"
                            >
                              <Download className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        </div>
                        {selectedImage?.id === img.id && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5">
                          <p className="text-white text-xs">V{i + 1}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* History */}
      {history && history.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full"
          >
            <h3 className="font-semibold text-sm">Imágenes recientes ({history.length})</h3>
            {showAdvanced ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showAdvanced && (
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-4">
              {history.slice(0, 16).map(item => item.imageUrl && (
                <div
                  key={item.id}
                  className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square"
                  onClick={() => {
                    setGeneratedImages([{ id: item.id, imageUrl: item.imageUrl!, format: item.adFormat ?? "feed", style: "photorealistic" }]);
                    setSelectedImage({ id: item.id, imageUrl: item.imageUrl!, format: item.adFormat ?? "feed", style: "photorealistic" });
                  }}
                >
                  <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button onClick={e => { e.stopPropagation(); handleDownload(item.imageUrl!, item.adFormat ?? "feed"); }}
                      className="p-1 bg-white/20 rounded-full">
                      <Download className="w-3 h-3 text-white" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleFavorite(item.id); }}
                      className="p-1 bg-white/20 rounded-full">
                      <Heart className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  {item.isFavorite && (
                    <div className="absolute top-1 right-1">
                      <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
