import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DoctorProvider } from "@/contexts/DoctorContext";

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
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/diagnostico" element={<Diagnostico />} />
              <Route path="/producao" element={<Producao />} />
              <Route path="/biblioteca" element={<Biblioteca />} />
              <Route path="/memoria-viva" element={<MemoriaViva />} />
              <Route path="/evolucao" element={<Evolucao />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/series" element={<Series />} />
              <Route path="/radar-mercado" element={<RadarMercado />} />
              <Route path="/radar-instagram" element={<RadarInstagram />} />
              <Route path="/atualizacoes" element={<AtualizacoesInteligentes />} />
              {/* IA Squad */}
              <Route path="/setup" element={<Setup />} />
              <Route path="/supervisor" element={<Supervisor />} />
              <Route path="/analise-perfil" element={<AnalisePerfil />} />
              <Route path="/concorrencia" element={<Concorrencia />} />
              <Route path="/tendencias" element={<Tendencias />} />
              <Route path="/estrategia-ia" element={<Estrategia />} />
              <Route path="/carrossel" element={<Carrossel />} />
              <Route path="/metricas" element={<Metricas />} />
              <Route path="/inspiracao" element={<Inspiracao />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DoctorProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
