import { Layout } from "@/components/layout";
import { useServices } from "@/hooks/use-services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function ReportsPage() {
  const { data: services, isLoading } = useServices();

  // Calculate simple totals
  const getValorReais = (s: any) => {
    const cent =
      typeof s?.valorCobrado === "number"
        ? s.valorCobrado
        : Math.round(Number(s?.value || 0) * 100);
    return cent / 100;
  };
  const paymentStatusLabel = (s: string) =>
    s === "paid" ? "Pago" :
    s === "pending" ? "Pendente" :
    s === "saldo" ? "Saldo" :
    s === "partial" ? "Parcial" :
    s === "overdue" ? "Atrasado" :
    s === "canceled" ? "Cancelado" :
    s === "pay_driver" ? "Pagar ao Motorista" : s;
  const totalRevenue =
    services?.reduce((acc, curr) => acc + getValorReais(curr), 0) || 0;
  const completedServices = services?.filter(s => s.status === 'finished').length || 0;
  const cancelledServices = services?.filter(s => s.status === 'canceled').length || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!services || services.length === 0) return;
    const headers = ["Data", "ID do Serviço", "Cliente", "Forma", "Status", "Valor (R$)"];
    const rows = services.map(s => [
      format(new Date(s.dateTime), "yyyy-MM-dd HH:mm"),
      s.id,
      s.clientName,
      s.paymentMethod,
      paymentStatusLabel(String(s.statusPagamento || "")),
      getValorReais(s).toFixed(2).replace(".", ","),
    ]);
    const sep = ";";
    const csvBody = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(sep))
      .join("\n");
    const bom = "\ufeff";
    const blob = new Blob([bom + csvBody], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-servicos-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Relatórios Financeiros de Serviços</h2>
          <p className="text-muted-foreground">Análise de receita e serviços.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} aria-label="Imprimir Relatório">
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={handleExportCsv} aria-label="Exportar CSV" disabled={!services || services.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-primary text-primary-foreground border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">R${totalRevenue.toFixed(2)}</div>
            <p className="text-xs opacity-70 mt-1">Receita bruta total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Serviços Concluídos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display text-primary">{completedServices}</div>
            <p className="text-xs text-muted-foreground mt-1">Finalizados com sucesso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Serviços Cancelados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display text-destructive">{cancelledServices}</div>
            <p className="text-xs text-muted-foreground mt-1">Oportunidades perdidas</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-lg">Histórico de Transações</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>ID do Serviço</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Forma</TableHead>
              <TableHead>Status de Pagamento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando dados...</TableCell></TableRow>
            ) : services?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma transação encontrada.</TableCell></TableRow>
            ) : (
              services?.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{format(new Date(service.dateTime), 'dd MMM yyyy', { locale: ptBR })}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">#{service.id.toString().padStart(4, '0')}</TableCell>
                  <TableCell>{service.clientName}</TableCell>
                  <TableCell className="capitalize">{service.paymentMethod}</TableCell>
                  <TableCell>
                    {(() => {
                      const s = String(service.statusPagamento || "");
                      const label = paymentStatusLabel(s);
                      const cls =
                        s === "paid" ? "bg-green-100 text-green-700" :
                        s === "partial" ? "bg-yellow-100 text-yellow-700" :
                        s === "pending" ? "bg-amber-100 text-amber-700" :
                        s === "overdue" ? "bg-red-100 text-red-700" :
                        s === "saldo" ? "bg-blue-100 text-blue-700" :
                        "bg-secondary text-foreground";
                      return <Badge className={cls}>{label}</Badge>;
                    })()}
                  </TableCell>
                  <TableCell className="text-right font-medium">R${getValorReais(service).toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}
