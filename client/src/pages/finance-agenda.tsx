import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { addMonths, format, startOfMonth, endOfMonth, addDays, subDays } from "date-fns";
import { useCreateCompanyExpense, useListUnifiedExpenses, useDeleteUnifiedExpense, useListCompanyExpenses, useListVehicleExpenses } from "@/hooks/use-financial";

export default function FinanceAgendaPage() {
  const today = new Date();
  const defaultStart = startOfMonth(today).toISOString().slice(0, 10);
  const defaultEnd = endOfMonth(today).toISOString().slice(0, 10);
  const [start, setStart] = useState<string>(defaultStart);
  const [end, setEnd] = useState<string>(defaultEnd);

  const { data: unified, isLoading: loadingUnified, refetch } = useListUnifiedExpenses({ start, end, sortOrder: "asc", limit: 500 });
  const { data: company } = useListCompanyExpenses({ start, end, active: true, sortBy: "ocorridaEm", sortOrder: "asc" });
  const { data: vehicle } = useListVehicleExpenses({ start, end, active: true, sortBy: "ocorridaEm", sortOrder: "asc" });
  const { mutateAsync: createCompanyExpense } = useCreateCompanyExpense();
  const deleteUnified = useDeleteUnifiedExpense();

  const upcoming = useMemo(() => {
    const uni = (unified || []).filter((r: any) => r.tipo !== "service");
    if (uni.length > 0) {
      return uni.sort((a: any, b: any) => new Date(a.ocorridaEm).getTime() - new Date(b.ocorridaEm).getTime());
    }
    const c = (company || []).map((e) => ({ tipo: "company" as const, ...e }));
    const v = (vehicle || []).map((e) => ({ tipo: "vehicle" as const, ...e }));
    return [...c, ...v].sort((a: any, b: any) => new Date(a.ocorridaEm ?? a.createdAt).getTime() - new Date(b.ocorridaEm ?? b.createdAt).getTime());
  }, [unified, company, vehicle]);

  const scheduleNextMonth = async (e: any) => {
    const nextDate = addMonths(new Date(e.ocorridaEm), 1);
    await createCompanyExpense({
      ocorridaEm: nextDate.toISOString(),
      valorCentavos: e.valorCentavos,
      pagoPara: e.pagoPara,
      categoria: e.categoria,
      descricao: e.descricao,
    });
    await refetch();
  };

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Agenda Financeira</h2>
          <p className="text-muted-foreground">Exibe despesas pelo período selecionado.</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Período</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => { const d = new Date(); const s = d.toISOString().slice(0,10); setStart(s); setEnd(s); }}>
              Hoje
            </Button>
            <Button variant="outline" onClick={() => { const d = new Date(); setStart(subDays(d, 7).toISOString().slice(0,10)); setEnd(d.toISOString().slice(0,10)); }}>
              Últimos 7 dias
            </Button>
            <Button variant="outline" onClick={() => { const d = new Date(); setStart(startOfMonth(d).toISOString().slice(0,10)); setEnd(endOfMonth(d).toISOString().slice(0,10)); }}>
              Este mês
            </Button>
            <Button variant="outline" onClick={() => { const d = new Date(); setStart(d.toISOString().slice(0,10)); setEnd(addDays(d, 30).toISOString().slice(0,10)); }}>
              Próx. 30 dias
            </Button>
            <Button variant="outline" onClick={() => { const d = new Date(); setStart(subDays(d, 30).toISOString().slice(0,10)); setEnd(addDays(d, 30).toISOString().slice(0,10)); }}>
              ±30 dias
            </Button>
            <Button variant="outline" onClick={() => { const d = addMonths(new Date(), 1); setStart(startOfMonth(d).toISOString().slice(0,10)); setEnd(endOfMonth(d).toISOString().slice(0,10)); }}>
              Próximo mês
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agenda de despesas</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUnified && <div className="text-muted-foreground">Carregando...</div>}
          {!loadingUnified && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Centro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map((r: any) => (
                  <TableRow key={`${r.tipo}-${r.id}`}>
                    <TableCell>{format(new Date(r.ocorridaEm), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{r.tipo === "company" ? "Empresa" : r.tipo === "vehicle" ? "Veículo" : "Motorista"}</TableCell>
                    <TableCell>{"categoria" in r ? r.categoria : "-"}</TableCell>
                    <TableCell>{"descricao" in r ? (r.descricao || "-") : "observacao" in r ? (r.observacao || "-") : "-"}</TableCell>
                    <TableCell>
                      {"vehicleId" in r && (r as any).vehicleId ? `Veículo #${(r as any).vehicleId}` :
                       "driverId" in r && (r as any).driverId ? `Motorista #${(r as any).driverId}` :
                       "serviceId" in r && (r as any).serviceId ? `Serviço #${(r as any).serviceId}` : "Empresa"}
                    </TableCell>
                    <TableCell>{"statusPagamento" in r ? (r.statusPagamento || "-") : "-"}</TableCell>
                    <TableCell>{(r.valorCentavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                    <TableCell>
                      {r.tipo === "company" && (
                        <Button variant="outline" size="sm" onClick={() => scheduleNextMonth(r)}>
                          Agendar próximo mês
                        </Button>
                      )}
                      {r.tipo !== "service" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (!confirm("Confirmar exclusão desta despesa?")) return;
                            deleteUnified.mutate({
                              tipo: r.tipo,
                              id: r.id,
                            }, { onSuccess: () => refetch() });
                          }}
                          disabled={deleteUnified.isPending}
                          className="ml-2"
                          title="Apagar"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
