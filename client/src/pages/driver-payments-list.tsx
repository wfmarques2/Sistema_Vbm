import { Layout } from "@/components/layout";
import { useServices } from "@/hooks/use-services";
import { useUpdateServiceExpenses } from "@/hooks/use-financial";
import { useDrivers } from "@/hooks/use-drivers";
import { format } from "date-fns";
import { es, ptBR } from "date-fns/locale";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { DateQuickFilters } from "@/components/date-quick-filters";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Search } from "lucide-react";

export default function DriverPaymentsListPage() {
  const { language, t } = useI18n();
  const dateLocale = language === "es" ? es : ptBR;
  const numberLocale = language === "es" ? "es-ES" : "pt-BR";
  const { toast } = useToast();
  
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [driverId, setDriverId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: drivers } = useDrivers();
  const { data: services, isLoading } = useServices({
    start: start || undefined,
    end: end || undefined,
    onlyDriverPayments: true as any, // Cast because hook type might not be updated yet
  } as any);

  const updateExpenses = useUpdateServiceExpenses(0);

  const filteredServices = (services || []).filter((s: any) => {
    const matchesDriver = driverId === "all" || String(s.driverId) === driverId;
    const matchesStatus = status === "all" || s.driverPaymentStatus === status;
    const matchesSearch = 
      s.clientName.toLowerCase().includes(search.toLowerCase()) ||
      s.origin.toLowerCase().includes(search.toLowerCase()) ||
      s.destination.toLowerCase().includes(search.toLowerCase());
    return matchesDriver && matchesStatus && matchesSearch;
  });

  const handleMarkAsPaid = async (service: any) => {
    try {
      await updateExpenses.mutateAsync({
        ...service,
        driverPaymentStatus: "paid",
        driverPaymentDate: service.driverPaymentDate || new Date().toISOString(),
      });
      toast({
        title: "Sucesso",
        description: `Pagamento do serviço #${service.id} marcado como pago.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPending = async (service: any) => {
    try {
      await updateExpenses.mutateAsync({
        ...service,
        driverPaymentStatus: "pending",
      });
      toast({
        title: "Sucesso",
        description: `Pagamento do serviço #${service.id} marcado como pendente.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-primary">Pagamentos de Motoristas</h2>
        <p className="text-muted-foreground">Gerencie os pagamentos devidos aos motoristas por serviços realizados.</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1 block">Período</label>
                <DateQuickFilters
                  start={start}
                  end={end}
                  onChange={({ start, end }) => {
                    setStart(start);
                    setEnd(end);
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Motorista</label>
                <Select value={driverId} onValueChange={setDriverId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os motoristas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os motoristas</SelectItem>
                    {drivers?.map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <Input 
                placeholder="Buscar por cliente, origem ou destino..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Data Viagem</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Chave PIX</TableHead>
                  <TableHead>Cliente / Rota</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Carregando pagamentos...
                    </TableCell>
                  </TableRow>
                ) : filteredServices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhum pagamento encontrado com os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServices.map((service: any) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">#{String(service.id).padStart(4, "0")}</TableCell>
                      <TableCell>
                        {format(new Date(service.dateTime), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}
                      </TableCell>
                      <TableCell>{service.driver?.name || "Não atribuído"}</TableCell>
                      <TableCell>
                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                          {service.driver?.pixKey || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{service.clientName}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {service.origin} → {service.destination}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {(service.driverPaymentCents / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" })}
                      </TableCell>
                      <TableCell>
                        {service.driverPaymentDate 
                          ? format(new Date(service.driverPaymentDate), 'dd/MM/yyyy', { locale: dateLocale })
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {service.driverPaymentStatus === "paid" ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Pago
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 gap-1">
                            <Clock className="w-3 h-3" /> Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {service.driverPaymentStatus === "paid" ? (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleMarkAsPending(service)}
                          >
                            Estornar
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-green-600 text-green-600 hover:bg-green-50"
                            onClick={() => handleMarkAsPaid(service)}
                          >
                            Marcar Pago
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
