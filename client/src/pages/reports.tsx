import { Layout } from "@/components/layout";
import { useServices } from "@/hooks/use-services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { format } from "date-fns";

export default function ReportsPage() {
  const { data: services, isLoading } = useServices();

  // Calculate simple totals
  const totalRevenue = services?.reduce((acc, curr) => acc + Number(curr.value), 0) || 0;
  const completedServices = services?.filter(s => s.status === 'finished').length || 0;
  const cancelledServices = services?.filter(s => s.status === 'canceled').length || 0;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Financial Reports</h2>
          <p className="text-muted-foreground">Revenue and service analysis.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-primary text-primary-foreground border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs opacity-70 mt-1">All time gross revenue</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display text-primary">{completedServices}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully finished</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Canceled Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display text-destructive">{cancelledServices}</div>
            <p className="text-xs text-muted-foreground mt-1">Missed opportunities</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-lg">Transaction History</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Service ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading data...</TableCell></TableRow>
            ) : services?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No transactions found.</TableCell></TableRow>
            ) : (
              services?.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{format(new Date(service.dateTime), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">#{service.id.toString().padStart(6, '0')}</TableCell>
                  <TableCell>{service.clientName}</TableCell>
                  <TableCell className="capitalize">{service.paymentMethod}</TableCell>
                  <TableCell className="text-right font-medium">${Number(service.value).toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}
