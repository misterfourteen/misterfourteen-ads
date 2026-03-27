import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, Brain, Sparkles, FileText, ImageIcon,
  Megaphone, PlusCircle, Link2, BarChart3, Settings,
  LogOut, PanelLeft, Shield, ChevronDown, Zap
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";

const menuGroups = [
  {
    label: "Principal",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: Brain, label: "Brand Brain", path: "/brand-brain" },
    ],
  },
  {
    label: "Generadores IA",
    items: [
      { icon: Sparkles, label: "Generar Copy", path: "/generate/copy" },
      { icon: FileText, label: "Generar Guión", path: "/generate/script" },
      { icon: ImageIcon, label: "Generar Imagen", path: "/generate/image" },
    ],
  },
  {
    label: "Campañas",
    items: [
      { icon: Megaphone, label: "Mis Campañas", path: "/campaigns" },
      { icon: PlusCircle, label: "Nueva Campaña", path: "/campaigns/new" },
      { icon: Link2, label: "Conectar Meta", path: "/meta-connect" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md w-full glass-card rounded-2xl">
          <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-display font-bold mb-2">Acceso requerido</h1>
            <p className="text-sm text-muted-foreground">Inicia sesión para acceder a la plataforma.</p>
          </div>
          <Button onClick={() => { window.location.href = getLoginUrl(); }} className="w-full gradient-brand text-white border-0">
            Iniciar sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const { data: brandBrain } = trpc.brandBrain.getMine.useQuery(undefined, {
    retry: false,
  });

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const planLabel: Record<string, string> = {
    free: "Free",
    diy: "DIY",
    done_with_you: "Done With You",
    agency: "Agencia",
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-border/50 bg-sidebar" disableTransition={isResizing}>
          {/* Header */}
          <SidebarHeader className="h-16 justify-center border-b border-border/50">
            <div className="flex items-center gap-3 px-2">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors shrink-0"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded gradient-brand flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-xs">M14</span>
                  </div>
                  <span className="font-display font-bold text-sm truncate">Mister Fourteen</span>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Nav */}
          <SidebarContent className="gap-0 py-2">
            {menuGroups.map((group) => (
              <SidebarGroup key={group.label} className="py-1">
                <SidebarGroupLabel className="text-xs text-muted-foreground/60 px-4 mb-1 uppercase tracking-wider">
                  {group.label}
                </SidebarGroupLabel>
                <SidebarMenu className="px-2">
                  {group.items.map((item) => {
                    const isActive = location === item.path || location.startsWith(item.path + "/");
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className="h-9 transition-all font-normal"
                        >
                          <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}

            {/* Admin link */}
            {user?.role === "admin" && (
              <SidebarGroup className="py-1">
                <SidebarGroupLabel className="text-xs text-muted-foreground/60 px-4 mb-1 uppercase tracking-wider">
                  Admin
                </SidebarGroupLabel>
                <SidebarMenu className="px-2">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={location === "/admin"}
                      onClick={() => setLocation("/admin")}
                      tooltip="Panel Admin"
                      className="h-9"
                    >
                      <Shield className="h-4 w-4 text-primary" />
                      <span>Panel Admin</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            )}

            {/* Brand Brain status */}
            {!isCollapsed && !brandBrain?.isComplete && (
              <div className="mx-3 mt-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs font-medium text-primary mb-1">Completa tu Brand Brain</p>
                <p className="text-xs text-muted-foreground mb-2">Configura tu marca para activar los generadores de IA.</p>
                <button
                  onClick={() => setLocation("/onboarding")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Configurar ahora →
                </button>
              </div>
            )}
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter className="p-3 border-t border-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary transition-colors w-full text-left focus:outline-none">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-primary/20 text-primary">
                      {user?.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-none">{user?.name ?? "Usuario"}</p>
                      <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                        {planLabel[user?.subscriptionPlan ?? "free"] ?? "Free"}
                      </Badge>
                    </div>
                  )}
                  {!isCollapsed && <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setLocation("/pricing")}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Cambiar plan</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/30 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b border-border/50 h-14 items-center justify-between bg-background/95 px-4 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-8 w-8 rounded-lg" />
              <div className="w-5 h-5 rounded gradient-brand flex items-center justify-center">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <span className="font-display font-semibold text-sm">Mister Fourteen</span>
            </div>
          </div>
        )}
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </>
  );
}
