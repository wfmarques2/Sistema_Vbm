import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "next-themes";

import Dashboard from "@/pages/dashboard";
import ServicesPage from "@/pages/services";
import ClientsPage from "@/pages/clients";
import DriversPage from "@/pages/drivers";
import VehiclesPage from "@/pages/vehicles";
import AgendaPage from "@/pages/agenda";
import ReportsPage from "@/pages/reports";
import FinanceServiceDetailPage from "@/pages/finance-service-detail";
import FinanceExpensesCreatePage from "@/pages/finance-expenses-create";
import FinanceExpensesListPage from "@/pages/finance-expenses-list";
import FinanceReportsPage from "@/pages/finance-reports";
import FinanceDashboardPage from "@/pages/finance-dashboard";
import FinanceKmLogsPage from "@/pages/finance-km-logs";
import FinanceAgendaPage from "@/pages/finance-agenda";
import FinanceRevenuesPage from "@/pages/finance-revenues";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";
import SettingsPage from "@/pages/settings";
import RegisterInvitePage from "@/pages/register-invite";
import RegisterSetupPage from "@/pages/register-setup";
import ServiceVoucherPage from "@/pages/service-voucher";
import ServiceEditPage from "@/pages/service-edit";
import DriverHistoryPage from "@/pages/driver-history";

function ProtectedRoute({ component: Component, allow }: { component: React.ComponentType, allow?: Array<"admin" | "operational" | "driver"> }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (allow && user && !allow.includes(user.role || "operational")) {
    if ((user.role || "operational") === "driver") {
      return <AgendaPage />;
    }
    return <NotFound />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register-setup" component={RegisterSetupPage} />
      <Route path="/reset-password">
        <LoginPage />
      </Route>
      <Route path="/">
        <ProtectedRoute component={Dashboard} allow={["admin","operational"]} />
      </Route>
      <Route path="/services">
        <ProtectedRoute component={ServicesPage} allow={["admin","operational"]} />
      </Route>
      <Route path="/services/new">
        <ProtectedRoute component={ServiceEditPage} allow={["admin","operational"]} />
      </Route>
      <Route path="/services/:id/edit">
        <ProtectedRoute component={ServiceEditPage} allow={["admin","operational"]} />
      </Route>
      <Route path="/clients">
        <ProtectedRoute component={ClientsPage} allow={["admin","operational"]} />
      </Route>
      <Route path="/drivers">
        <ProtectedRoute component={DriversPage} allow={["admin","operational"]} />
      </Route>
      <Route path="/vehicles">
        <ProtectedRoute component={VehiclesPage} allow={["admin","operational"]} />
      </Route>
      <Route path="/agenda">
        <ProtectedRoute component={AgendaPage} allow={["admin","operational","driver"]} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={ReportsPage} allow={["admin","operational"]} />
      </Route>
      <Route path="/driver/history">
        <ProtectedRoute component={DriverHistoryPage} allow={["driver"]} />
      </Route>
      <Route path="/finance/services/:id">
        <ProtectedRoute component={FinanceServiceDetailPage} allow={["admin"]} />
      </Route>
      <Route path="/finance/expenses/create">
        <ProtectedRoute component={FinanceExpensesCreatePage} allow={["admin"]} />
      </Route>
      <Route path="/finance/expenses">
        <ProtectedRoute component={FinanceExpensesListPage} allow={["admin"]} />
      </Route>
      <Route path="/finance/revenues">
        <ProtectedRoute component={FinanceRevenuesPage} allow={["admin"]} />
      </Route>
      <Route path="/finance/reports">
        <ProtectedRoute component={FinanceReportsPage} allow={["admin"]} />
      </Route>
      <Route path="/finance/agenda">
        <ProtectedRoute component={FinanceAgendaPage} allow={["admin"]} />
      </Route>
      <Route path="/finance/dashboard">
        <ProtectedRoute component={FinanceDashboardPage} allow={["admin"]} />
      </Route>
      <Route path="/finance/km-logs">
        <ProtectedRoute component={FinanceKmLogsPage} allow={["admin"]} />
      </Route>
      <Route path="/services/:id/voucher">
        <ProtectedRoute component={ServiceVoucherPage} allow={["admin","operational"]} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} allow={["admin"]} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
