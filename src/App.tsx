import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ModelProvider } from "@/contexts/ModelContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { RepoExplorerPage } from "@/pages/RepoExplorerPage";
import { EditorPage } from "@/pages/EditorPage";
import { NewProjectPage } from "@/pages/NewProjectPage";
import { ImportProjectPage } from "@/pages/ImportProjectPage";
import { LocalEditorPage } from "@/pages/LocalEditorPage";
import { RepoDocterPage } from "@/pages/RepoDocterPage";
import { DeployPage } from "@/pages/DeployPage";
import { WorkflowPage } from "@/pages/WorkflowPage";
import { ModelsPage } from "@/pages/ModelsPage";
import { SelfImprovePage } from "@/pages/SelfImprovePage";
import { LicensesPage } from "@/pages/LicensesPage";
import { GuidePage } from "@/pages/GuidePage";
import { ExtensionPage } from "@/pages/ExtensionPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, isLoading, error, step, pendingActivation, activateLicense, register, login, logout, switchToActivate, switchToLogin } = useAuth();

  if (!user) {
    return (
      <LoginPage
        step={step}
        isLoading={isLoading}
        error={error}
        pendingActivation={pendingActivation}
        onActivate={activateLicense}
        onRegister={register}
        onLogin={login}
        onSwitchToActivate={switchToActivate}
        onSwitchToLogin={switchToLogin}
      />
    );
  }

  return (
    <AppLayout user={user} onLogout={logout}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/repo/:owner/:name" element={<RepoExplorerPage />} />
        <Route path="/editor/:owner/:name" element={<EditorPage />} />
        <Route path="/new" element={<NewProjectPage />} />
        <Route path="/import" element={<ImportProjectPage />} />
        <Route path="/deploy" element={<DeployPage />} />
        <Route path="/local-editor" element={<LocalEditorPage />} />
        <Route path="/repo-doctor" element={<RepoDocterPage />} />
        <Route path="/workflow" element={<WorkflowPage />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/self-improve" element={<SelfImprovePage />} />
        <Route path="/licenses" element={<LicensesPage />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/extension" element={<ExtensionPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ModelProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </ModelProvider>
  </QueryClientProvider>
);

export default App;
