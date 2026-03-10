import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp }: StatCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-none shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl font-bold font-display text-primary">{value}</h3>
          </div>
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Icon className="w-6 h-6" />
          </div>
        </div>
        {trend && (
          <div className={`text-xs mt-4 font-medium flex items-center gap-1 ${trendUp ? "text-emerald-600" : "text-rose-600"}`}>
            <span>{trend}</span>
            <span className="text-muted-foreground">vs mês passado</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
