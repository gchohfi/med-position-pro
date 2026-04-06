import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/40 px-6 bg-background">
            <SidebarTrigger className="mr-4 text-muted-foreground hover:text-foreground" />
          </header>
          <main className="flex-1 bg-background overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;