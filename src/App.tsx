import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PlacarLayout } from "@/components/placar/PlacarLayout";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages
const PlacarHomePage = lazy(() => import("@/pages/placar/PlacarHomePage").then(m => ({ default: m.PlacarHomePage })));
const PoliticoPage = lazy(() => import("@/pages/placar/PoliticoPage").then(m => ({ default: m.PoliticoPage })));
const CompararPage = lazy(() => import("@/pages/placar/CompararPage").then(m => ({ default: m.CompararPage })));
const MetodologiaPage = lazy(() => import("@/pages/placar/MetodologiaPage").then(m => ({ default: m.MetodologiaPage })));
const FontesPage = lazy(() => import("@/pages/placar/FontesPage").then(m => ({ default: m.FontesPage })));

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
    <PlacarLayout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<PlacarHomePage />} />
          <Route path="/politico/:id" element={<PoliticoPage />} />
          <Route path="/comparar" element={<CompararPage />} />
          <Route path="/metodologia" element={<MetodologiaPage />} />
          <Route path="/fontes" element={<FontesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </PlacarLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
