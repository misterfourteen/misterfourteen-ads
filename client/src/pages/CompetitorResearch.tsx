import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search, ExternalLink, Sparkles, Loader2, Copy, TrendingUp,
  Eye, Target, Lightbulb, ChevronDown, ChevronUp, AlertCircle
} from "lucide-react";
import { Streamdown } from "streamdown";

const NICHES = [
  "Entrenamiento personal online",
  "Nutrición y dietética",
  "Pérdida de peso",
  "Transformación física",
  "Yoga y mindfulness",
  "Crossfit y funcional",
  "Coaching de vida",
  "Suplementación deportiva",
] as const;

const COUNTRIES = [
  { value: "ES", label: "España" },
  { value: "MX", label: "México" },
  { value: "AR", label: "Argentina" },
  { value: "CO", label: "Colombia" },
  { value: "US", label: "Estados Unidos" },
] as const;

interface AdInsight {
  hook: string;
  format: string;
  objective: string;
  angle: string;
  cta: string;
  strength: string;
}

export default function CompetitorResearch() {
  const [competitorName, setCompetitorName] = useState("");
  const [niche, setNiche] = useState("");
  const [country, setCountry] = useState("ES");
  const [analysis, setAnalysis] = useState("");
  const [insights, setInsights] = useState<AdInsight[]>([]);
  const [adsLibraryUrl, setAdsLibraryUrl] = useState("");
  const [showTips, setShowTips] = useState(true);

  const { data: brain } = trpc.brandBrain.getMine.useQuery();
  const analyzeMutation = trpc.generate.analyzeCompetitor.useMutation();

  const buildAdsLibraryUrl = () => {
    const base = "https://www.facebook.com/ads/library/";
    const params = new URLSearchParams({
      active_status: "active",
      ad_type: "all",
      country: country,
      q: competitorName || niche,
      search_type: "keyword_unordered",
    });
    return `${base}?${params.toString()}`;
  };

  const openAdsLibrary = () => {
    const url = buildAdsLibraryUrl();
    setAdsLibraryUrl(url);
    window.open(url, "_blank");
    toast.info("Abriendo Meta Ads Library...");
  };

  const handleAnalyze = async () => {
    if (!competitorName && !niche) { toast.error("Introduce un competidor o nicho"); return; }
    try {
      const result = await analyzeMutation.mutateAsync({
        competitorName,
        niche: niche || brain?.niche || "fitness online",
      });
      const rawResult = result as Record<string, unknown>;
      setAnalysis(typeof rawResult.analysis === "string" ? rawResult.analysis : JSON.stringify(rawResult, null, 2));
      const rawInsights = rawResult.insights;
      setInsights(Array.isArray(rawInsights) ? (rawInsights as AdInsight[]) : []);
      toast.success("Análisis completado");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al analizar";
      toast.error(msg);
    }
  };

  const copyAnalysis = () => {
    navigator.clipboard.writeText(analysis);
    toast.success("Análisis copiado");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 py-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Search className="w-6 h-6 text-primary" /> Investigación de Competencia
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Analiza los anuncios de tu competencia en Meta Ads Library</p>
        </div>
        <Button variant="outline" onClick={openAdsLibrary} className="text-xs border-primary/30 text-primary hover:bg-primary/10">
          <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Abrir Ads Library
        </Button>
      </div>

      {/* Tips */}
      <div className="glass-card rounded-xl overflow-hidden">
        <button onClick={() => setShowTips(v => !v)} className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            <span className="font-semibold text-sm">Cómo usar esta herramienta</span>
          </div>
          {showTips ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showTips && (
          <div className="border-t border-border/50 p-4 grid sm:grid-cols-3 gap-4">
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">1</div>
              <div>
                <p className="text-xs font-semibold mb-0.5">Busca en Ads Library</p>
                <p className="text-xs text-muted-foreground">Abre la librería de anuncios de Meta y busca a tu competidor por nombre de página o palabra clave.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">2</div>
              <div>
                <p className="text-xs font-semibold mb-0.5">Analiza con IA</p>
                <p className="text-xs text-muted-foreground">Introduce el nombre del competidor y deja que la IA genere un análisis estratégico de sus patrones publicitarios.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">3</div>
              <div>
                <p className="text-xs font-semibold mb-0.5">Aplica los insights</p>
                <p className="text-xs text-muted-foreground">Usa los hooks, ángulos y CTAs identificados para crear tus propios anuncios diferenciados.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Config */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-sm">Configuración del análisis</h3>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Nombre del competidor / página</Label>
            <Input value={competitorName} onChange={e => setCompetitorName(e.target.value)}
              placeholder="ej: Carlos Fitness, Nutrición Activa..." className="text-sm h-9" />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Nicho</Label>
            <div className="flex flex-wrap gap-1.5">
              {NICHES.map(n => (
                <button key={n} onClick={() => setNiche(niche === n ? "" : n)}
                  className={`px-2.5 py-1 rounded-full border text-xs transition-all ${niche === n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  {n}
                </button>
              ))}
            </div>
            <Input value={niche} onChange={e => setNiche(e.target.value)} placeholder="O escribe tu nicho..." className="text-sm h-9 mt-2" />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">País</Label>
            <div className="flex gap-1.5 flex-wrap">
              {COUNTRIES.map(c => (
                <button key={c.value} onClick={() => setCountry(c.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${country === c.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={openAdsLibrary} variant="outline" className="flex-1 text-xs border-primary/30 text-primary hover:bg-primary/10">
              <ExternalLink className="w-3.5 h-3.5 mr-1" /> Ver en Meta
            </Button>
            <Button onClick={handleAnalyze} disabled={analyzeMutation.isPending || (!competitorName && !niche)} className="flex-1 gradient-brand text-white border-0 text-xs">
              {analyzeMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Analizando...</> : <><Sparkles className="w-3.5 h-3.5 mr-1" /> Analizar con IA</>}
            </Button>
          </div>

          {adsLibraryUrl && (
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">URL generada para Ads Library:</p>
              <a href={adsLibraryUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all flex items-center gap-1">
                <ExternalLink className="w-3 h-3 shrink-0" />
                {adsLibraryUrl.substring(0, 60)}...
              </a>
            </div>
          )}
        </div>

        {/* Output */}
        <div className="lg:col-span-3 space-y-3">
          {!analysis && !analyzeMutation.isPending && (
            <div className="glass-card rounded-xl p-12 text-center flex items-center justify-center min-h-[400px]">
              <div>
                <TrendingUp className="w-12 h-12 text-primary/20 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">El análisis de competencia aparecerá aquí.</p>
                <p className="text-xs text-muted-foreground mt-1">Introduce un competidor o nicho y haz clic en "Analizar con IA".</p>
                <Button onClick={openAdsLibrary} variant="outline" className="mt-4 text-xs border-primary/30 text-primary hover:bg-primary/10">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Explorar Ads Library ahora
                </Button>
              </div>
            </div>
          )}
          {analyzeMutation.isPending && (
            <div className="glass-card rounded-xl p-12 text-center flex items-center justify-center min-h-[400px]">
              <div>
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Analizando patrones publicitarios...</p>
                <p className="text-xs text-muted-foreground mt-1">Identificando hooks, ángulos y estrategias</p>
              </div>
            </div>
          )}
          {analysis && !analyzeMutation.isPending && (
            <>
              {/* Insights cards */}
              {insights.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {insights.map((insight, i) => (
                    <div key={i} className="glass-card rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary">{insight.format}</Badge>
                        <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">{insight.objective}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Hook identificado</p>
                        <p className="text-sm font-medium">"{insight.hook}"</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Ángulo</p>
                          <p className="text-xs">{insight.angle}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">CTA</p>
                          <p className="text-xs">{insight.cta}</p>
                        </div>
                      </div>
                      <div className="pt-1 border-t border-border/30">
                        <p className="text-xs text-green-400 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> {insight.strength}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Full analysis */}
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">Análisis estratégico completo</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={copyAnalysis} className="text-xs h-7">
                    <Copy className="w-3 h-3 mr-1" /> Copiar
                  </Button>
                </div>
                <div className="p-5 prose prose-sm prose-invert max-w-none">
                  <Streamdown>{analysis}</Streamdown>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
