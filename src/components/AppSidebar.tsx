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
  Calendar,
  TrendingUp,
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
  BookOpen,
  Brain,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

interface NavLinkItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

const platformLinks: NavLinkItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: ROUTES.dashboard },
  { label: "Diagnóstico", icon: Target, path: ROUTES.diagnostico },
  { label: "Produção", icon: PenTool, path: ROUTES.producao },
  { label: "Biblioteca", icon: Archive, path: ROUTES.biblioteca },
  { label: "Calendário", icon: Calendar, path: ROUTES.calendario },
  { label: "Evolução", icon: LineChart, path: ROUTES.evolucao },
  { label: "Memória Viva", icon: Brain, path: ROUTES.memoriaViva },
];

const intelligenceLinks: NavLinkItem[] = [
  { label: "Setup", icon: Settings, path: ROUTES.setup },
  { label: "Radar Mercado", icon: Sparkles, path: ROUTES.radarMercado },
  { label: "Radar Instagram", icon: Instagram, path: ROUTES.radarInstagram },
  { label: "Inspiração", icon: Globe, path: ROUTES.inspiracao },
  { label: "Atualizações", icon: RefreshCw, path: ROUTES.atualizacoes },
  { label: "Métricas", icon: BarChart3, path: ROUTES.metricas },
];

const squadLinks: NavLinkItem[] = [
  { label: "Supervisor", icon: Bot, path: ROUTES.supervisor },
  { label: "Análise de Perfil", icon: Users, path: ROUTES.analisePerfil },
  { label: "Concorrência", icon: Eye, path: ROUTES.concorrencia },
  { label: "Tendências", icon: TrendingUp, path: ROUTES.tendencias },
  { label: "Estratégia IA", icon: Zap, path: ROUTES.estrategiaIa },
  { label: "Carrossel", icon: Layers, path: ROUTES.carrossel },
  { label: "Séries", icon: BookOpen, path: ROUTES.series },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const renderGroup = (title: string, links: NavLinkItem[]) => (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {links.map((link) => (
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
  );

  return (
    <Sidebar>
      <SidebarContent>
        {renderGroup("Plataforma", platformLinks)}
        {renderGroup("Inteligência", intelligenceLinks)}
        {renderGroup("IA Squad Médico", squadLinks)}
      </SidebarContent>
    </Sidebar>
  );
}
