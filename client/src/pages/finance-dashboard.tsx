import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFinanceDashboard } from "@/hooks/use-finance-dashboard";
import { useServices } from "@/hooks/use-services";
import { Download } from "lucide-react";
import { useState } from "react";
import { DateQuickFilters } from "@/components/date-quick-filters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVehicles } from "@/hooks/use-vehicles";
import { useDrivers } from "@/hooks/use-drivers";
import { saveAs } from "file-saver";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useListRevenues, useListUnifiedExpenses } from "@/hooks/use-financial";
import { useUpdateService } from "@/hooks/use-services";
import { useUpdateCompanyExpense, useUpdateVehicleExpense, useUpdateDriverPayment } from "@/hooks/use-financial";
import { useToast } from "@/hooks/use-toast";

export default function FinanceDashboardPage() {
  const now = new Date();
  const [start, setStart] = useState<string>(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
  const [end, setEnd] = useState<string>(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10));
  const [vehicleId, setVehicleId] = useState<number | "">("");
  const [driverId, setDriverId] = useState<number | "">("");
  const { data: vehicles } = useVehicles();
  const { data: drivers } = useDrivers();
  const { data, isLoading, isError } = useFinanceDashboard({
    start,
    end,
    vehicleId: typeof vehicleId === "number" ? vehicleId : undefined,
    driverId: typeof driverId === "number" ? driverId : undefined,
  });
  const { data: monthServices } = useServices({ start, end, driverId: typeof driverId === "number" ? String(driverId) : undefined });
  const { data: driverPaymentsPending } = useListUnifiedExpenses({
    start,
    end,
    tipo: "driver_payment",
    statusPagamento: "pending",
    driverId: typeof driverId === "number" ? driverId : undefined,
  });
  const { data: revenuesList } = useListRevenues({ start, end, limit: 500, sortOrder: "asc" });
  const { data: expensesList } = useListUnifiedExpenses({ start, end, limit: 500, sortOrder: "asc" });
  const updateService = useUpdateService();
  const updateCompany = useUpdateCompanyExpense();
  const updateVehicle = useUpdateVehicleExpense();
  const updateDriverPay = useUpdateDriverPayment();
  const { toast } = useToast();

  function toDateKey(d: string | Date) {
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toISOString().slice(0, 10);
  }

  const seriesData = (() => {
    const days: Record<string, { date: string; receita: number; custos: number; lucro: number }> = {};
    (monthServices || []).forEach((s: any) => {
      const key = toDateKey(s.dateTime);
      const receita = Number(s.valorCobrado || 0);
      const custos =
        Number(s.combustivel || 0) +
        Number(s.pedagio || 0) +
        Number(s.estacionamento || 0) +
        Number(s.alimentacao || 0) +
        Number(s.outrosCustos || 0);
      days[key] = days[key] || { date: key, receita: 0, custos: 0, lucro: 0 };
      days[key].receita += receita;
      days[key].custos += custos;
    });
    (revenuesList || []).forEach((r: any) => {
      const key = toDateKey(r.ocorridaEm);
      days[key] = days[key] || { date: key, receita: 0, custos: 0, lucro: 0 };
      days[key].receita += Number(r.valorCentavos || 0);
    });
    (expensesList || []).forEach((e: any) => {
      const key = toDateKey(e.ocorridaEm);
      days[key] = days[key] || { date: key, receita: 0, custos: 0, lucro: 0 };
      days[key].custos += Number(e.valorCentavos || 0);
    });
    const entries = Object.values(days);
    entries.sort((a, b) => a.date.localeCompare(b.date));
    entries.forEach((d) => (d.lucro = d.receita - d.custos));
    return entries.map((d) => ({
      date: new Date(d.date).toLocaleDateString("pt-BR"),
      receita: (d.receita / 100),
      custos: (d.custos / 100),
      lucro: (d.lucro / 100),
    }));
  })();

  const paymentMethodTotals = (() => {
    const acc: Record<string, number> = {};
    (monthServices || []).forEach((s: any) => {
      const m = s.formaPagamento || s.paymentMethod || "-";
      acc[m] = (acc[m] || 0) + Number(s.valorCobrado || 0);
    });
    return acc;
  })();

  const paymentStatusTotals = (() => {
    const acc: Record<string, number> = {};
    (monthServices || []).forEach((s: any) => {
      const st = s.statusPagamento || "pending";
      acc[st] = (acc[st] || 0) + Number(s.valorCobrado || 0);
    });
    return acc;
  })();

  const topClients = (() => {
    const acc: Record<string, { receita: number; lucro: number }> = {};
    (monthServices || []).forEach((s: any) => {
      const name = String(s.clientName || "-");
      const receita = Number(s.valorCobrado || 0);
      const custos =
        Number(s.combustivel || 0) +
        Number(s.pedagio || 0) +
        Number(s.estacionamento || 0) +
        Number(s.alimentacao || 0) +
        Number(s.outrosCustos || 0);
      acc[name] = acc[name] || { receita: 0, lucro: 0 };
      acc[name].receita += receita;
      acc[name].lucro += receita - custos;
    });
    const rows = Object.entries(acc).map(([name, v]) => ({ name, receita: v.receita, lucro: v.lucro }));
    rows.sort((a, b) => b.receita - a.receita);
    return rows.slice(0, 5);
  })();

  const topDrivers = (() => {
    const acc: Record<string, { receita: number; lucro: number }> = {};
    (monthServices || []).forEach((s: any) => {
      const name = String(s.driver?.name || "-");
      const receita = Number(s.valorCobrado || 0);
      const custos =
        Number(s.combustivel || 0) +
        Number(s.pedagio || 0) +
        Number(s.estacionamento || 0) +
        Number(s.alimentacao || 0) +
        Number(s.outrosCustos || 0);
      acc[name] = acc[name] || { receita: 0, lucro: 0 };
      acc[name].receita += receita;
      acc[name].lucro += receita - custos;
    });
    const rows = Object.entries(acc).map(([name, v]) => ({ name, receita: v.receita, lucro: v.lucro }));
    rows.sort((a, b) => b.lucro - a.lucro);
    return rows.slice(0, 5);
  })();

  const topVehicles = (() => {
    const acc: Record<string, { receita: number; lucro: number }> = {};
    (monthServices || []).forEach((s: any) => {
      const name = s.vehicle ? `${s.vehicle.model} (${s.vehicle.plate})` : "-";
      const receita = Number(s.valorCobrado || 0);
      const custos =
        Number(s.combustivel || 0) +
        Number(s.pedagio || 0) +
        Number(s.estacionamento || 0) +
        Number(s.alimentacao || 0) +
        Number(s.outrosCustos || 0);
      acc[name] = acc[name] || { receita: 0, lucro: 0 };
      acc[name].receita += receita;
      acc[name].lucro += receita - custos;
    });
    const rows = Object.entries(acc).map(([name, v]) => ({ name, receita: v.receita, lucro: v.lucro }));
    rows.sort((a, b) => b.lucro - a.lucro);
    return rows.slice(0, 5);
  })();

  const exportExcel = async () => {
    const Excel = await import("exceljs");
    const workbook = new (Excel as any).Workbook();
    const resumo = workbook.addWorksheet("Resumo");
    resumo.columns = [
      { header: "Campo", key: "campo", width: 28 },
      { header: "Valor", key: "valor", width: 22 },
    ];
    resumo.addRow({ campo: "Período", valor: `${start} a ${end}` });
    resumo.addRow({ campo: "Receita total", valor: Number(data?.receitaMesCentavos || 0) / 100 });
    resumo.addRow({ campo: "Lucro do período", valor: Number(data?.lucroLiquidoMesCentavos || 0) / 100 });
    resumo.addRow({ campo: "Custo médio por km", valor: data?.custoMedioPorKmCentavos != null ? data.custoMedioPorKmCentavos / 100 : null });
    resumo.addRow({ campo: "Margem média por viagem", valor: data?.margemMediaPorViagem != null ? Number(data.margemMediaPorViagem) : null });
    resumo.getColumn("valor").numFmt = '"R$"#,##0.00';
    const serieWs = workbook.addWorksheet("Série Diária");
    serieWs.columns = [
      { header: "Data", key: "data", width: 14 },
      { header: "Receita", key: "receita", width: 14 },
      { header: "Custos", key: "custos", width: 14 },
      { header: "Lucro", key: "lucro", width: 14 },
    ];
    seriesData.forEach((d) => {
      serieWs.addRow({ data: d.date, receita: d.receita, custos: d.custos, lucro: d.lucro });
    });
    serieWs.getColumn("receita").numFmt = '"R$"#,##0.00';
    serieWs.getColumn("custos").numFmt = '"R$"#,##0.00';
    serieWs.getColumn("lucro").numFmt = '"R$"#,##0.00';
    const distWs = workbook.addWorksheet("Recebíveis");
    distWs.columns = [
      { header: "Categoria", key: "cat", width: 20 },
      { header: "Valor", key: "val", width: 14 },
    ];
    Object.entries(paymentMethodTotals).forEach(([m, total]) => distWs.addRow({ cat: `Método: ${paymentLabel(m)}`, val: total / 100 }));
    Object.entries(paymentStatusTotals).forEach(([s, total]) => distWs.addRow({ cat: `Status: ${paymentStatusLabel(s)}`, val: total / 100 }));
    distWs.getColumn("val").numFmt = '"R$"#,##0.00';
    const payWs = workbook.addWorksheet("Pagáveis");
    payWs.columns = [
      { header: "Tipo", key: "tipo", width: 16 },
      { header: "Status", key: "status", width: 16 },
      { header: "Valor", key: "val", width: 14 },
    ];
    const payAgg: Record<string, Record<string, number>> = {};
    (expensesList || []).forEach((e: any) => {
      const tipo = e.tipo;
      const status = e.statusPagamento || "pending";
      payAgg[tipo] = payAgg[tipo] || {};
      payAgg[tipo][status] = (payAgg[tipo][status] || 0) + Number(e.valorCentavos || 0);
    });
    Object.entries(payAgg).forEach(([tipo, byStatus]) => {
      Object.entries(byStatus).forEach(([status, total]) => {
        payWs.addRow({ tipo, status: paymentStatusLabel(status), val: total / 100 });
      });
    });
    payWs.getColumn("val").numFmt = '"R$"#,##0.00';
    const rankWs = workbook.addWorksheet("Rankings");
    rankWs.columns = [
      { header: "Categoria", key: "cat", width: 20 },
      { header: "Nome", key: "name", width: 28 },
      { header: "Receita", key: "receita", width: 14 },
      { header: "Lucro", key: "lucro", width: 14 },
    ];
    topClients.forEach((r) => rankWs.addRow({ cat: "Cliente", name: r.name, receita: r.receita / 100, lucro: r.lucro / 100 }));
    topDrivers.forEach((r) => rankWs.addRow({ cat: "Motorista", name: r.name, receita: r.receita / 100, lucro: r.lucro / 100 }));
    topVehicles.forEach((r) => rankWs.addRow({ cat: "Veículo", name: r.name, receita: r.receita / 100, lucro: r.lucro / 100 }));
    rankWs.getColumn("receita").numFmt = '"R$"#,##0.00';
    rankWs.getColumn("lucro").numFmt = '"R$"#,##0.00';
    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `dashboard-financeiro_${start}_a_${end}.xlsx`);
  };

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Dashboard Financeiro</h2>
          <p className="text-muted-foreground">Métricas de receita, lucro e custos otimizadas para decisão.</p>
        </div>
        <a
          href={(() => {
            const url = new URL("/api/financial/dashboard.csv", window.location.origin);
            if (start) url.searchParams.set("start", start);
            if (end) url.searchParams.set("end", end);
            if (typeof vehicleId === "number") url.searchParams.set("vehicleId", String(vehicleId));
            if (typeof driverId === "number") url.searchParams.set("driverId", String(driverId));
            return url.pathname + url.search;
          })()}
          className="inline-flex"
        >
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </a>
        <Button variant="secondary" onClick={exportExcel} className="ml-2">
          Exportar Excel
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DateQuickFilters
            start={start}
            end={end}
            onChange={({ start: s, end: e }) => {
              setStart(s);
              setEnd(e);
            }}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={String(vehicleId)} onValueChange={(v) => setVehicleId(v === "none" ? "" : Number(v))}>
              <SelectTrigger><SelectValue placeholder="Veículo (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {vehicles?.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>{v.model} ({v.plate})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(driverId)} onValueChange={(v) => setDriverId(v === "none" ? "" : Number(v))}>
              <SelectTrigger><SelectValue placeholder="Motorista (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {drivers?.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && <div className="text-muted-foreground">Carregando...</div>}
      {isError && <div className="text-destructive">Erro ao carregar dados.</div>}
      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard title="Receita do mês" value={`R$${(data.receitaMesCentavos / 100).toFixed(2)}`} 
              subtitle={renderDelta("Receita", data.comparacao.receitaDeltaCentavos, data.comparacao.receitaPct)} />
            <MetricCard title="Lucro líquido" 
              value={`R$${(data.lucroLiquidoMesCentavos / 100).toFixed(2)}`} 
              valueClass={data.prejuizo ? "text-red-600" : "text-green-600"}
              subtitle={renderDelta("Lucro", data.comparacao.lucroDeltaCentavos, data.comparacao.lucroPct)} />
            <MetricCard title="Custo médio por KM" 
              value={data.custoMedioPorKmCentavos !== null ? `R$${(data.custoMedioPorKmCentavos / 100).toFixed(2)}` : "--"} />
            <MetricCard title="Lucro por KM" 
              value={data.lucroPorKmCentavos != null ? `R$${(data.lucroPorKmCentavos / 100).toFixed(2)}` : "--"} />
            <MetricCard title="Margem média por viagem" 
              value={data.margemMediaPorViagem !== null ? `${(data.margemMediaPorViagem * 100).toFixed(1)}%` : "--"} />
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Série diária: Receita, Custos e Lucro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={seriesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="receita" stroke="#16a34a" fill="#16a34a22" name="Receita" />
                    <Area type="monotone" dataKey="custos" stroke="#dc2626" fill="#dc262622" name="Custos" />
                    <Area type="monotone" dataKey="lucro" stroke="#2563eb" fill="#2563eb22" name="Lucro" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            <MetricCard
              title="Pagamentos pendentes (Serviços)"
              value={`R$${(sumPendingServicePayments(monthServices) / 100).toFixed(2)}`}
            />
            <MetricCard
              title="Pagamentos pendentes (Motoristas)"
              value={`R$${(sumDriverPayments(driverPaymentsPending) / 100).toFixed(2)}`}
            />
            <MetricCard
              title="Serviços finalizados (mês)"
              value={`${countByStatus(monthServices, "finished")}`}
            />
            <MetricCard
              title="Serviços cancelados (mês)"
              value={`${countByStatus(monthServices, "canceled")}`}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Por método de pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                {(Object.entries(paymentMethodTotals) as [string, number][])
                  .sort((a, b) => b[1] - a[1])
                  .map(([m, total]) => (
                    <div key={m} className="flex justify-between">
                      <div>{paymentLabel(m)}</div>
                      <div className="font-semibold">R${(total / 100).toFixed(2)}</div>
                    </div>
                  ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Por status de pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                {(Object.entries(paymentStatusTotals) as [string, number][])
                  .sort((a, b) => b[1] - a[1])
                  .map(([s, total]) => (
                    <div key={s} className="flex justify-between">
                      <div>{paymentStatusLabel(s)}</div>
                      <div className="font-semibold">R${(total / 100).toFixed(2)}</div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Serviços pendentes</div>
                  {(monthServices || [])
                    .filter((s: any) => {
                      const st = s.statusPagamento || "pending";
                      if (st === "pay_driver" && s.status === "finished") return false;
                      return st !== "paid" && st !== "saldo";
                    })
                    .slice(0, 5)
                    .map((s: any) => (
                      <div key={s.id} className="flex justify-between items-center py-1">
                        <div className="text-sm">{new Date(s.dateTime).toLocaleDateString("pt-BR")} • {s.clientName} • {(Number(s.valorCobrado || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            updateService.mutate({ id: s.id, statusPagamento: "paid" }, {
                              onSuccess: () => toast({ title: "Atualizado", description: `Serviço #${s.id} marcado como pago.` }),
                              onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
                            });
                          }}
                          disabled={updateService.isPending}
                        >
                          Marcar pago
                        </Button>
                      </div>
                    ))}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Despesas e pagamentos pendentes</div>
                  {(expensesList || [])
                    .filter((e: any) => {
                      const st = e.statusPagamento || "pending";
                      return st !== "paid" && (e.tipo === "company" || e.tipo === "vehicle" || e.tipo === "driver_payment");
                    })
                    .slice(0, 5)
                    .map((e: any) => (
                      <div key={`${e.tipo}-${e.id}`} className="flex justify-between items-center py-1">
                        <div className="text-sm">
                          {e.tipo === "company" ? "Empresa" : e.tipo === "vehicle" ? "Veículo" : "Motorista"} • {(Number(e.valorCentavos || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const now = new Date().toISOString();
                            if (e.tipo === "company") {
                              updateCompany.mutate({ id: e.id, statusPagamento: "paid", pagoEm: now }, {
                                onSuccess: () => toast({ title: "Atualizado", description: `Despesa da empresa #${e.id} marcada como paga.` }),
                                onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
                              });
                            } else if (e.tipo === "vehicle") {
                              updateVehicle.mutate({ id: e.id, statusPagamento: "paid", pagoEm: now as any }, {
                                onSuccess: () => toast({ title: "Atualizado", description: `Despesa de veículo #${e.id} marcada como paga.` }),
                                onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
                              });
                            } else if (e.tipo === "driver_payment") {
                              updateDriverPay.mutate({ id: e.id, statusPagamento: "paid", pagoEm: now }, {
                                onSuccess: () => toast({ title: "Atualizado", description: `Pagamento de motorista #${e.id} marcado como pago.` }),
                                onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
                              });
                            }
                          }}
                          disabled={updateCompany.isPending || updateVehicle.isPending || updateDriverPay.isPending}
                        >
                          Marcar pago
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Top 5 Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.topDespesas.map((d, i) => (
                  <div key={`${d.tipo}-${d.categoria}-${i}`} className="flex items-center justify-between p-3 rounded-md border">
                    <div>
                      <div className="font-medium">{d.categoria}</div>
                      <div className="text-xs text-muted-foreground">{d.tipo === "vehicle" ? "Veículo" : "Empresa"}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">R${(d.totalCentavos / 100).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                {topClients.map((r) => (
                  <div key={r.name} className="flex justify-between">
                    <div>{r.name}</div>
                    <div className="text-right">
                      <div className="font-semibold">R${(r.receita / 100).toFixed(2)}</div>
                      <div className={`${r.lucro < 0 ? "text-red-600" : "text-green-600"}`}>R${(r.lucro / 100).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Motoristas</CardTitle>
              </CardHeader>
              <CardContent>
                {topDrivers.map((r) => (
                  <div key={r.name} className="flex justify-between">
                    <div>{r.name}</div>
                    <div className="text-right">
                      <div className="font-semibold">R${(r.receita / 100).toFixed(2)}</div>
                      <div className={`${r.lucro < 0 ? "text-red-600" : "text-green-600"}`}>R${(r.lucro / 100).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Veículos</CardTitle>
              </CardHeader>
              <CardContent>
                {topVehicles.map((r) => (
                  <div key={r.name} className="flex justify-between">
                    <div>{r.name}</div>
                    <div className="text-right">
                      <div className="font-semibold">R${(r.receita / 100).toFixed(2)}</div>
                      <div className={`${r.lucro < 0 ? "text-red-600" : "text-green-600"}`}>R${(r.lucro / 100).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            {data.prejuizo ? (
              <Badge variant="destructive">Alerta: Mês com prejuízo</Badge>
            ) : (
              <Badge variant="outline">Situação: Lucro</Badge>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}

function MetricCard({
  title,
  value,
  valueClass,
  subtitle,
}: {
  title: string;
  value: string;
  valueClass?: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${valueClass || ""}`}>{value}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}

function renderDelta(label: string, deltaCentavos: number, pct: number | null) {
  const isUp = deltaCentavos >= 0;
  const color = isUp ? "text-green-600" : "text-red-600";
  const sign = isUp ? "+" : "-";
  const pctStr = pct !== null ? ` (${(Math.abs(pct) * 100).toFixed(1)}%)` : "";
  return (
    <span className={color}>
      {label} {sign}R${(Math.abs(deltaCentavos) / 100).toFixed(2)}{pctStr}
    </span>
  );
}

function sumPendingServicePayments(services?: any[]) {
  if (!services) return 0;
  return services.reduce((acc, s) => {
    const status = s.statusPagamento || "pending";
    const valor = Number(s.valorCobrado || 0);
    if (status === "pay_driver" && s.status === "finished") return acc;
    return status !== "paid" && status !== "saldo" ? acc + valor : acc;
  }, 0);
}

function sumDriverPayments(rows?: any[]) {
  if (!rows) return 0;
  return rows
    .filter((r) => r.tipo === "driver_payment")
    .reduce((acc, r) => acc + Number(r.valorCentavos || 0), 0);
}

function countByStatus(services?: any[], status?: string) {
  if (!services) return 0;
  if (!status) return services.length;
  return services.filter((s) => s.status === status).length;
}

function paymentLabel(p: string) {
  return p === "pix" ? "PIX" :
    p === "cash" ? "Dinheiro" :
    p === "credit_card" ? "Cartão crédito" :
    p === "debit_card" ? "Cartão débito" : p || "-";
}

function paymentStatusLabel(s: string) {
  return s === "paid" ? "Pago" :
    s === "pending" ? "Pendente" :
    s === "saldo" ? "Saldo" :
    s === "partial" ? "Parcial" :
    s === "overdue" ? "Atrasado" :
    s === "canceled" ? "Cancelado" : s || "-";
}
