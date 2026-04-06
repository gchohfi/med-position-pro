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
      <SidebarGroupLabel className="text-[10px] tracking-widest uppercase text-muted-foreground/60 font-medium px-3 mb-1">
        {title}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <SidebarMenuItem key={link.path}>
                <SidebarMenuButton
                  onClick={() => navigate(link.path)}
                  isActive={isActive}
                  className={`h-8 text-[13px] rounded-md transition-colors ${
                    isActive
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <link.icon className="h-3.5 w-3.5" />
                  <span>{link.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar className="border-r border-border/40">
      <div className="h-14 flex items-center px-5 border-b border-border/40">
        <span className="font-heading text-xl text-foreground tracking-tight">Medshift</span>
      </div>
      <SidebarContent className="pt-2">
        {renderGroup("Plataforma", platformLinks)}
        {renderGroup("Inteligência", intelligenceLinks)}
        {renderGroup("IA Squad", squadLinks)}
      </SidebarContent>
    </Sidebar>
  );
}