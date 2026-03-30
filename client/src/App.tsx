import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import BrandBrain from "./pages/BrandBrain";
import GenerateCopy from "./pages/GenerateCopy";
import GenerateScript from "./pages/GenerateScript";
import GenerateImage from "./pages/GenerateImage";
import Campaigns from "./pages/Campaigns";
import CampaignBuilder from "./pages/CampaignBuilder";
import MetaConnect from "./pages/MetaConnect";
import Pricing from "./pages/Pricing";
import AdminPanel from "./pages/AdminPanel";
import ContentLibrary from "./pages/ContentLibrary";
import Templates from "./pages/Templates";
import ABTesting from "./pages/ABTesting";
import CaseStudies from "./pages/CaseStudies";
import Profile from "./pages/Profile";
import LandingBuilder from "./pages/LandingBuilder";
import Pipelines from "./pages/Pipelines";
import CompetitorResearch from "./pages/CompetitorResearch";
import SupportChat from "./components/SupportChat";
import MetaSuite from "./pages/MetaSuite";
import PipelineCRM from "./pages/PipelineCRM";
```

---

**Paso 4 — Añade las rutas**

Ahora pulsa **Ctrl+F** para buscar. Escribe esto y pulsa Enter:
```
/competitor-research
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "./const";

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (adminOnly && user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Acceso denegado.</p>
      </div>
    );
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/dashboard">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={Dashboard} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/onboarding">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={Onboarding} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/brand-brain">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={BrandBrain} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/generate/copy">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={GenerateCopy} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/generate/script">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={GenerateScript} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/generate/image">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={GenerateImage} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/campaigns">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={Campaigns} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/campaigns/new">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={CampaignBuilder} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/meta-connect">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={MetaConnect} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/library">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={ContentLibrary} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/templates">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={Templates} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/ab-testing">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={ABTesting} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/admin">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={AdminPanel} adminOnly />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/profile">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={Profile} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/landing-builder">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={LandingBuilder} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/pipelines">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={Pipelines} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/competitor-research">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={CompetitorResearch} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/meta-suite">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={MetaSuite} />
          </DashboardLayout>
        )}
      </Route>

      <Route path="/pipeline-crm">
        {() => (
          <DashboardLayout>
            <ProtectedRoute component={PipelineCRM} />
          </DashboardLayout>
        )}
      </Route>
```

Cuando lo pegues debería quedar así:
```
194   </Route>          ← la línea que ya existe
195                     ← línea nueva vacía
196   <Route path="/meta-suite">
...
      </Route>
      
      <Route path="/pipeline-crm">
...
      </Route>
      
207   <Route path="/404"...    ← esto ya existía antes
      <Route path="/404" component={NotFound} />
      <Route path="/casos-de-exito" component={CaseStudies} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
          <SupportChat />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
