import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Settings,
  Layers,
  Archive,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";

interface NavLinkItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

const mainLinks: NavLinkItem[] = [
  { label: "Perfil", icon: Settings, path: ROUTES.setup },
  { label: "Carrossel", icon: Layers, path: ROUTES.carrossel },
  { label: "Biblioteca", icon: Archive, path: ROUTES.biblioteca },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar className="border-r border-border/40">
      <div className="h-14 flex items-center px-5 border-b border-border/40">
        <span className="font-heading text-xl text-foreground tracking-tight">Medshift</span>
      </div>
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <SidebarMenuItem key={link.path}>
                    <SidebarMenuButton
                      onClick={() => navigate(link.path)}
                      isActive={isActive}
                      className={`h-9 text-sm rounded-md transition-colors ${
                        isActive
                          ? "bg-accent/10 text-accent font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      }`}
                    >
                      <link.icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
