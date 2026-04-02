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
  type LucideIcon,
} from "lucide-react";

interface NavLinkItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

const platformLinks: NavLinkItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Diagnóstico", icon: Target, path: "/diagnostico" },
  { label: "Produção", icon: PenTool, path: "/producao" },
  { label: "Biblioteca", icon: Archive, path: "/biblioteca" },
  { label: "Calendário", icon: Calendar, path: "/calendario" },
];

const intelligenceLinks: NavLinkItem[] = [
  { label: "Onboarding", icon: Settings, path: "/onboarding" },
  { label: "Radar Mercado", icon: Sparkles, path: "/radar-mercado" },
  { label: "Radar Instagram", icon: Instagram, path: "/radar-instagram" },
  { label: "Atualizações", icon: RefreshCw, path: "/atualizacoes" },
  { label: "Métricas", icon: BarChart3, path: "/metricas" },
];

const squadLinks: NavLinkItem[] = [
  { label: "Setup", icon: Settings, path: "/setup" },
  { label: "Supervisor", icon: Bot, path: "/supervisor" },
  { label: "Análise de Perfil", icon: Users, path: "/analise-perfil" },
  { label: "Concorrência", icon: Eye, path: "/concorrencia" },
  { label: "Tendências", icon: TrendingUp, path: "/tendencias" },
  { label: "Estratégia IA", icon: Zap, path: "/estrategia-ia" },
  { label: "Carrossel", icon: Layers, path: "/carrossel" },
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
