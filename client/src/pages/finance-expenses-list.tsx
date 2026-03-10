import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { addMonths } from "date-fns";
import { useListUnifiedExpenses, useCreateUnifiedExpense, useDeleteUnifiedExpense, useUpdateCompanyExpense, useUpdateVehicleExpense } from "@/hooks/use-financial";
import { Trash2 } from "lucide-react";
import { useDrivers } from "@/hooks/use-drivers";
import { useVehicles } from "@/hooks/use-vehicles";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateQuickFilters } from "@/components/date-quick-filters";

export default function FinanceExpensesListPage() {
  const createUnified = useCreateUnifiedExpense();
  const { data: drivers } = useDrivers();
  const { data: vehicles } = useVehicles();

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-primary">Central de Despesas</h2>
        <p className="text-muted-foreground">Cadastro e listagem unificada de todas as despesas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Despesa</CardTitle>
        </CardHeader>
        <CardContent>
          <UnifiedExpenseCreate drivers={drivers} vehicles={vehicles} createUnified={createUnified} />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Listagem Unificada</CardTitle>
        </CardHeader>
        <CardContent>
          <UnifiedExpensesTab />
        </CardContent>
      </Card>
    </Layout>
  );
}


function CompanyExpenseRow({
  expense,
  onSave,
  onDisable,
}: {
  expense: {
    id: number;
    ocorridaEm?: string;
    categoria: string;
    descricao?: string;
    pagoPara?: string;
    valorCentavos: number;
    active: boolean;
  };
  onSave: (payload: Partial<typeof expense> & { id: number }) => void;
  onDisable: () => void;
}) {
  const [categoria, setCategoria] = useState(expense.categoria);
  const [descricao, setDescricao] = useState(expense.descricao || "");
  const [pagoPara, setPagoPara] = useState(expense.pagoPara || "");
  const [valorDisplay, setValorDisplay] = useState((expense.valorCentavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
  const [data, setData] = useState(expense.ocorridaEm?.slice(0, 10) || "");
  return (
    <TableRow className={!expense.active ? "opacity-50" : ""}>
      <TableCell>{expense.id}</TableCell>
      <TableCell>
        <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-40" />
      </TableCell>
      <TableCell>
        <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-48" />
      </TableCell>
      <TableCell>
        <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </TableCell>
      <TableCell>
        <Input value={pagoPara} onChange={(e) => setPagoPara(e.target.value)} className="w-48" />
      </TableCell>
      <TableCell>
        <Input
          type="text"
          value={valorDisplay}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            const cents = digits ? parseInt(digits, 10) : 0;
            const amount = cents / 100;
            setValorDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
          }}
          className="w-32"
        />
      </TableCell>
      <TableCell>{expense.active ? "Sim" : "Não"}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() =>
              onSave({
                id: expense.id,
                categoria,
                descricao: descricao || undefined,
                pagoPara: pagoPara || undefined,
                valorCentavos: (() => {
                  const digits = valorDisplay.replace(/\D/g, "");
                  return digits ? parseInt(digits, 10) : 0;
                })(),
                ocorridaEm: data ? new Date(data).toISOString() : undefined,
              })
            }
          >
            Salvar
          </Button>
          <Button variant="destructive" onClick={onDisable} disabled={!expense.active}>
            Desativar
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function VehicleExpenseRow({
  expense,
  onSave,
  onDisable,
}: {
  expense: {
    id: number;
    vehicleId: number;
    serviceId?: number;
    categoria: string;
    descricao?: string;
    valorCentavos: number;
    ocorridaEm?: string;
    active: boolean;
  };
  onSave: (payload: Partial<typeof expense> & { id: number }) => void;
  onDisable: () => void;
}) {
  const [vehicleId, setVehicleId] = useState(expense.vehicleId);
  const [serviceId, setServiceId] = useState(expense.serviceId || 0);
  const [categoria, setCategoria] = useState(expense.categoria);
  const [descricao, setDescricao] = useState(expense.descricao || "");
  const [valorDisplay, setValorDisplay] = useState((expense.valorCentavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
  const [data, setData] = useState(expense.ocorridaEm?.slice(0, 10) || "");
  return (
    <TableRow className={!expense.active ? "opacity-50" : ""}>
      <TableCell>{expense.id}</TableCell>
      <TableCell>
        <Input type="number" value={vehicleId} onChange={(e) => setVehicleId(Number(e.target.value) || 0)} className="w-28" />
      </TableCell>
      <TableCell>
        <Input type="number" value={serviceId || ""} onChange={(e) => setServiceId(Number(e.target.value) || 0)} className="w-28" />
      </TableCell>
      <TableCell>
        <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-48" />
      </TableCell>
      <TableCell>
        <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </TableCell>
      <TableCell>
        <Input
          type="text"
          value={valorDisplay}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            const cents = digits ? parseInt(digits, 10) : 0;
            const amount = cents / 100;
            setValorDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
          }}
          className="w-32"
        />
      </TableCell>
      <TableCell>
        <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-36" />
      </TableCell>
      <TableCell>{expense.active ? "Sim" : "Não"}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() =>
              onSave({
                id: expense.id,
                vehicleId,
                serviceId: serviceId || undefined,
                categoria,
                descricao: descricao || undefined,
                valorCentavos: (() => {
                  const digits = valorDisplay.replace(/\D/g, "");
                  return digits ? parseInt(digits, 10) : 0;
                })(),
                ocorridaEm: data ? new Date(data).toISOString() : undefined,
              })
            }
          >
            Salvar
          </Button>
          <Button variant="destructive" onClick={onDisable} disabled={!expense.active}>
            Desativar
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function UnifiedExpensesTab() {
  const [uStart, setUStart] = useState<string>("");
  const [uEnd, setUEnd] = useState<string>("");
  const [uTipo, setUTipo] = useState<"vehicle"|"company"|"driver_payment"|"">("");
  const [uCategoria, setUCategoria] = useState<string>("");
  const [uVehicleId, setUVehicleId] = useState<number| "">("");
  const [uDriverId, setUDriverId] = useState<number| "">("");
  const [uServiceId, setUServiceId] = useState<number| "">("");
  const [uStatus, setUStatus] = useState<string>("");
  const [uLimit, setULimit] = useState<number>(50);
  const [uOffset, setUOffset] = useState<number>(0);
  const [uSortOrder, setUSortOrder] = useState<"asc"|"desc">("desc");
  const { data: unifiedRows, isLoading: isLoadingUnified, isError: isErrorUnified, refetch: refetchUnified } = useListUnifiedExpenses({
    start: uStart || undefined,
    end: uEnd || undefined,
    tipo: uTipo || undefined,
    categoria: uCategoria || undefined,
    vehicleId: typeof uVehicleId === "number" ? uVehicleId : undefined,
    driverId: typeof uDriverId === "number" ? uDriverId : undefined,
    serviceId: typeof uServiceId === "number" ? uServiceId : undefined,
    statusPagamento: uStatus ? (uStatus as any) : undefined,
    limit: uLimit,
    offset: uOffset,
    sortOrder: uSortOrder,
  });
  return (
    <>
      <DateQuickFilters
        start={uStart}
        end={uEnd}
        onChange={({ start, end }) => { setUStart(start); setUEnd(end); }}
        className="mb-4"
      />
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4">
        <Select value={uTipo} onValueChange={(v) => setUTipo(v as any)}>
          <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="vehicle">Veículo</SelectItem>
            <SelectItem value="company">Empresa</SelectItem>
            <SelectItem value="driver_payment">Pagamento Motorista</SelectItem>
            <SelectItem value="service">Serviço (custos)</SelectItem>
          </SelectContent>
        </Select>
        <Input value={uCategoria} onChange={(e) => setUCategoria(e.target.value)} placeholder="Categoria" />
        <Input type="number" value={uVehicleId} onChange={(e) => setUVehicleId(Number(e.target.value) || "")} placeholder="Vehicle ID" />
        <Input type="number" value={uDriverId} onChange={(e) => setUDriverId(Number(e.target.value) || "")} placeholder="Driver ID" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
        <Input type="number" value={uServiceId} onChange={(e) => setUServiceId(Number(e.target.value) || "")} placeholder="Service ID" />
        <Select value={uStatus} onValueChange={setUStatus}>
          <SelectTrigger><SelectValue placeholder="Status Pagamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="partial">Parcial</SelectItem>
            <SelectItem value="overdue">Atrasado</SelectItem>
            <SelectItem value="canceled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={uSortOrder} onValueChange={(v) => setUSortOrder(v as any)}>
          <SelectTrigger><SelectValue placeholder="Ordem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Desc</SelectItem>
            <SelectItem value="asc">Asc</SelectItem>
          </SelectContent>
        </Select>
        <Input type="number" value={uLimit} onChange={(e) => setULimit(Number(e.target.value) || 50)} placeholder="Limite" />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUOffset(Math.max(0, uOffset - uLimit))}>Anterior</Button>
          <Button variant="outline" onClick={() => setUOffset(uOffset + uLimit)}>Próximo</Button>
        </div>
      </div>
      <Button onClick={() => refetchUnified()} disabled={isLoadingUnified}>Filtrar</Button>
      {isLoadingUnified && <div className="text-muted-foreground mt-4">Carregando...</div>}
      {isErrorUnified && <div className="text-destructive mt-4">Erro ao carregar despesas unificadas.</div>}
      {unifiedRows && (
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Categoria/Descrição</TableHead>
              <TableHead>Centro</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unifiedRows.map((r) => (
              <UnifiedRowWithDelete key={`${r.tipo}-${r.id}`} r={r} onDeleted={() => refetchUnified()} />
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}

function UnifiedRowWithDelete({ r, onDeleted }: { r: any; onDeleted: () => void }) {
  const delUnified = useDeleteUnifiedExpense();
  const updateCompany = useUpdateCompanyExpense();
  const updateVehicle = useUpdateVehicleExpense();
  return (
    <TableRow>
      <TableCell>{r.id}</TableCell>
      <TableCell>
        {r.tipo === "vehicle" ? "Veículo" : r.tipo === "company" ? "Empresa" : r.tipo === "driver_payment" ? "Motorista" : "Serviço"}
      </TableCell>
      <TableCell>{new Date(r.ocorridaEm).toLocaleDateString("pt-BR")}</TableCell>
      <TableCell>
        {"categoria" in r ? r.categoria : "observacao" in r ? (r.observacao || "-") : "-"}
      </TableCell>
      <TableCell>
        {"vehicleId" in r && (r as any).vehicleId ? `Veículo #${(r as any).vehicleId}` :
          "driverId" in r && (r as any).driverId ? `Motorista #${(r as any).driverId}` :
          "serviceId" in r && (r as any).serviceId ? (() => {
            const sid = String((r as any).serviceId);
            return `Serviço #${sid.length > 4 ? "…" + sid.slice(-4) : sid}`;
          })() : "-"}
      </TableCell>
      <TableCell>
        {r.tipo === "service" ? "-" : (
          <div className="flex items-center gap-2">
            <Badge variant={r.statusPagamento === "paid" ? "default" : "secondary"}>
              {r.statusPagamento === "paid" ? "Pago" : "Pendente"}
            </Badge>
            {r.tipo === "company" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date().toISOString();
                  updateCompany.mutate({
                    id: r.id,
                    statusPagamento: r.statusPagamento === "paid" ? "pending" : "paid",
                    pagoEm: r.statusPagamento === "paid" ? undefined : now,
                  }, { onSuccess: onDeleted });
                }}
                disabled={updateCompany.isPending}
              >
                {r.statusPagamento === "paid" ? "Marcar pendente" : "Marcar pago"}
              </Button>
            )}
            {r.tipo === "vehicle" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const now = new Date().toISOString();
                  updateVehicle.mutate({
                    id: r.id,
                    statusPagamento: r.statusPagamento === "paid" ? "pending" : "paid",
                    pagoEm: r.statusPagamento === "paid" ? undefined : now,
                  }, { onSuccess: onDeleted });
                }}
                disabled={updateVehicle.isPending}
              >
                {r.statusPagamento === "paid" ? "Marcar pendente" : "Marcar pago"}
              </Button>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>{(r.valorCentavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
      <TableCell className="text-right">
        {r.tipo === "service" ? (
          <Button variant="ghost" size="icon" disabled title="Edite custos no serviço">
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (!confirm("Confirmar exclusão desta despesa?")) return;
              delUnified.mutate(
                { tipo: r.tipo, id: r.id },
                { onSuccess: onDeleted }
              );
            }}
            disabled={delUnified.isPending}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

function UnifiedExpenseCreate({ drivers, vehicles, createUnified }: { drivers: any[] | undefined; vehicles: any[] | undefined; createUnified: any }) {
  const [tipo, setTipo] = useState<"vehicle"|"company"|"driver_payment"|"">("");
  const [valorDisplay, setValorDisplay] = useState<string>("R$ 0,00");
  const [categoria, setCategoria] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [pagoPara, setPagoPara] = useState<string>("");
  const [ocorridaEm, setOcorridaEm] = useState<string>("");
  const [repetirMensal, setRepetirMensal] = useState<boolean>(false);
  const [repetirMeses, setRepetirMeses] = useState<number | "">("");
  const [vehicleId, setVehicleId] = useState<number | "">("");
  const [driverId, setDriverId] = useState<number | "">("");
  const [metodo, setMetodo] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [pagoEm, setPagoEm] = useState<string>("");
  const [observacao, setObservacao] = useState<string>("");
  const toCents = () => {
    const digits = valorDisplay.replace(/\D/g, "");
    return digits ? parseInt(digits, 10) : 0;
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
      <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
        <SelectTrigger><SelectValue placeholder="Tipo de Despesa" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="vehicle">Veículo</SelectItem>
          <SelectItem value="company">Empresa</SelectItem>
          <SelectItem value="driver_payment">Pagamento Motorista</SelectItem>
        </SelectContent>
      </Select>
      {tipo === "vehicle" && (
        <>
          <Select onValueChange={(v) => setVehicleId(Number(v))} value={typeof vehicleId === "number" ? String(vehicleId) : ""}>
            <SelectTrigger><SelectValue placeholder="Veículo" /></SelectTrigger>
            <SelectContent>
              {vehicles?.map((v: any) => (
                <SelectItem key={v.id} value={String(v.id)}>{v.model} ({v.plate})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Categoria" />
          <Input
            type="text"
            value={valorDisplay}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              const cents = digits ? parseInt(digits, 10) : 0;
              const amount = cents / 100;
              setValorDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
            }}
            placeholder="Valor"
          />
          <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição (opcional)" />
          <Input type="date" value={ocorridaEm} onChange={(e) => setOcorridaEm(e.target.value)} placeholder="Data (opcional)" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status (Pago/Pendente)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
            </SelectContent>
          </Select>
          
        </>
      )}
      {tipo === "company" && (
        <>
          <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Categoria" />
          <Input
            type="text"
            value={valorDisplay}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              const cents = digits ? parseInt(digits, 10) : 0;
              const amount = cents / 100;
              setValorDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
            }}
            placeholder="Valor"
          />
          <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição (opcional)" />
          <Input value={pagoPara} onChange={(e) => setPagoPara(e.target.value)} placeholder="Pago para (opcional)" />
          <Input type="date" value={ocorridaEm} onChange={(e) => setOcorridaEm(e.target.value)} placeholder="Data (opcional)" />
          <div className="flex items-center gap-2 md:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={repetirMensal}
                onChange={(e) => setRepetirMensal(e.target.checked)}
              />
              Repetir mensalmente
            </label>
            {repetirMensal && (
              <Input
                type="number"
                min={1}
                value={repetirMeses === "" ? "" : repetirMeses}
                onChange={(e) => setRepetirMeses(Number(e.target.value) || "")}
                placeholder="Qtd. meses"
              />
            )}
          </div>
          
        </>
      )}
      {tipo === "driver_payment" && (
        <>
          <Select onValueChange={(v) => setDriverId(Number(v))}>
            <SelectTrigger><SelectValue placeholder="Selecione o motorista" /></SelectTrigger>
            <SelectContent>
              {drivers?.map((d: any) => (
                <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="text"
            value={valorDisplay}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              const cents = digits ? parseInt(digits, 10) : 0;
              const amount = cents / 100;
              setValorDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
            }}
            placeholder="Valor"
          />
          <Select value={metodo} onValueChange={setMetodo}>
            <SelectTrigger><SelectValue placeholder="Método (opcional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="cash">Dinheiro</SelectItem>
              <SelectItem value="credit_card">Cartão crédito</SelectItem>
              <SelectItem value="debit_card">Cartão débito</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status (Pago/Pendente)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={pagoEm} onChange={(e) => setPagoEm(e.target.value)} placeholder="Pago em (opcional)" />
          <Input value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Observação (opcional)" />
        </>
      )}
      <div className="md:col-span-6">
        <Button
          onClick={async () => {
            if (!tipo) return;
            if (tipo === "vehicle" && typeof vehicleId === "number" && categoria) {
              createUnified.mutate({
                tipo,
                vehicleId,
                categoria,
                valorCentavos: toCents(),
                descricao: descricao || undefined,
                ocorridaEm: ocorridaEm ? new Date(ocorridaEm).toISOString() : undefined,
                statusPagamento: status ? (status as any) : undefined,
              });
            } else if (tipo === "company" && categoria) {
              const baseDate = ocorridaEm ? new Date(ocorridaEm) : new Date();
              const months = repetirMensal && typeof repetirMeses === "number" && repetirMeses > 0 ? repetirMeses : 1;
              for (let i = 0; i < months; i++) {
                const d = addMonths(baseDate, i);
                await createUnified.mutateAsync({
                  tipo,
                  categoria,
                  valorCentavos: toCents(),
                  descricao: descricao || undefined,
                  pagoPara: pagoPara || undefined,
                  ocorridaEm: d.toISOString(),
                  statusPagamento: status ? (status as any) : undefined,
                  pagoEm: pagoEm ? new Date(pagoEm).toISOString() : undefined,
                });
              }
            } else if (tipo === "driver_payment" && typeof driverId === "number") {
              createUnified.mutate({
                tipo,
                driverId,
                valorCentavos: toCents(),
                metodoPagamento: metodo ? (metodo as any) : undefined,
                statusPagamento: status ? (status as any) : undefined,
                pagoEm: pagoEm ? new Date(pagoEm).toISOString() : undefined,
                observacao: observacao || undefined,
              });
            }
          }}
          disabled={createUnified.isPending}
        >
          Adicionar
        </Button>
      </div>
    </div>
  );
}
