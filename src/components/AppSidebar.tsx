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
import { ROUTES } from "@/lib/routes";

const configLinks = [
  { label: "Setup", icon: Settings, path: ROUTES.setup },
];

const diagnosticoLinks = [
  { label: "Diagnóstico", icon: Target, path: ROUTES.diagnostico },
  { label: "Análise de Perfil", icon: Users, path: ROUTES.analisePerfil },
  { label: "Concorrência", icon: Eye, path: ROUTES.concorrencia },
  { label: "Radar Instagram", icon: Instagram, path: ROUTES.radarInstagram },
  { label: "Inspiração", icon: Globe, path: ROUTES.inspiracao },
];

const estrategiaLinks = [
  { label: "Tendências", icon: TrendingUp, path: ROUTES.tendencias },
  { label: "Radar Mercado", icon: Sparkles, path: ROUTES.radarMercado },
  { label: "Estratégia IA", icon: Zap, path: ROUTES.estrategiaIa },
  { label: "Carrossel", icon: Layers, path: ROUTES.carrossel },
  { label: "Produção", icon: PenTool, path: ROUTES.producao },
  { label: "Calendário", icon: Calendar, path: ROUTES.calendario },
  { label: "Séries", icon: BookOpen, path: ROUTES.series },
];

const performanceLinks = [
  { label: "Dashboard", icon: LayoutDashboard, path: ROUTES.dashboard },
  { label: "Métricas", icon: BarChart3, path: ROUTES.metricas },
  { label: "Evolução", icon: LineChart, path: ROUTES.evolucao },
  { label: "Biblioteca", icon: Archive, path: ROUTES.biblioteca },
  { label: "Memória Viva", icon: Brain, path: ROUTES.memoriaViva },
  { label: "Atualizações", icon: RefreshCw, path: ROUTES.atualizacoes },
  { label: "Supervisor", icon: Bot, path: ROUTES.supervisor },
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
