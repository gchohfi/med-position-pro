import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border/50 px-5 bg-card/80 backdrop-blur-sm sticky top-0 z-30">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
          </header>
          <main className="flex-1 overflow-auto">
            <div className="px-6 py-7 md:px-10 md:py-9 lg:px-12">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
