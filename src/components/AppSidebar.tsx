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
  LineChart,
  Globe,
} from "lucide-react";

const configLinks = [
  { label: "Setup", icon: Settings, path: "/setup" },
];

const diagnosticoLinks = [
  { label: "Diagnóstico", icon: Target, path: "/diagnostico" },
  { label: "Análise de Perfil", icon: Users, path: "/analise-perfil" },
  { label: "Concorrência", icon: Eye, path: "/concorrencia" },
  { label: "Radar Instagram", icon: Instagram, path: "/radar-instagram" },
  { label: "Inspiração", icon: Globe, path: "/inspiracao" },
];

const estrategiaLinks = [
  { label: "Tendências", icon: TrendingUp, path: "/tendencias" },
  { label: "Radar Mercado", icon: Sparkles, path: "/radar-mercado" },
  { label: "Estratégia IA", icon: Zap, path: "/estrategia-ia" },
  { label: "Carrossel", icon: Layers, path: "/carrossel" },
  { label: "Produção", icon: PenTool, path: "/producao" },
  { label: "Calendário", icon: Calendar, path: "/calendario" },
  { label: "Séries", icon: BookOpen, path: "/series" },
];

const performanceLinks = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Métricas", icon: BarChart3, path: "/metricas" },
  { label: "Evolução", icon: LineChart, path: "/evolucao" },
  { label: "Biblioteca", icon: Archive, path: "/biblioteca" },
  { label: "Memória Viva", icon: Brain, path: "/memoria-viva" },
  { label: "Atualizações", icon: RefreshCw, path: "/atualizacoes" },
  { label: "Supervisor", icon: Bot, path: "/supervisor" },
];

const sidebarSections = [
  { label: "Configuração", links: configLinks },
  { label: "Diagnóstico & Análise", links: diagnosticoLinks },
  { label: "Estratégia & Conteúdo", links: estrategiaLinks },
  { label: "Performance & Gestão", links: performanceLinks },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        {sidebarSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.links.map((link) => (
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
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
