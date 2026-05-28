import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Receipt, Trash2, Filter, Car } from "lucide-react";
import { useListVehicleExpenses, useCreateVehicleExpense, useDisableVehicleExpense } from "@/hooks/use-financial";
import { useVehicles } from "@/hooks/use-vehicles";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n";
import { useLocation, useRoute } from "wouter";

export default function VehicleExpensesPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/vehicles/expenses/:id");
  
  const { data: vehicles } = useVehicles();
  
  // Filtros
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(params?.id || "all");
  const [filterCategoria, setFilterCategoria] = useState("all");
  
  // Estado do Formulário
  const [categoria, setCategoria] = useState("combustivel");
  const [valorDisplay, setValorDisplay] = useState("R$ 0,00");
  const [descricao, setDescricao] = useState("");
  const [odometer, setOdometer] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));

  const { data: expenses, isLoading, refetch } = useListVehicleExpenses(
    selectedVehicleId !== "all" ? { vehicleId: parseInt(selectedVehicleId) } : undefined
  );
  
  const createMutation = useCreateVehicleExpense();
  const disableMutation = useDisableVehicleExpense();

  useEffect(() => {
    if (params?.id) {
      setSelectedVehicleId(params.id);
    }
  }, [params?.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVehicleId === "all") {
      toast({ title: "Erro", description: "Selecione um veículo para adicionar a despesa.", variant: "destructive" });
      return;
    }

    const digits = valorDisplay.replace(/\D/g, "");
    const valorCentavos = parseInt(digits) || 0;

    try {
      await createMutation.mutateAsync({
        vehicleId: parseInt(selectedVehicleId),
        categoria,
        valorCentavos,
        descricao,
        odometer: odometer ? parseInt(odometer) : undefined,
        ocorridaEm: new Date(data).toISOString(),
        statusPagamento: "paid"
      });

      toast({ title: "Sucesso", description: "Despesa adicionada corretamente." });
      setValorDisplay("R$ 0,00");
      setDescricao("");
      setOdometer("");
      refetch();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível adicionar a despesa.", variant: "destructive" });
    }
  };

  const handleDisable = async (id: number) => {
    if (!confirm("Confirmar exclusão desta despesa?")) return;
    try {
      await disableMutation.mutateAsync(id);
      toast({ title: "Sucesso", description: "Despesa removida." });
      refetch();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível remover a despesa.", variant: "destructive" });
    }
  };

  const filteredExpenses = expenses?.filter(exp => {
    const matchesCat = filterCategoria === "all" || exp.categoria === filterCategoria;
    // Se selecionou "all" veículos, os expenses podem vir de múltiplos ou ser filtrados pelo hook
    return matchesCat;
  });

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary flex items-center gap-3">
            <Receipt className="w-8 h-8" />
            Gestão de Despesas de Veículos
          </h2>
          <p className="text-muted-foreground">Cadastre e acompanhe os gastos da sua frota de forma detalhada.</p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/vehicles")}>
          Voltar para Frota
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna de Cadastro */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Nova Despesa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Veículo</label>
                  <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Selecione um veículo...</SelectItem>
                      {vehicles?.map(v => (
                        <SelectItem key={v.id} value={String(v.id)}>{v.model} ({v.plate})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Categoria</label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="combustivel">Combustível</SelectItem>
                      <SelectItem value="manutencao">Manutenção</SelectItem>
                      <SelectItem value="lavagem">Lavagem</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Valor</label>
                    <Input
                      value={valorDisplay}
                      onChange={e => {
                        const digits = e.target.value.replace(/\D/g, "");
                        const cents = digits ? parseInt(digits, 10) : 0;
                        setValorDisplay((cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Data</label>
                    <Input type="date" value={data} onChange={e => setData(e.target.value)} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">Odômetro (km)</label>
                  <Input
                    type="number"
                    placeholder="km atual..."
                    value={odometer}
                    onChange={e => setOdometer(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium">
                    {categoria === "manutencao" ? "Descrição da Manutenção" : "Descrição (opcional)"}
                  </label>
                  <Input
                    placeholder={categoria === "manutencao" ? "O que foi feito no veículo?" : "Detalhes da despesa..."}
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    required={categoria === "manutencao"}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending || selectedVehicleId === "all"}>
                  {createMutation.isPending ? "Adicionando..." : <><Plus className="w-4 h-4 mr-2" /> Adicionar Despesa</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Coluna de Listagem */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                Histórico de Gastos
              </CardTitle>
              
              <div className="flex items-center gap-3">
                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Todas Categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    <SelectItem value="combustivel">Combustível</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="lavagem">Lavagem</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>KM</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-10">Carregando despesas...</TableCell></TableRow>
                    ) : !selectedVehicleId || selectedVehicleId === "all" ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">Selecione um veículo no menu ao lado para ver o histórico.</TableCell></TableRow>
                    ) : filteredExpenses?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          Nenhuma despesa encontrada para este filtro.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredExpenses?.map(exp => {
                        const vehicle = vehicles?.find(v => v.id === exp.vehicleId);
                        return (
                          <TableRow key={exp.id} className={!exp.active ? "opacity-50" : "hover:bg-muted/30 transition-colors"}>
                            <TableCell className="text-sm">{exp.ocorridaEm ? format(new Date(exp.ocorridaEm), "dd/MM/yyyy") : "—"}</TableCell>
                            <TableCell className="text-sm font-medium">
                              {vehicle ? `${vehicle.model} (${vehicle.plate})` : `ID: ${exp.vehicleId}`}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium capitalize text-sm">{exp.categoria.replace("_", " ")}</div>
                              {exp.descricao && <div className="text-[11px] text-muted-foreground leading-tight">{exp.descricao}</div>}
                            </TableCell>
                            <TableCell className="text-sm">{exp.odometer ? `${exp.odometer} km` : "—"}</TableCell>
                            <TableCell className="font-semibold text-sm">{(exp.valorCentavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDisable(exp.id)}
                                disabled={!exp.active || disableMutation.isPending}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
