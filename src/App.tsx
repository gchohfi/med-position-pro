import React, { Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DoctorProvider } from "@/contexts/DoctorContext";
import { ROUTES } from "@/lib/routes";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Eagerly loaded (public/critical path)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Lazy loaded — reduces initial bundle significantly
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Onboarding = React.lazy(() => import("./pages/Onboarding"));
const Setup = React.lazy(() => import("./pages/Setup"));
const Diagnostico = React.lazy(() => import("./pages/Diagnostico"));
const Producao = React.lazy(() => import("./pages/Producao"));
const Biblioteca = React.lazy(() => import("./pages/Biblioteca"));
const MemoriaViva = React.lazy(() => import("./pages/MemoriaViva"));
const Evolucao = React.lazy(() => import("./pages/Evolucao"));
const Calendario = React.lazy(() => import("./pages/Calendario"));
const Series = React.lazy(() => import("./pages/Series"));
const RadarMercado = React.lazy(() => import("./pages/RadarMercado"));
const RadarInstagram = React.lazy(() => import("./pages/RadarInstagram"));
const AtualizacoesInteligentes = React.lazy(() => import("./pages/AtualizacoesInteligentes"));
const Supervisor = React.lazy(() => import("./pages/Supervisor"));
const AnalisePerfil = React.lazy(() => import("./pages/AnalisePerfil"));
const Concorrencia = React.lazy(() => import("./pages/Concorrencia"));
const Tendencias = React.lazy(() => import("./pages/Tendencias"));
const Estrategia = React.lazy(() => import("./pages/Estrategia"));
const Carrossel = React.lazy(() => import("./pages/Carrossel"));
const Metricas = React.lazy(() => import("./pages/Metricas"));
const Inspiracao = React.lazy(() => import("./pages/Inspiracao"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DoctorProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path={ROUTES.index} element={<Index />} />
                <Route path={ROUTES.auth} element={<Auth />} />
                <Route path={ROUTES.resetPassword} element={<ResetPassword />} />

                {/* Protected routes — require authentication */}
                <Route path={ROUTES.onboarding} element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

                {/* Core */}
                <Route path={ROUTES.dashboard} element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path={ROUTES.setup} element={<ProtectedRoute><Setup /></ProtectedRoute>} />

                {/* Diagnóstico & Análise */}
                <Route path={ROUTES.diagnostico} element={<ProtectedRoute><Diagnostico /></ProtectedRoute>} />
                <Route path={ROUTES.analisePerfil} element={<ProtectedRoute><AnalisePerfil /></ProtectedRoute>} />
                <Route path={ROUTES.concorrencia} element={<ProtectedRoute><Concorrencia /></ProtectedRoute>} />
                <Route path={ROUTES.radarInstagram} element={<ProtectedRoute><RadarInstagram /></ProtectedRoute>} />
                <Route path={ROUTES.inspiracao} element={<ProtectedRoute><Inspiracao /></ProtectedRoute>} />

                {/* Estratégia & Conteúdo */}
                <Route path={ROUTES.tendencias} element={<ProtectedRoute><Tendencias /></ProtectedRoute>} />
                <Route path={ROUTES.radarMercado} element={<ProtectedRoute><RadarMercado /></ProtectedRoute>} />
                <Route path={ROUTES.estrategiaIa} element={<ProtectedRoute><Estrategia /></ProtectedRoute>} />
                <Route path={ROUTES.carrossel} element={<ProtectedRoute><Carrossel /></ProtectedRoute>} />
                <Route path={ROUTES.producao} element={<ProtectedRoute><Producao /></ProtectedRoute>} />
                <Route path={ROUTES.calendario} element={<ProtectedRoute><Calendario /></ProtectedRoute>} />
                <Route path={ROUTES.series} element={<ProtectedRoute><Series /></ProtectedRoute>} />

                {/* Performance & Gestão */}
                <Route path={ROUTES.metricas} element={<ProtectedRoute><Metricas /></ProtectedRoute>} />
                <Route path={ROUTES.evolucao} element={<ProtectedRoute><Evolucao /></ProtectedRoute>} />
                <Route path={ROUTES.biblioteca} element={<ProtectedRoute><Biblioteca /></ProtectedRoute>} />
                <Route path={ROUTES.memoriaViva} element={<ProtectedRoute><MemoriaViva /></ProtectedRoute>} />
                <Route path={ROUTES.atualizacoes} element={<ProtectedRoute><AtualizacoesInteligentes /></ProtectedRoute>} />
                <Route path={ROUTES.supervisor} element={<ProtectedRoute><Supervisor /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </DoctorProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
