import { Layout } from "@/components/layout";
import { StatCard } from "@/components/stat-card";
import { useStats } from "@/hooks/use-stats";
import { Car, Users, Calendar, DollarSign, CalendarDays, FileText, LayoutDashboard, Receipt, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();
  const { user } = useAuth();
  const { t } = useI18n();

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-primary">{t("dashboard.title")}</h2>
        <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title={t("dashboard.todayServices")} 
            value={stats.todayServices} 
            icon={Calendar} 
            trend="+12%" 
            trendUp={true}
          />
          <StatCard 
            title={t("dashboard.estimatedRevenueToday")} 
            value={`R$${stats.estimatedRevenue.toFixed(2)}`} 
            icon={DollarSign} 
            trend="+5%" 
            trendUp={true}
          />
          <StatCard 
            title={t("dashboard.activeDrivers")} 
            value={stats.activeDrivers} 
            icon={Users} 
          />
          <StatCard 
            title={t("dashboard.availableVehicles")} 
            value={stats.availableVehicles} 
            icon={Car} 
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="font-display">{t("dashboard.quickActions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">{t("dashboard.priorityShortcuts")}</p>
            
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Operacional</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/services/new">
                <div className="nav-item w-full rounded-lg">
                  <Calendar className="w-4 h-4" />
                  <span>Agendar Novo Transfer</span>
                </div>
              </Link>
                <Link href="/agenda">
                  <div className="nav-item w-full rounded-lg">
                    <CalendarDays className="w-4 h-4" />
                    <span>Ver Agenda</span>
                  </div>
                </Link>
                <Link href="/reports">
                  <div className="nav-item w-full rounded-lg">
                    <FileText className="w-4 h-4" />
                    <span>Relatórios de Serviços</span>
                  </div>
                </Link>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Cadastros</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Link href="/clients?new=1">
                  <div className="nav-item w-full rounded-lg">
                    <UserPlus className="w-4 h-4" />
                    <span>Cadastrar Cliente</span>
                  </div>
                </Link>
              <Link href="/drivers?new=1">
                <div className="nav-item w-full rounded-lg">
                  <Users className="w-4 h-4" />
                  <span>Cadastrar Novo Motorista</span>
                </div>
              </Link>
              <Link href="/vehicles?new=1">
                <div className="nav-item w-full rounded-lg">
                  <Car className="w-4 h-4" />
                  <span>Adicionar Veículo à Frota</span>
                </div>
              </Link>
              </div>
            </div>

            {user?.role === "admin" && (
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Financeiro</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Link href="/finance/expenses/create">
                    <div className="nav-item w-full rounded-lg">
                      <Receipt className="w-4 h-4" />
                      <span>Registrar Despesa</span>
                    </div>
                  </Link>
                  <Link href="/finance/revenues">
                    <div className="nav-item w-full rounded-lg">
                      <DollarSign className="w-4 h-4" />
                      <span>Registrar Recebimento</span>
                    </div>
                  </Link>
                  <Link href="/finance/dashboard">
                    <div className="nav-item w-full rounded-lg">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Painel Financeiro</span>
                    </div>
                  </Link>
                  <Link href="/finance/reports">
                    <div className="nav-item w-full rounded-lg">
                      <FileText className="w-4 h-4" />
                      <span>Relatórios Financeiros</span>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
