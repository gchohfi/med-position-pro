import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Settings,
  Layers,
  Archive,
  Lightbulb,
  Radar,
  Globe,
  Network,
  Image,
  Users,
  BarChart3,
  Award,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

interface NavLinkItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

const mainLinks: NavLinkItem[] = [
  { label: "Dashboard", icon: BarChart3, path: ROUTES.dashboardExecutivo },
  { label: "Perfil", icon: Settings, path: ROUTES.setup },
  { label: "Carrossel", icon: Layers, path: ROUTES.carrossel },
  { label: "Biblioteca", icon: Archive, path: ROUTES.biblioteca },
  { label: "Referências", icon: Image, path: ROUTES.referenciasVisuais },
  { label: "Personas", icon: Users, path: ROUTES.personas },
];

const ideaLinks: NavLinkItem[] = [
  { label: "Inspiração", icon: Lightbulb, path: ROUTES.ideias },
  { label: "Radar", icon: Radar, path: ROUTES.radar },
  { label: "Benchmark", icon: Globe, path: ROUTES.benchmark },
  { label: "Clusters", icon: Network, path: ROUTES.topicClusters },
];

function NavItem({ link, isActive, onClick }: { link: NavLinkItem; isActive: boolean; onClick: () => void }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={onClick}
        isActive={isActive}
        className={`h-8 text-[13px] rounded-md transition-all duration-150 ${
          isActive
            ? "bg-accent/10 text-accent font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        }`}
      >
        <link.icon className="h-[15px] w-[15px]" />
        <span>{link.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar className="border-r border-border/40">
      <div className="h-12 flex items-center px-5 border-b border-border/40">
        <span className="font-heading text-lg text-foreground tracking-tight">Medshift</span>
      </div>
      <SidebarContent className="pt-3 px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainLinks.map((link) => (
                <NavItem
                  key={link.path}
                  link={link}
                  isActive={location.pathname === link.path}
                  onClick={() => navigate(link.path)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-label uppercase tracking-widest text-muted-foreground/50 px-3 mb-1">
            Inteligência
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {ideaLinks.map((link) => (
                <NavItem
                  key={link.path}
                  link={link}
                  isActive={location.pathname === link.path}
                  onClick={() => navigate(link.path)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
