import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DoctorProvider } from "@/contexts/DoctorContext";
import { ROUTES } from "@/lib/routes";

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
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DoctorProvider>
            <Routes>
              {/* Auth & onboarding */}
              <Route path={ROUTES.index} element={<Index />} />
              <Route path={ROUTES.auth} element={<Auth />} />
              <Route path={ROUTES.resetPassword} element={<ResetPassword />} />
              <Route path={ROUTES.onboarding} element={<Onboarding />} />

              {/* Core */}
              <Route path={ROUTES.dashboard} element={<Dashboard />} />
              <Route path={ROUTES.setup} element={<Setup />} />

              {/* Diagnóstico & Análise */}
              <Route path={ROUTES.diagnostico} element={<Diagnostico />} />
              <Route path={ROUTES.analisePerfil} element={<AnalisePerfil />} />
              <Route path={ROUTES.concorrencia} element={<Concorrencia />} />
              <Route path={ROUTES.radarInstagram} element={<RadarInstagram />} />
              <Route path={ROUTES.inspiracao} element={<Inspiracao />} />

              {/* Estratégia & Conteúdo */}
              <Route path={ROUTES.tendencias} element={<Tendencias />} />
              <Route path={ROUTES.radarMercado} element={<RadarMercado />} />
              <Route path={ROUTES.estrategiaIa} element={<Estrategia />} />
              <Route path={ROUTES.carrossel} element={<Carrossel />} />
              <Route path={ROUTES.producao} element={<Producao />} />
              <Route path={ROUTES.calendario} element={<Calendario />} />
              <Route path={ROUTES.series} element={<Series />} />

              {/* Performance & Gestão */}
              <Route path={ROUTES.metricas} element={<Metricas />} />
              <Route path={ROUTES.evolucao} element={<Evolucao />} />
              <Route path={ROUTES.biblioteca} element={<Biblioteca />} />
              <Route path={ROUTES.memoriaViva} element={<MemoriaViva />} />
              <Route path={ROUTES.atualizacoes} element={<AtualizacoesInteligentes />} />
              <Route path={ROUTES.supervisor} element={<Supervisor />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </DoctorProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
