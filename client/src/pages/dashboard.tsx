import { Layout } from "@/components/layout";
import { StatCard } from "@/components/stat-card";
import { useStats } from "@/hooks/use-stats";
import { Car, Users, Calendar, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-primary">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your operations today.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Today's Services" 
            value={stats.todayServices} 
            icon={Calendar} 
            trend="+12%" 
            trendUp={true}
          />
          <StatCard 
            title="Est. Revenue (Today)" 
            value={`$${stats.estimatedRevenue.toFixed(2)}`} 
            icon={DollarSign} 
            trend="+5%" 
            trendUp={true}
          />
          <StatCard 
            title="Active Drivers" 
            value={stats.activeDrivers} 
            icon={Users} 
          />
          <StatCard 
            title="Available Vehicles" 
            value={stats.availableVehicles} 
            icon={Car} 
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-md">
          <CardHeader>
            <CardTitle className="font-display">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.monthlyRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `$${value}`} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]} 
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="font-display">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Shortcuts to common operational tasks.</p>
            {/* These would be buttons or links */}
            <div className="p-3 bg-secondary rounded-lg text-sm font-medium hover:bg-secondary/80 cursor-pointer transition-colors">
              Schedule New Transfer
            </div>
            <div className="p-3 bg-secondary rounded-lg text-sm font-medium hover:bg-secondary/80 cursor-pointer transition-colors">
              Register New Driver
            </div>
            <div className="p-3 bg-secondary rounded-lg text-sm font-medium hover:bg-secondary/80 cursor-pointer transition-colors">
              Add Vehicle to Fleet
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
