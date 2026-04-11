import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DoctorProvider } from "@/contexts/DoctorContext";
import { ROUTES } from "@/lib/routes";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Setup from "./pages/Setup";
import Carrossel from "./pages/Carrossel";
import Biblioteca from "./pages/Biblioteca";
import Ideias from "./pages/Ideias";
import RadarPage from "./pages/Radar";
import BenchmarkPage from "./pages/Benchmark";
import TopicClusters from "./pages/TopicClusters";
import ReferenciasVisuais from "./pages/ReferenciasVisuais";
import Personas from "./pages/Personas";

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
              {/* Public */}
              <Route path={ROUTES.index} element={<Index />} />
              <Route path={ROUTES.auth} element={<Auth />} />
              <Route path={ROUTES.resetPassword} element={<ResetPassword />} />

              {/* Core — 3 screens */}
              <Route path={ROUTES.setup} element={<ProtectedRoute><Setup /></ProtectedRoute>} />
              <Route path={ROUTES.carrossel} element={<ProtectedRoute><Carrossel /></ProtectedRoute>} />
              <Route path={ROUTES.biblioteca} element={<ProtectedRoute><Biblioteca /></ProtectedRoute>} />
              <Route path={ROUTES.ideias} element={<ProtectedRoute><Ideias /></ProtectedRoute>} />
              <Route path={ROUTES.radar} element={<ProtectedRoute><RadarPage /></ProtectedRoute>} />
              <Route path={ROUTES.benchmark} element={<ProtectedRoute><BenchmarkPage /></ProtectedRoute>} />
              <Route path={ROUTES.topicClusters} element={<ProtectedRoute><TopicClusters /></ProtectedRoute>} />
              <Route path={ROUTES.referenciasVisuais} element={<ProtectedRoute><ReferenciasVisuais /></ProtectedRoute>} />
              <Route path={ROUTES.personas} element={<ProtectedRoute><Personas /></ProtectedRoute>} />

              {/* Redirect old routes to carrossel */}
              <Route path="/dashboard" element={<Navigate to={ROUTES.carrossel} replace />} />
              <Route path="/producao" element={<Navigate to={ROUTES.carrossel} replace />} />
              <Route path="/onboarding" element={<Navigate to={ROUTES.setup} replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </DoctorProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
