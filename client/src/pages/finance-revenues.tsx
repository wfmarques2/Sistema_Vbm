import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useListRevenues, useCreateRevenue, useDeleteRevenue } from "@/hooks/use-financial";
import { useClients } from "@/hooks/use-clients";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError, redirectToLogin } from "@/lib/auth-utils";
import { DateQuickFilters } from "@/components/date-quick-filters";
import { Filter } from "lucide-react";

export default function FinanceRevenuesPage() {
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const { data: revenues } = useListRevenues({ start: start || undefined, end: end || undefined, sortOrder: "desc" });
  const { data: clients } = useClients();
  const createMutation = useCreateRevenue();
  const deleteMutation = useDeleteRevenue();
  const { toast } = useToast();

  const [type, setType] = useState<"manual"|"client_topup">("manual");
  const [categoria, setCategoria] = useState<string>("");
  const [valor, setValor] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [clientId, setClientId] = useState<number | "">("");
  const [metodo, setMetodo] = useState<string>("pix");
  const [dataRecebida, setDataRecebida] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const monthOptions = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const toDateInput = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const total = (revenues || []).reduce((acc, r) => acc + Number(r.valorCentavos || 0), 0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  function currencyToCents(s: string) {
    const digits = s.replace(/\D/g, "");
    return digits ? parseInt(digits, 10) : 0;
  }

  function formatCurrencyBR(input: string) {
    const digits = input.replace(/\D/g, "");
    if (!digits) return "";
    const padded = digits.padStart(3, "0");
    const cents = padded.slice(-2);
    let units = padded.slice(0, -2).replace(/^0+/, "") || "0";
    units = units.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${units},${cents}`;
    }

  async function addRevenue() {
    try {
      if (!valor || currencyToCents(valor) <= 0) {
        toast({ title: "Valor inválido", description: "Informe um valor maior que zero.", variant: "destructive" });
        return;
      }
      if (type === "manual") {
        await createMutation.mutateAsync({
          tipo: "manual",
          categoria: categoria || "Receita",
          valorCentavos: currencyToCents(valor),
          descricao: descricao || undefined,
          recebidaEm: dataRecebida || undefined,
          metodoPagamento: metodo,
        });
      } else {
        const cid = typeof clientId === "number" ? clientId : undefined;
        if (!cid) {
          toast({ title: "Cliente obrigatório", description: "Selecione um cliente para crédito de saldo.", variant: "destructive" });
          return;
        }
        await createMutation.mutateAsync({
          tipo: "client_topup",
          clientId: cid,
          valorCentavos: currencyToCents(valor),
          descricao: descricao || undefined,
          recebidaEm: dataRecebida || undefined,
          metodoPagamento: metodo,
        });
      }
      toast({ title: "Registro salvo", description: "Receita adicionada com sucesso." });
      setCategoria(""); setValor(""); setDescricao(""); setClientId(""); setDataRecebida("");
    } catch (err: any) {
      const message = err?.message || "Erro ao salvar receita";
      toast({ title: "Erro", description: message, variant: "destructive" });
      if (isUnauthorizedError(err)) {
        redirectToLogin((opts) => toast({ title: opts.title, description: opts.description, variant: opts.variant as any }));
      }
    }
  }

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Receitas</h2>
          <p className="text-muted-foreground">Entradas financeiras por serviços, outras origens e créditos de clientes.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adicionar Receita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Outro</SelectItem>
                <SelectItem value="client_topup">Saldo de Cliente</SelectItem>
              </SelectContent>
            </Select>
            {type === "manual" ? (
              <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Categoria" />
            ) : (
              <Select value={String(clientId)} onValueChange={(v) => setClientId(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Cliente" /></SelectTrigger>
                <SelectContent>
                  {clients?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Input value={valor} onChange={(e) => setValor(formatCurrencyBR(e.target.value))} placeholder="Valor (ex: 1.234,56)" />
            <Select value={metodo} onValueChange={setMetodo}>
              <SelectTrigger><SelectValue placeholder="Método" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="credit_card">Cartão crédito</SelectItem>
                <SelectItem value="debit_card">Cartão débito</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={dataRecebida} onChange={(e) => setDataRecebida(e.target.value)} placeholder="Data" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição (opcional)" />
            <Button onClick={addRevenue} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Salvando..." : "Adicionar Receita"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Receitas no Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="min-w-44">
              <Select
                value={filterMonth}
                onValueChange={(v) => {
                  setFilterMonth(v);
                  if (v === "all") {
                    setStart("");
                    setEnd("");
                    return;
                  }
                  const year = new Date().getFullYear();
                  const month = Number(v);
                  const monthStart = new Date(year, month, 1);
                  const monthEnd = new Date(year, month + 1, 0);
                  setStart(toDateInput(monthStart));
                  setEnd(toDateInput(monthEnd));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {monthOptions.map((m, idx) => (
                    <SelectItem key={m} value={String(idx)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => setShowFilters((s) => !s)}>
              <Filter className="w-4 h-4" />
              {showFilters ? "Ocultar filtros" : "Filtros"}
            </Button>
            <div className="ml-auto text-right">
              <span className="text-sm text-muted-foreground">Total:</span>{" "}
              <span className="text-lg font-semibold">
                {(total / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          </div>
          {showFilters && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 mb-4">
              <DateQuickFilters
                start={start}
                end={end}
                onChange={({ start: s, end: e }) => {
                  setStart(s);
                  setEnd(e);
                  setFilterMonth("all");
                }}
              />
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(revenues || []).map((r) => {
                const isExpanded = expandedId === r.id;
                const clientName = r.clientId ? clients?.find(c => c.id === r.clientId)?.name : undefined;
                return (
                  <>
                    <TableRow key={`${r.tipo}-${r.id}`} className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : r.id)}>
                      <TableCell>{new Date(r.ocorridaEm).toLocaleString()}</TableCell>
                      <TableCell>{r.tipo === "service" ? "Serviço" : r.tipo === "client_topup" ? "Saldo de Cliente" : "Outro"}</TableCell>
                      <TableCell>{r.descricao || "-"}</TableCell>
                      <TableCell>{r.metodoPagamento || "-"}</TableCell>
                      <TableCell className="font-medium">{(r.valorCentavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`details-${r.tipo}-${r.id}`} className="bg-muted/30">
                        <TableCell colSpan={5}>
                          <div className="flex items-center justify-between">
                            <div className="text-sm space-y-1">
                              <div><span className="text-muted-foreground">ID:</span> {r.id}</div>
                              <div><span className="text-muted-foreground">Data:</span> {new Date(r.ocorridaEm).toLocaleString()}</div>
                              <div><span className="text-muted-foreground">Tipo:</span> {r.tipo}</div>
                              {r.clientId != null && (
                                <div><span className="text-muted-foreground">Cliente:</span> {clientName ? `${clientName} (#${r.clientId})` : `ID ${r.clientId}`}</div>
                              )}
                              {r.serviceId != null && (
                                <div><span className="text-muted-foreground">Serviço ID:</span> {r.serviceId}</div>
                              )}
                              <div><span className="text-muted-foreground">Método:</span> {r.metodoPagamento || "-"}</div>
                              <div><span className="text-muted-foreground">Descrição:</span> {r.descricao || "-"}</div>
                            </div>
                            {r.tipo !== "service" && (
                              <Button
                                variant="destructive"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!confirm("Excluir esta receita?")) return;
                                  try {
                                    await deleteMutation.mutateAsync(r.id);
                                    toast({ title: "Excluída", description: "Receita removida com sucesso." });
                                    setExpandedId(null);
                                  } catch (err: any) {
                                    toast({ title: "Erro", description: err?.message || "Falha ao excluir receita", variant: "destructive" });
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                              >
                                Excluir
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Layout>
  );
}
