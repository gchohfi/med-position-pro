import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Diagnostico from "./pages/Diagnostico";
import Estrategia from "./pages/Estrategia";
import Producao from "./pages/Producao";
import Series from "./pages/Series";
import Calendario from "./pages/Calendario";
import Biblioteca from "./pages/Biblioteca";
import MemoriaViva from "./pages/MemoriaViva";
import Evolucao from "./pages/Evolucao";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background" />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Index />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/diagnostico"
        element={
          <ProtectedRoute>
            <Diagnostico />
          </ProtectedRoute>
        }
      />
      <Route
        path="/estrategia"
        element={
          <ProtectedRoute>
            <Estrategia />
          </ProtectedRoute>
        }
      />
      <Route
        path="/producao"
        element={
          <ProtectedRoute>
            <Producao />
          </ProtectedRoute>
        }
      />
      <Route
        path="/series"
        element={
          <ProtectedRoute>
            <Series />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendario"
        element={
          <ProtectedRoute>
            <Calendario />
          </ProtectedRoute>
        }
      />
      <Route
        path="/biblioteca"
        element={
          <ProtectedRoute>
            <Biblioteca />
          </ProtectedRoute>
        }
      />
      <Route
        path="/memoria-viva"
        element={
          <ProtectedRoute>
            <MemoriaViva />
          </ProtectedRoute>
        }
      />
      <Route
        path="/evolucao"
        element={
          <ProtectedRoute>
            <Evolucao />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
