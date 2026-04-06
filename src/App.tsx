import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DoctorProvider } from "@/contexts/DoctorContext";
import { ROUTES } from "@/lib/routes";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Diagnostico from "./pages/Diagnostico";
import Producao from "./pages/Producao";
import Biblioteca from "./pages/Biblioteca";
import MemoriaViva from "./pages/MemoriaViva";
import Evolucao from "./pages/Evolucao";
import Calendario from "./pages/Calendario";
import Series from "./pages/Series";
import RadarMercado from "./pages/RadarMercado";
import RadarInstagram from "./pages/RadarInstagram";
import AtualizacoesInteligentes from "./pages/AtualizacoesInteligentes";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// IA Squad pages
import Setup from "./pages/Setup";
import Supervisor from "./pages/Supervisor";
import AnalisePerfil from "./pages/AnalisePerfil";
import Concorrencia from "./pages/Concorrencia";
import Tendencias from "./pages/Tendencias";
import Estrategia from "./pages/Estrategia";
import Carrossel from "./pages/Carrossel";
import Metricas from "./pages/Metricas";
import Inspiracao from "./pages/Inspiracao";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DoctorProvider>
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
          </DoctorProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
