import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Brain, Zap, Rocket, CheckCircle2 } from "lucide-react";

interface Step {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  href: string;
  done: boolean;
}

export default function OnboardingGuide() {
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(false);

  const { data: brandBrain } = trpc.brandBrain.getMine.useQuery();
  const { data: contents } = trpc.generate.history.useQuery({});
  const { data: campaigns } = trpc.campaigns.list.useQuery();

  const hasBrandBrain = brandBrain?.isComplete === true;
  const hasContent = (contents?.length ?? 0) > 0;
  const hasCampaign = (campaigns?.length ?? 0) > 0;

  const steps: Step[] = [
    {
      id: 1,
      icon: <Brain className="w-5 h-5 text-primary" />,
      title: "Configura tu Brand Brain",
      description: "Define tu nicho, avatar y tono de marca para que la IA te conozca",
      cta: hasBrandBrain ? "Ver Brand Brain" : "Configurar ahora",
      href: "/brand-brain",
      done: hasBrandBrain,
    },
    {
      id: 2,
      icon: <Zap className="w-5 h-5 text-yellow-400" />,
      title: "Genera tu primer contenido",
      description: "Crea un copy, guión o imagen publicitaria con tu IA personalizada",
      cta: hasContent ? "Ver biblioteca" : "Generar ahora",
      href: hasContent ? "/library" : "/generate/copy",
      done: hasContent,
    },
    {
      id: 3,
      icon: <Rocket className="w-5 h-5 text-green-400" />,
      title: "Crea tu primera campaña",
      description: "Construye y lanza tu primera campaña en Meta Ads",
      cta: hasCampaign ? "Ver campañas" : "Crear campaña",
      href: hasCampaign ? "/campaigns" : "/campaigns/new",
      done: hasCampaign,
    },
  ];

  const completedSteps = steps.filter((s) => s.done).length;
  const progress = (completedSteps / steps.length) * 100;
  const allDone = completedSteps === steps.length;

  // Auto-dismiss when all steps are done
  useEffect(() => {
    if (allDone) {
      const timer = setTimeout(() => setDismissed(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [allDone]);

  if (dismissed || (allDone && completedSteps === steps.length)) return null;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 mb-6 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-gray-600 hover:text-gray-400 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center justify-between mb-3 pr-6">
        <div>
          <h3 className="text-white font-semibold text-sm">
            {allDone ? "🎉 ¡Todo listo para lanzar!" : "Primeros pasos"}
          </h3>
          <p className="text-gray-500 text-xs mt-0.5">
            {completedSteps}/{steps.length} completados
          </p>
        </div>
        <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
      </div>

      <Progress value={progress} className="h-1.5 mb-4 bg-gray-800" />

      <div className="space-y-2">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
              step.done
                ? "bg-gray-800/50 opacity-60"
                : "bg-gray-800 hover:bg-gray-750 cursor-pointer"
            }`}
            onClick={() => !step.done && navigate(step.href)}
          >
            <div className="flex-shrink-0">
              {step.done ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                step.icon
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  step.done ? "text-gray-500 line-through" : "text-white"
                }`}
              >
                {step.title}
              </p>
              {!step.done && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{step.description}</p>
              )}
            </div>
            {!step.done && (
              <Button
                size="sm"
                variant="outline"
                className="flex-shrink-0 h-7 text-xs border-gray-600 text-gray-300 hover:text-white hover:border-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(step.href);
                }}
              >
                {step.cta}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
