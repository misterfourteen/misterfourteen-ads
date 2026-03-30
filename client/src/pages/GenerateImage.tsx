import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  ImageIcon, Download, Loader2, AlertCircle, RefreshCw,
  Heart, Square, Layers, Film, Monitor, Check, Sparkles,
  ChevronDown, ChevronUp, Plus, Minus, Wand2, Copy, History
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
  { value: "free", label: "Libre", desc: "Solo con el concepto, sin restricciones", color: "from-primary/20 to-primary/30 border-primary/50" },
  { value: "photorealistic", label: "Fotorrealista", desc: "Fotografía profesional", color: "from-blue-500/20 to-blue-600/20 border-blue-500/30" },
  { value: "illustration", label: "Ilustración", desc: "Arte digital vectorial", color: "from-purple-500/20 to-purple-600/20 border-purple-500/30" },
  { value: "minimalist", label: "Minimalista", desc: "Limpio y espacioso", color: "from-gray-500/20 to-gray-600/20 border-gray-500/30" },
  { value: "bold", label: "Bold", desc: "Colores fuertes, impacto máximo", color: "from-orange-500/20 to-red-500/20 border-orange-500/30" },
  { value: "cinematic", label: "Cinematográfico", desc: "Dramático y cinematográfico", color: "from-amber-500/20 to-yellow-600/20 border-amber-500/30" },
] as const;

const DOWNLOAD_FORMATS = [
  { value: "png", label: "PNG", mime: "image/png" },
  { value: "jpg", label: "JPG", mime: "image/jpeg" },
  { value: "webp", label: "WebP", mime: "image/webp" },
] as const;

type Format = typeof FORMATS[number]["value"];
type Style = typeof STYLES[number]["value"];

interface GeneratedImageItem {
  id: number;
  imageUrl: string;
  format: string;
  style: string;
  concept?: string;
}

export default function GenerateImage() {
  const [, setLocation] = useLocation();
  const [adFormat, setAdFormat] = useState<Format>("feed");
  const [visualStyle, setVisualStyle] = useState<Style>("free");
  const [concept, setConcept] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [usePalette, setUsePalette] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImageItem | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"png" | "jpg" | "webp">("png");
  const [adaptFormatTarget, setAdaptFormatTarget] = useState<Format | null>(null);

  const { data: brain } = trpc.brandBrain.getMine.useQuery();
  const { data: history, refetch } = trpc.generate.history.useQuery({ type: "image" });
  const generateMutation = trpc.generate.image.useMutation();
  const favoriteMutation = trpc.generate.toggleFavorite.useMutation({
    onSuccess: () => { refetch(); toast.success("Guardado en favoritos"); },
  });

  const handleGenerate = async (overrideConcept?: string, overrideFormat?: string) => {
    const usedConcept = overrideConcept ?? concept;
    const usedFormat = (overrideFormat ?? adFormat) as Format;
    if (!usedConcept) { toast.error("Describe el concepto de la imagen"); return; }
    try {
      const result = await generateMutation.mutateAsync({
        adFormat: usedFormat,
        concept: usedConcept,
        visualStyle,
        quantity,
      });
      const fallback: GeneratedImageItem = { id: result.id, imageUrl: result.imageUrl ?? "", format: usedFormat, style: visualStyle, concept: usedConcept };
      const images: GeneratedImageItem[] = (result.images as GeneratedImageItem[] | undefined)?.map(img => ({ ...img, concept: usedConcept })) ?? [fallback];
      setGeneratedImages(images);
      setSelectedImage(images[0]);
      setAdaptFormatTarget(null);
      refetch();
      toast.success(`¡${images.length} imagen${images.length > 1 ? "es" : ""} generada${images.length > 1 ? "s" : ""}!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al generar";
      if (msg.includes("Brand Brain")) { setLocation("/onboarding"); }
      toast.error(msg);
    }
  };

  const handleAdaptFormat = (targetFormat: Format) => {
    if (!selectedImage?.concept && !concept) { toast.error("No hay concepto para adaptar"); return; }
    setAdFormat(targetFormat);
    handleGenerate(selectedImage?.concept ?? concept, targetFormat);
    toast.info(`Adaptando al formato ${FORMATS.find(f => f.value === targetFormat)?.label}...`);
  };

  const handleDownload = async (url: string, format: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `ad-${format}-${Date.now()}.${downloadFormat}`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      toast.success(`Imagen descargada en ${downloadFormat.toUpperCase()}`);
    } catch {
      const a = document.createElement("a");
      a.href = url;
      a.download = `ad-${format}-${Date.now()}.${downloadFormat}`;
      a.target = "_blank";
      a.click();
    }
  };

  if (!brain?.isComplete) {
    return (
      <div className="max-w-2xl mx-auto py-6">
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
    <div className="max-w-6xl mx-auto space-y-5 py-2">
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

      <div className="grid lg:grid-cols-5 gap-5">
        {/* ─── Config panel ─── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-xl p-5 space-y-5">

            {/* Format selector */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block font-medium">Formato del anuncio</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {FORMATS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setAdFormat(f.value)}
                    className={`text-left p-2.5 rounded-lg border transition-all ${adFormat === f.value ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <f.icon className={`w-3 h-3 ${adFormat === f.value ? "text-primary" : "text-muted-foreground"}`} />
                      <p className={`text-xs font-semibold ${adFormat === f.value ? "text-primary" : ""}`}>{f.label}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{f.dims}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Style selector */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block font-medium">Estilo visual</Label>
              <div className="space-y-1">
                {STYLES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setVisualStyle(s.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border bg-gradient-to-r transition-all ${visualStyle === s.value ? s.color : "border-border hover:border-primary/40"}`}
                  >
                    <div>
                      <p className={`text-xs font-semibold ${visualStyle === s.value ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                      <p className="text-xs text-muted-foreground/80">{s.desc}</p>
                    </div>
                    {visualStyle === s.value && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Concept */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block font-medium">Concepto de la imagen *</Label>
              <Textarea
                rows={4}
                placeholder="ej: Persona fitness entrenando en un gym moderno, atmósfera motivacional, iluminación dramática..."
                value={concept}
                onChange={e => setConcept(e.target.value)}
                className="text-sm resize-none"
              />
            </div>

            {/* Palette toggle */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-border bg-secondary/20">
              <div>
                <p className="text-xs font-medium">Aplicar paleta de marca</p>
                <p className="text-xs text-muted-foreground">Usa los colores de tu Brand Brain</p>
              </div>
              <button
                onClick={() => setUsePalette(v => !v)}
                className={`w-10 h-5 rounded-full transition-all relative ${usePalette ? "bg-primary" : "bg-secondary"}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${usePalette ? "left-5.5 translate-x-0.5" : "left-0.5"}`} />
              </button>
            </div>

            {/* Quantity */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block font-medium">Cantidad de variaciones</Label>
              <div className="flex items-center gap-2">
                <button onClick={() => setQuantity(v => Math.max(1, v - 1))} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <Input
                  type="number" min={1} max={8} value={quantity}
                  onChange={e => setQuantity(Math.max(1, Math.min(8, parseInt(e.target.value) || 1)))}
                  className="w-14 text-center h-8 text-sm bg-secondary/50"
                />
                <button onClick={() => setQuantity(v => Math.min(8, v + 1))} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <div className="flex gap-1">
                  {[1, 2, 4].map(q => (
                    <button key={q} onClick={() => setQuantity(q)}
                      className={`w-7 h-7 rounded text-xs border transition-all ${quantity === q ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              {quantity > 1 && <p className="text-xs text-muted-foreground mt-1">⚡ {quantity} variaciones en paralelo (~{quantity * 15}s)</p>}
            </div>

            {/* Download format */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block font-medium">Formato de descarga</Label>
              <div className="flex gap-2">
                {DOWNLOAD_FORMATS.map(df => (
                  <button key={df.value} onClick={() => setDownloadFormat(df.value)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${downloadFormat === df.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {df.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => handleGenerate()}
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
            <div className="glass-card rounded-xl p-3">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Formato seleccionado</p>
              <p className="text-sm font-semibold">{selectedFormat.label} — {selectedFormat.dims}</p>
              <p className="text-xs text-muted-foreground">{selectedFormat.meta}</p>
            </div>
          )}
        </div>

        {/* ─── Preview panel ─── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Loading state */}
          {generateMutation.isPending && (
            <div className="glass-card rounded-xl p-12 text-center flex items-center justify-center min-h-[400px]">
              <div>
                <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">Generando {quantity > 1 ? `${quantity} variaciones` : "tu creativo"} con IA...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {usePalette ? `Aplicando paleta de ${brain.businessName}` : "Estilo libre — máxima variedad"}
                </p>
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

          {/* Results */}
          {!generateMutation.isPending && generatedImages.length > 0 && (
            <>
              {/* Selected image large view */}
              {selectedImage && (
                <div className="glass-card rounded-xl overflow-hidden">
                  <img
                    src={selectedImage.imageUrl}
                    alt="Creativo generado"
                    className="w-full object-cover max-h-[480px]"
                  />
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="border-primary/30 text-primary text-xs capitalize">
                          {FORMATS.find(f => f.value === selectedImage.format)?.label ?? selectedImage.format}
                        </Badge>
                        <Badge variant="outline" className="border-secondary/30 text-muted-foreground text-xs capitalize">
                          {STYLES.find(s => s.value === selectedImage.style)?.label ?? selectedImage.style}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => favoriteMutation.mutate({ id: selectedImage.id, isFavorite: true })} className="text-xs h-7">
                          <Heart className="w-3 h-3 mr-1" /> Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleGenerate(selectedImage.concept ?? concept)} disabled={generateMutation.isPending} className="text-xs h-7">
                          <RefreshCw className="w-3 h-3 mr-1" /> Regenerar
                        </Button>
                        <Button size="sm" className="gradient-brand text-white border-0 text-xs h-7" onClick={() => handleDownload(selectedImage.imageUrl, selectedImage.format)}>
                          <Download className="w-3 h-3 mr-1" /> {downloadFormat.toUpperCase()}
                        </Button>
                      </div>
                    </div>

                    {/* Adapt format — mismo concepto, otro formato */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                        <Wand2 className="w-3 h-3" /> Adaptar al formato (mismo concepto, sin reescribir el prompt)
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {FORMATS.filter(f => f.value !== selectedImage.format).map(f => (
                          <button
                            key={f.value}
                            onClick={() => handleAdaptFormat(f.value)}
                            disabled={generateMutation.isPending}
                            className="px-2.5 py-1 rounded-lg border border-border text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-all disabled:opacity-50"
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Copy prompt */}
                    {selectedImage.concept && (
                      <button
                        onClick={() => { setConcept(selectedImage.concept ?? ""); toast.success("Concepto copiado al formulario"); }}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="w-3 h-3" /> Reutilizar este concepto
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Thumbnail grid for multiple images */}
              {generatedImages.length > 1 && (
                <div className="glass-card rounded-xl p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-3">
                    {generatedImages.length} variaciones — haz clic para seleccionar
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
                            <button onClick={e => { e.stopPropagation(); favoriteMutation.mutate({ id: img.id, isFavorite: true }); }} className="p-1.5 bg-white/20 rounded-full hover:bg-white/40">
                              <Heart className="w-3 h-3 text-white" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); handleDownload(img.imageUrl, img.format); }} className="p-1.5 bg-white/20 rounded-full hover:bg-white/40">
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

      {/* ─── Historial visual ─── */}
      {history && history.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Imágenes recientes</span>
              <Badge variant="outline" className="text-xs border-border">{history.filter(i => i.imageUrl).length}</Badge>
            </div>
            {showHistory ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showHistory && (
            <div className="border-t border-border/50 p-4">
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                {history.filter(item => item.imageUrl).slice(0, 24).map(item => (
                  <div
                    key={item.id}
                    className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square"
                    onClick={() => {
                      const img = { id: item.id, imageUrl: item.imageUrl!, format: item.adFormat ?? "feed", style: "photorealistic", concept: item.imagePrompt ?? "" };
                      setGeneratedImages([img]);
                      setSelectedImage(img);
                      if (item.imagePrompt) setConcept(item.imagePrompt);
                    }}
                  >
                    <img src={item.imageUrl!} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button onClick={e => { e.stopPropagation(); handleDownload(item.imageUrl!, item.adFormat ?? "feed"); }}
                        className="p-1 bg-white/20 rounded-full hover:bg-white/40">
                        <Download className="w-3 h-3 text-white" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); favoriteMutation.mutate({ id: item.id, isFavorite: true }); }}
                        className="p-1 bg-white/20 rounded-full hover:bg-white/40">
                        <Heart className="w-3 h-3 text-white" />
                      </button>
                    </div>
                    {item.isFavorite && (
                      <div className="absolute top-1 right-1">
                        <Heart className="w-3 h-3 text-red-400 fill-red-400" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                      <p className="text-white text-[10px] truncate">{item.adFormat ?? "feed"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
