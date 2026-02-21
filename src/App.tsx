import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ModelProvider } from "@/contexts/ModelContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";

// Dev delay helper — remove in production
const devDelay = <T,>(p: Promise<T>, ms = 1000): Promise<T> =>
  new Promise(resolve => setTimeout(() => resolve(p), ms));

// Lazy-loaded pages (with artificial delay for dev spinner testing)
const DashboardPage = lazy(() => devDelay(import("@/pages/DashboardPage").then(m => ({ default: m.DashboardPage }))));
const GenLabEnginePage = lazy(() => devDelay(import("@/pages/GenLabEnginePage").then(m => ({ default: m.GenLabEnginePage }))));
const RepoExplorerPage = lazy(() => devDelay(import("@/pages/RepoExplorerPage").then(m => ({ default: m.RepoExplorerPage }))));
const EditorPage = lazy(() => devDelay(import("@/pages/EditorPage").then(m => ({ default: m.EditorPage }))));
const NewProjectPage = lazy(() => devDelay(import("@/pages/NewProjectPage").then(m => ({ default: m.NewProjectPage }))));
const ImportProjectPage = lazy(() => devDelay(import("@/pages/ImportProjectPage").then(m => ({ default: m.ImportProjectPage }))));
const LocalEditorPage = lazy(() => devDelay(import("@/pages/LocalEditorPage").then(m => ({ default: m.LocalEditorPage }))));
const RepoDocterPage = lazy(() => devDelay(import("@/pages/RepoDocterPage").then(m => ({ default: m.RepoDocterPage }))));
const DeployPage = lazy(() => devDelay(import("@/pages/DeployPage").then(m => ({ default: m.DeployPage }))));
const WorkflowPage = lazy(() => devDelay(import("@/pages/WorkflowPage").then(m => ({ default: m.WorkflowPage }))));
const ModelsPage = lazy(() => devDelay(import("@/pages/ModelsPage").then(m => ({ default: m.ModelsPage }))));
const SelfImprovePage = lazy(() => devDelay(import("@/pages/SelfImprovePage").then(m => ({ default: m.SelfImprovePage }))));
const GuidePage = lazy(() => devDelay(import("@/pages/GuidePage").then(m => ({ default: m.GuidePage }))));
const ExtensionPage = lazy(() => devDelay(import("@/pages/ExtensionPage").then(m => ({ default: m.ExtensionPage }))));
const NotFound = lazy(() => devDelay(import("@/pages/NotFound")));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

function AppRoutes() {
  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/genlab" element={<GenLabEnginePage />} />
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
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/extension" element={<ExtensionPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
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
