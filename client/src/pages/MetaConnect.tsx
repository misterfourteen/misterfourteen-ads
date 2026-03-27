import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Facebook, CheckCircle2, AlertCircle, Link2, Loader2, ExternalLink, Shield } from "lucide-react";

export default function MetaConnect() {
  const [accessToken, setAccessToken] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [pageId, setPageId] = useState("");
  const [showManual, setShowManual] = useState(false);

  const { data: connection, refetch } = trpc.meta.getConnection.useQuery();
  const saveMutation = trpc.meta.saveConnection.useMutation();

  const handleSave = async () => {
    if (!accessToken) { toast.error("El Access Token es obligatorio"); return; }
    try {
      await saveMutation.mutateAsync({ accessToken, adAccountId: adAccountId || undefined, pageId: pageId || undefined });
      toast.success("Conexión guardada correctamente");
      refetch();
    } catch {
      toast.error("Error al guardar la conexión");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Facebook className="w-6 h-6 text-blue-400" /> Conectar Meta Ads
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Vincula tu cuenta de Meta Business para publicar anuncios automáticamente.</p>
      </div>

      {/* Status */}
      <div className={`glass-card rounded-xl p-5 border ${connection ? "border-green-500/30" : "border-border"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${connection ? "bg-green-500/15" : "bg-secondary"}`}>
              {connection ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div>
              <p className="font-medium text-sm">{connection ? "Cuenta conectada" : "Sin conexión"}</p>
              <p className="text-xs text-muted-foreground">
                {connection ? `Cuenta de anuncios: ${connection.adAccountName ?? connection.adAccountId ?? "Configurada"}` : "Conecta tu cuenta para publicar anuncios automáticamente"}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={connection ? "border-green-500/30 text-green-400" : "border-border text-muted-foreground"}>
            {connection ? "Activa" : "Inactiva"}
          </Badge>
        </div>
      </div>

      {/* Steps */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <h3 className="font-semibold">Cómo conectar tu cuenta</h3>
        <div className="space-y-3">
          {[
            { step: 1, title: "Accede a Meta Business Suite", desc: "Ve a business.facebook.com y entra con tu cuenta de negocio." },
            { step: 2, title: "Crea una App en Meta for Developers", desc: "En developers.facebook.com, crea una app de tipo Business. Activa el producto 'Marketing API'." },
            { step: 3, title: "Genera un Access Token", desc: "En el Graph API Explorer, selecciona tu app y genera un token con permisos: ads_management, ads_read, pages_read_engagement." },
            { step: 4, title: "Copia tu Ad Account ID", desc: "En Meta Ads Manager, encontrarás tu Account ID en la URL o en Configuración de cuenta (formato: act_XXXXXXXXX)." },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s.step}</div>
              <div>
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => window.open("https://business.facebook.com", "_blank")}>
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Meta Business Suite
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.open("https://developers.facebook.com/tools/explorer/", "_blank")}>
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Graph API Explorer
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="glass-card rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Credenciales de conexión</h3>
          <button onClick={() => setShowManual(!showManual)} className="text-xs text-primary hover:underline">
            {showManual ? "Ocultar" : "Introducir manualmente"}
          </button>
        </div>

        {(showManual || !connection) && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Access Token *</Label>
              <Input type="password" placeholder="EAAxxxxxxxxxxxxxxxx..." value={accessToken} onChange={e => setAccessToken(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">Token de acceso de tu app de Meta for Developers.</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Ad Account ID</Label>
              <Input placeholder="act_XXXXXXXXXXXXXXXXX" value={adAccountId} onChange={e => setAdAccountId(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Page ID (Facebook)</Label>
              <Input placeholder="XXXXXXXXXXXXXXXXX" value={pageId} onChange={e => setPageId(e.target.value)} />
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
              <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">Tus credenciales se almacenan de forma segura y encriptada. Nunca se comparten con terceros.</p>
            </div>
            <Button onClick={handleSave} disabled={saveMutation.isPending || !accessToken} className="w-full gradient-brand text-white border-0">
              {saveMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</> : <><Link2 className="w-4 h-4 mr-2" /> Guardar conexión</>}
            </Button>
          </div>
        )}
      </div>

      {/* Meta Business Partner info */}
      <div className="glass-card rounded-xl p-5 border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm mb-1">Sobre el programa Meta Business Partner</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Para acceder a soporte prioritario y reducir el riesgo de baneos, Mister Fourteen recomienda solicitar el estatus de Meta Business Partner. Requiere un gasto mínimo de $5,000 USD en 180 días y al menos 10 cuentas publicitarias activas.
            </p>
            <Button variant="link" size="sm" className="text-primary p-0 h-auto mt-1 text-xs" onClick={() => window.open("https://www.facebook.com/business/marketing-partners/become-a-partner", "_blank")}>
              Más información sobre Meta Business Partner <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
