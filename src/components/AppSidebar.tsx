import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  PenTool,
  Archive,
  Brain,
  TrendingUp,
  Calendar,
  BookOpen,
  Sparkles,
  Instagram,
  RefreshCw,
  Settings,
  Users,
  Eye,
  BarChart3,
  Layers,
  Zap,
  Bot,
} from "lucide-react";

const platformLinks = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Onboarding", icon: Settings, path: "/onboarding" },
  { label: "Diagnóstico", icon: Target, path: "/diagnostico" },
  { label: "Produção", icon: PenTool, path: "/producao" },
  { label: "Biblioteca", icon: Archive, path: "/biblioteca" },
  { label: "Memória Viva", icon: Brain, path: "/memoria-viva" },
  { label: "Evolução", icon: TrendingUp, path: "/evolucao" },
  { label: "Calendário", icon: Calendar, path: "/calendario" },
  { label: "Séries", icon: BookOpen, path: "/series" },
  { label: "Radar Mercado", icon: Sparkles, path: "/radar-mercado" },
  { label: "Radar Instagram", icon: Instagram, path: "/radar-instagram" },
  { label: "Atualizações", icon: RefreshCw, path: "/atualizacoes" },
];

const squadLinks = [
  { label: "Setup", icon: Settings, path: "/setup" },
  { label: "Supervisor", icon: Bot, path: "/supervisor" },
  { label: "Análise de Perfil", icon: Users, path: "/analise-perfil" },
  { label: "Concorrência", icon: Eye, path: "/concorrencia" },
  { label: "Tendências", icon: TrendingUp, path: "/tendencias" },
  { label: "Estratégia IA", icon: Zap, path: "/estrategia-ia" },
  { label: "Carrossel", icon: Layers, path: "/carrossel" },
  { label: "Métricas", icon: BarChart3, path: "/metricas" },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformLinks.map((link) => (
                <SidebarMenuItem key={link.path}>
                  <SidebarMenuButton
                    onClick={() => navigate(link.path)}
                    isActive={location.pathname === link.path}
                  >
                    <link.icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>IA Squad Médico</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {squadLinks.map((link) => (
                <SidebarMenuItem key={link.path}>
                  <SidebarMenuButton
                    onClick={() => navigate(link.path)}
                    isActive={location.pathname === link.path}
                  >
                    <link.icon className="h-4 w-4" />
                    <span>{link.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
