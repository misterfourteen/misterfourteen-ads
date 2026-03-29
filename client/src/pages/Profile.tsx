import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  User, Mail, Camera, Save, Shield, CreditCard,
  CheckCircle2, Loader2, Upload, Trash2, ExternalLink
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [avatarUrl, setAvatarUrl] = useState((user as any)?.avatarUrl ?? "");
  const [avatarPreview, setAvatarPreview] = useState((user as any)?.avatarUrl ?? "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success("Perfil actualizado correctamente");
      utils.auth.me.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const portalMutation = trpc.stripe.createPortal.useMutation({
    onSuccess: ({ url }) => { if (url) window.open(url, "_blank"); },
    onError: (e) => toast.error(e.message),
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5 MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      // Preview local
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
      reader.readAsDataURL(file);

      // Upload to S3 via server
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-avatar", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Error subiendo imagen");
      const { url } = await res.json();
      setAvatarUrl(url);
      toast.success("Avatar subido. Guarda los cambios para aplicarlo.");
    } catch (err) {
      toast.error("Error subiendo el avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = () => {
    updateMutation.mutate({
      name: name || undefined,
      email: email || undefined,
      avatarUrl: avatarUrl || undefined,
    });
  };

  const planLabels: Record<string, string> = {
    free: "Plan Gratuito",
    diy: "DIY — 97€/mes",
    done_with_you: "Done With You — 297€/mes",
    agency: "Agency Premium — 997€/mes",
  };

  const planColors: Record<string, string> = {
    free: "text-muted-foreground",
    diy: "text-blue-400",
    done_with_you: "text-purple-400",
    agency: "text-primary",
  };

    const initials = (user?.name ?? "U").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      <div>
        <h1 className="text-2xl font-display font-bold">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestiona tu cuenta y preferencias</p>
      </div>

      {/* Avatar & name */}
      <div className="glass-card rounded-xl p-6 space-y-5">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Información personal</h2>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{initials}</span>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors"
            >
              {uploadingAvatar ? (
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-white" />
              )}
            </button>
          </div>
          <div className="flex-1">
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Upload className="w-3 h-3" /> Cambiar foto
              </button>
              {avatarPreview && (
                <button
                  onClick={() => { setAvatarPreview(""); setAvatarUrl(""); }}
                  className="text-xs text-destructive hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Eliminar
                </button>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Nombre</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre"
              className="pl-9 bg-secondary/50 border-border"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              type="email"
              className="pl-9 bg-secondary/50 border-border"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {updateMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Guardar cambios</>
          )}
        </Button>
      </div>

      {/* Plan & Billing */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Plan y facturación</h2>

        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/40 border border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <p className={`font-semibold text-sm ${planColors[user?.subscriptionPlan ?? "free"]}`}>
                {planLabels[user?.subscriptionPlan ?? "free"]}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                Estado: {user?.subscriptionStatus === "active" ? "Activo" : user?.subscriptionStatus === "trialing" ? "Prueba" : "Inactivo"}
              </p>
            </div>
          </div>
          {user?.subscriptionPlan !== "free" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
              className="text-xs"
            >
              {portalMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <><ExternalLink className="w-3 h-3 mr-1" /> Gestionar</>}
            </Button>
          )}
        </div>

        {user?.subscriptionPlan === "free" && (
          <a href="/pricing" className="block w-full text-center py-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
            Actualizar plan →
          </a>
        )}
      </div>

      {/* Account info */}
      <div className="glass-card rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Detalles de la cuenta</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">ID de cuenta</span>
            <span className="font-mono text-xs">{user?.id}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Método de acceso</span>
            <span className="capitalize">{user?.loginMethod ?? "—"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground">Rol</span>
            <span className="flex items-center gap-1">
              {user?.role === "admin" && <Shield className="w-3.5 h-3.5 text-primary" />}
              <span className="capitalize">{user?.role}</span>
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Miembro desde</span>
            <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }) : "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
