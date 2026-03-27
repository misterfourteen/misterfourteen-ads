import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Target, Users, Zap, Gift, BookOpen, Dumbbell,
  Apple, TrendingUp, ArrowRight, Sparkles, Loader2, CheckCircle2
} from "lucide-react";

interface Template {
  id: string;
  icon: React.ReactNode;
  category: string;
  title: string;
  description: string;
  objective: string;
  adFormat: string;
  tags: string[];
  color: string;
}

const TEMPLATES: Template[] = [
  {
    id: "lead_magnet_fitness",
    icon: <Target className="w-5 h-5" />,
    category: "Captación",
    title: "Lead Magnet Fitness",
    description: "Atrae leads con una guía gratuita, reto o recurso de valor para tu audiencia fitness.",
    objective: "Captación de leads con recurso gratuito (guía, reto o masterclass)",
    adFormat: "feed",
    tags: ["Leads", "Gratis", "Fitness"],
    color: "border-blue-500/30 hover:border-blue-500/60",
  },
  {
    id: "venta_programa",
    icon: <TrendingUp className="w-5 h-5" />,
    category: "Ventas",
    title: "Venta de Programa Online",
    description: "Convierte directamente con un anuncio de venta para tu programa de entrenamiento o nutrición.",
    objective: "Venta directa de programa de entrenamiento o nutrición online con precio y resultados",
    adFormat: "feed",
    tags: ["Ventas", "Programa", "Conversión"],
    color: "border-green-500/30 hover:border-green-500/60",
  },
  {
    id: "webinar_masterclass",
    icon: <BookOpen className="w-5 h-5" />,
    category: "Evento",
    title: "Webinar o Masterclass",
    description: "Llena tu próximo webinar o clase gratuita con una audiencia cualificada del sector fitness.",
    objective: "Registro a webinar o masterclass gratuita sobre entrenamiento o nutrición",
    adFormat: "feed",
    tags: ["Webinar", "Registro", "Evento"],
    color: "border-purple-500/30 hover:border-purple-500/60",
  },
  {
    id: "prueba_gratuita",
    icon: <Gift className="w-5 h-5" />,
    category: "Trial",
    title: "Prueba Gratuita 7 Días",
    description: "Ofrece una semana de acceso gratuito para que el cliente experimente tu metodología sin riesgo.",
    objective: "Registro a prueba gratuita de 7 días del programa sin tarjeta de crédito",
    adFormat: "story",
    tags: ["Trial", "Sin riesgo", "Conversión"],
    color: "border-yellow-500/30 hover:border-yellow-500/60",
  },
  {
    id: "transformacion_resultados",
    icon: <Users className="w-5 h-5" />,
    category: "Prueba social",
    title: "Transformación y Resultados",
    description: "Muestra antes/después y testimonios reales para generar confianza y prueba social.",
    objective: "Mostrar transformación real de cliente con resultados medibles para generar confianza",
    adFormat: "feed",
    tags: ["Testimonios", "Resultados", "Confianza"],
    color: "border-orange-500/30 hover:border-orange-500/60",
  },
  {
    id: "nutricion_plan",
    icon: <Apple className="w-5 h-5" />,
    category: "Nutrición",
    title: "Plan Nutricional Personalizado",
    description: "Anuncio específico para nutricionistas que venden planes personalizados online.",
    objective: "Venta de plan nutricional personalizado para pérdida de grasa o ganancia muscular",
    adFormat: "feed",
    tags: ["Nutrición", "Personalizado", "Salud"],
    color: "border-emerald-500/30 hover:border-emerald-500/60",
  },
  {
    id: "reto_challenge",
    icon: <Zap className="w-5 h-5" />,
    category: "Engagement",
    title: "Reto de 21 Días",
    description: "Lanza un reto de transformación para crear comunidad y generar leads cualificados.",
    objective: "Inscripción a reto de 21 días de transformación física gratuito o de bajo coste",
    adFormat: "reel_cover",
    tags: ["Reto", "Comunidad", "Engagement"],
    color: "border-pink-500/30 hover:border-pink-500/60",
  },
  {
    id: "entrenamiento_casa",
    icon: <Dumbbell className="w-5 h-5" />,
    category: "Captación",
    title: "Entrenamiento en Casa",
    description: "Capta leads que quieren entrenar desde casa sin equipamiento ni gimnasio.",
    objective: "Captación de leads interesados en entrenamiento en casa sin equipamiento",
    adFormat: "story",
    tags: ["Casa", "Sin gym", "Accesible"],
    color: "border-cyan-500/30 hover:border-cyan-500/60",
  },
];

export default function Templates() {
  const [, navigate] = useLocation();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedTemplates, setGeneratedTemplates] = useState<Set<string>>(new Set());

  const { data: brandBrain } = trpc.brandBrain.getMine.useQuery();
  const generateCopy = trpc.generate.copy.useMutation({
    onSuccess: (data) => {
      setGeneratedTemplates(prev => { const s = new Set(Array.from(prev)); s.add(generatingId!); return s; });
      setGeneratingId(null);
      toast.success("¡Copy generado! Revísalo en tu Biblioteca.", {
        action: {
          label: "Ver biblioteca",
          onClick: () => navigate("/library"),
        },
      });
    },
    onError: (err) => {
      toast.error(err.message || "Error al generar el copy");
      setGeneratingId(null);
    },
  });

  function handleUseTemplate(template: Template) {
    if (!brandBrain?.isComplete) {
      toast.error("Completa tu Brand Brain primero para usar las plantillas", {
        action: {
          label: "Configurar",
          onClick: () => navigate("/brand-brain"),
        },
      });
      return;
    }
    setGeneratingId(template.id);
    generateCopy.mutate({
      objective: template.objective,
      adFormat: template.adFormat,
      additionalContext: `Plantilla: ${template.title}. ${template.description}`,
    });
  }

  const categories = Array.from(new Set(TEMPLATES.map(t => t.category)));

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Plantillas de Campañas</h1>
          <p className="text-gray-400 mt-1">
            Lanza en 2 clics. La IA personaliza cada plantilla con tu Brand Brain.
          </p>
        </div>

        {!brandBrain?.isComplete && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-yellow-400 font-medium text-sm">Brand Brain incompleto</p>
              <p className="text-yellow-400/70 text-xs mt-0.5">
                Configura tu Brand Brain para que la IA personalice las plantillas con tu marca
              </p>
            </div>
            <Button
              size="sm"
              className="bg-yellow-500 text-black hover:bg-yellow-400 font-semibold"
              onClick={() => navigate("/brand-brain")}
            >
              Configurar ahora
            </Button>
          </div>
        )}

        {/* Templates grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TEMPLATES.map((template) => {
            const isGenerating = generatingId === template.id;
            const isDone = generatedTemplates.has(template.id);

            return (
              <Card
                key={template.id}
                className={`bg-gray-900 border transition-all duration-200 ${template.color}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                      {template.icon}
                    </div>
                    <Badge variant="outline" className="text-xs border-gray-700 text-gray-500">
                      {template.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-sm mt-2">{template.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-gray-400 text-xs leading-relaxed">{template.description}</p>

                  <div className="flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <Button
                    className="w-full h-8 text-xs font-semibold"
                    variant={isDone ? "outline" : "default"}
                    disabled={isGenerating}
                    onClick={() => isDone ? navigate("/library") : handleUseTemplate(template)}
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Generando...</>
                    ) : isDone ? (
                      <><CheckCircle2 className="w-3 h-3 mr-1 text-green-400" /> Ver en biblioteca</>
                    ) : (
                      <><Sparkles className="w-3 h-3 mr-1" /> Usar plantilla</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
    </div>
  );
}
