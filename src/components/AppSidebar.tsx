import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard,
  Target,
  Lightbulb,
  BookOpen,
  Calendar,
  PenTool,
  LogOut,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, disabled: false },
  { title: "Diagnóstico", url: "/diagnostico", icon: Target, disabled: false },
  { title: "Estratégia", url: "/estrategia", icon: Lightbulb, disabled: false },
  { title: "Séries", url: "#", icon: BookOpen, disabled: true },
  { title: "Calendário", url: "#", icon: Calendar, disabled: true },
  { title: "Criação", url: "/producao", icon: PenTool, disabled: false },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <div className="p-4 pb-2">
          {!collapsed && (
            <span className="font-heading text-lg font-semibold text-foreground tracking-tight">
              MedPositioning
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild disabled={item.disabled}>
                    {item.disabled ? (
                      <span className="flex items-center gap-2 opacity-40 cursor-not-allowed px-2 py-1.5">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </span>
                    ) : (
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-muted/50"
                        activeClassName="bg-muted text-foreground font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
