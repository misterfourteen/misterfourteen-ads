import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  Users, Brain, Megaphone, Sparkles, Loader2, Shield,
  CheckCircle2, AlertCircle, TrendingUp
} from "lucide-react";

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();

  const { data: stats, isLoading: statsLoading } = trpc.admin.getStats.useQuery();
  const { data: users, isLoading: usersLoading } = trpc.admin.getUsers.useQuery();
  const { data: brains, isLoading: brainsLoading } = trpc.admin.getBrandBrains.useQuery();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "admin")) {
      setLocation("/dashboard");
    }
  }, [loading, isAuthenticated, user, setLocation]);

  if (loading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground text-sm">Gestión de la plataforma Mister Fourteen</p>
        </div>
      </div>

      {/* Platform stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Usuarios totales", value: stats?.totalUsers ?? 0, color: "text-primary", bg: "bg-primary/10" },
          { icon: Brain, label: "Brand Brains", value: stats?.totalBrains ?? 0, color: "text-blue-400", bg: "bg-blue-400/10" },
          { icon: Megaphone, label: "Campañas", value: stats?.totalCampaigns ?? 0, color: "text-green-400", bg: "bg-green-400/10" },
          { icon: Sparkles, label: "Contenidos IA", value: stats?.totalContents ?? 0, color: "text-yellow-400", bg: "bg-yellow-400/10" },
        ].map(stat => (
          <div key={stat.label} className="glass-card rounded-xl p-4">
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-display font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Usuarios registrados</h3>
          <Badge variant="outline" className="border-border text-muted-foreground text-xs">{users?.length ?? 0} total</Badge>
        </div>
        {usersLoading ? (
          <div className="flex items-center justify-center h-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Usuario</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Email</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Rol</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Registro</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Último acceso</th>
                </tr>
              </thead>
              <tbody>
                {users?.map(u => (
                  <tr key={u.id} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                    <td className="py-2.5 font-medium">{u.name ?? "—"}</td>
                    <td className="py-2.5 text-muted-foreground">{u.email ?? "—"}</td>
                    <td className="py-2.5">
                      <Badge variant="outline" className={`text-xs ${u.role === "admin" ? "border-primary/30 text-primary" : "border-border text-muted-foreground"}`}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString("es-ES")}</td>
                    <td className="py-2.5 text-muted-foreground text-xs">{new Date(u.lastSignedIn).toLocaleDateString("es-ES")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Brand Brains table */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Brand Brains configurados</h3>
          <Badge variant="outline" className="border-border text-muted-foreground text-xs">{brains?.length ?? 0} total</Badge>
        </div>
        {brainsLoading ? (
          <div className="flex items-center justify-center h-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Negocio</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Nicho</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Tono</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Estado</th>
                  <th className="text-left py-2 text-xs text-muted-foreground font-medium">Creado</th>
                </tr>
              </thead>
              <tbody>
                {brains?.map(b => (
                  <tr key={b.id} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                    <td className="py-2.5 font-medium">{b.businessName}</td>
                    <td className="py-2.5 text-muted-foreground text-xs max-w-[200px] truncate">{b.niche}</td>
                    <td className="py-2.5 text-muted-foreground capitalize">{b.communicationTone ?? "—"}</td>
                    <td className="py-2.5">
                      {b.isComplete ? (
                        <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Completo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" /> Incompleto
                        </Badge>
                      )}
                    </td>
                    <td className="py-2.5 text-muted-foreground text-xs">{new Date(b.createdAt).toLocaleDateString("es-ES")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
