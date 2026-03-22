import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  CalendarDays, 
  FileText, 
  LogOut, 
  Menu,
  Settings,
  X,
  ChevronDown
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Sun, Moon } from "lucide-react";
import vbmLogoDarkUrl from "@assets/vbm-logo-1.png?url";
import vbmLogoLightUrl from "@assets/vbm-logo-2.png?url";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(location.startsWith("/finance/"));
  const [servicesOpen, setServicesOpen] = useState(
    location === "/services" ||
    location === "/agenda" ||
    location === "/reports" ||
    location.startsWith("/driver/")
  );

  const navigation = [
    { name: "Painel", href: "/", icon: LayoutDashboard },
    { name: "Clientes", href: "/clients", icon: Users },
    { name: "Motoristas", href: "/drivers", icon: Users },
    { name: "Veículos", href: "/vehicles", icon: Car },
  ];
  const servicesNavigation = [
    { name: "Serviços", href: "/services", icon: FileText },
    { name: "Agenda", href: "/agenda", icon: CalendarDays },
    { name: "Relatórios", href: "/reports", icon: FileText },
  ];
  const financeNavigation = [
    { name: "Despesas", href: "/finance/expenses", icon: FileText },
    { name: "Receitas", href: "/finance/revenues", icon: FileText },
    { name: "Relatórios", href: "/finance/reports", icon: FileText },
    { name: "Agenda", href: "/finance/agenda", icon: CalendarDays },
    { name: "Painel Financeiro", href: "/finance/dashboard", icon: LayoutDashboard },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (resolvedTheme || theme || "light") : "light";
  const logoUrl = currentTheme === "dark" ? vbmLogoDarkUrl : vbmLogoLightUrl;

  // Mantém estado sem animar na navegação inicial, evitando "abre-fecha" rápido

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-border/50 flex flex-col items-center">
            <img
              src={logoUrl}
              alt="VBM Transfer Executivo"
              className="w-32 h-32 object-contain"
            />
            <h1 className="mt-3 text-2xl font-display font-bold text-primary text-center">Painel Administrativo</h1>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {(user?.role === "driver" ? [] : navigation).map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div 
                    className={`nav-item cursor-pointer ${isActive ? "active" : ""}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
            {(() => {
              const currentServicesNav = user?.role === "driver"
                ? [
                    { name: "Agenda", href: "/agenda", icon: CalendarDays },
                    { name: "Histórico", href: "/driver/history", icon: FileText },
                  ]
                : servicesNavigation;
              const servicesActive = currentServicesNav.some((i) => location === i.href);
              return (
                <div>
                  <div
                    className={`nav-item cursor-pointer ${servicesActive ? "active" : ""}`}
                    onClick={() => setServicesOpen((o) => !o)}
                  >
                    <FileText className="w-5 h-5" />
                    <span>Serviços</span>
                    <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
                  </div>
                  {servicesOpen && (
                    <div className="mt-1 pl-8 space-y-1">
                      {currentServicesNav.map((item) => {
                        const isActive = location === item.href;
                        return (
                          <Link key={item.name} href={item.href}>
                            <div 
                              className={`nav-item cursor-pointer ${isActive ? "active" : ""}`}
                            >
                              <item.icon className="w-4 h-4" />
                              <span>{item.name}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
            {user?.role === "admin" && (() => {
              const financeActive = financeNavigation.some((i) => location === i.href);
              return (
                <div>
                  <div
                    className={`nav-item cursor-pointer ${financeActive ? "active" : ""}`}
                    onClick={() => setFinanceOpen((o) => !o)}
                  >
                    <FileText className="w-5 h-5" />
                    <span>Financeiro</span>
                    <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${financeOpen ? "rotate-180" : ""}`} />
                  </div>
                  {financeOpen && (
                    <div className="mt-1 pl-8 space-y-1">
                      {financeNavigation.map((item) => {
                        const isActive = location === item.href;
                        return (
                          <Link key={item.name} href={item.href}>
                            <div 
                              className={`nav-item cursor-pointer ${isActive ? "active" : ""}`}
                            >
                              <item.icon className="w-4 h-4" />
                              <span>{item.name}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </nav>

          <div className="p-4 border-t border-border/50">
            <div className="flex items-center gap-3 mb-4 px-2">
              <Avatar>
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
              </Avatar>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              {user?.role === 'admin' && (
                <Link href="/settings">
                   <Button variant="ghost" size="icon" className="ml-auto h-8 w-8">
                      <Settings className="w-4 h-4" />
                   </Button>
                </Link>
              )}
            </div>
            <div className="mb-4 flex items-center justify-between px-3 py-2 bg-secondary/30 rounded-lg mx-2">
              <div className="flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span className="text-sm font-medium">Tema</span>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-card border-b border-border/50 h-16 flex items-center px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </Button>
          <span className="ml-4 font-display font-semibold text-lg">VBM Transfer Executivo</span>
          <div className="ml-auto flex items-center gap-2">
            {currentTheme === "dark" ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
            <Switch
              checked={currentTheme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="w-full max-w-none space-y-8 animate-in fade-in duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
