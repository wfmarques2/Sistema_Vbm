import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCreateKmLog, useListKmLogs } from "@/hooks/use-financial";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateQuickFilters } from "@/components/date-quick-filters";

export default function FinanceKmLogsPage() {
  const [vehicleId, setVehicleId] = useState<number | "">("");
  const [driverId, setDriverId] = useState<number | "">("");
  const [serviceId, setServiceId] = useState<number | "">("");
  const [logAt, setLogAt] = useState<string>("");
  const [odometroInicial, setOdometroInicial] = useState<number | "">("");
  const [odometroFinal, setOdometroFinal] = useState<number | "">("");
  const [observacao, setObservacao] = useState<string>("");
  const create = useCreateKmLog();

  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [filterVehicleId, setFilterVehicleId] = useState<number | "">("");
  const [filterDriverId, setFilterDriverId] = useState<number | "">("");
  const [filterServiceId, setFilterServiceId] = useState<number | "">("");
  const [limit, setLimit] = useState<number>(20);
  const [offset, setOffset] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<"asc"|"desc">("desc");
  const { data: rows, isLoading, isError, refetch } = useListKmLogs({
    start,
    end,
    vehicleId: typeof filterVehicleId === "number" ? filterVehicleId : undefined,
    driverId: typeof filterDriverId === "number" ? filterDriverId : undefined,
    serviceId: typeof filterServiceId === "number" ? filterServiceId : undefined,
    limit,
    offset,
    sortOrder,
  });

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-primary">Logs de KM de Veículo</h2>
        <p className="text-muted-foreground">Registro de odômetro por veículo e serviço.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Registrar Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Vehicle ID" value={vehicleId} onChange={(e) => setVehicleId(Number(e.target.value) || "")} />
            <Input placeholder="Driver ID (opcional)" value={driverId} onChange={(e) => setDriverId(Number(e.target.value) || "")} />
            <Input placeholder="Service ID (opcional)" value={serviceId} onChange={(e) => setServiceId(Number(e.target.value) || "")} />
            <Input type="datetime-local" placeholder="Log em (opcional)" value={logAt} onChange={(e) => setLogAt(e.target.value)} />
            <Input placeholder="Odômetro Inicial (km)" value={odometroInicial} onChange={(e) => setOdometroInicial(Number(e.target.value) || "")} />
            <Input placeholder="Odômetro Final (km)" value={odometroFinal} onChange={(e) => setOdometroFinal(Number(e.target.value) || "")} />
            <Input placeholder="Observação (opcional)" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
            <Button
              onClick={() =>
                typeof vehicleId === "number" &&
                create.mutate({
                  vehicleId,
                  driverId: typeof driverId === "number" ? driverId : undefined,
                  serviceId: typeof serviceId === "number" ? serviceId : undefined,
                  logAt: logAt || undefined,
                  odometroInicial: typeof odometroInicial === "number" ? odometroInicial : undefined,
                  odometroFinal: typeof odometroFinal === "number" ? odometroFinal : undefined,
                  observacao: observacao || undefined,
                })
              }
              disabled={create.isPending}
            >
              Salvar
            </Button>
            {create.isError && <div className="text-destructive text-sm">Erro ao registrar log.</div>}
            {create.isSuccess && <div className="text-green-600 text-sm">Log registrado.</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listagem</CardTitle>
          </CardHeader>
          <CardContent>
            <DateQuickFilters
              start={start}
              end={end}
              onChange={({ start: s, end: e }) => { setStart(s); setEnd(e); }}
              className="mb-4"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <Input type="number" value={filterVehicleId} onChange={(e) => setFilterVehicleId(Number(e.target.value) || "")} placeholder="Vehicle ID" />
              <Input type="number" value={filterDriverId} onChange={(e) => setFilterDriverId(Number(e.target.value) || "")} placeholder="Driver ID" />
              <Input type="number" value={filterServiceId} onChange={(e) => setFilterServiceId(Number(e.target.value) || "")} placeholder="Service ID" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
                <SelectTrigger><SelectValue placeholder="Ordem" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Desc</SelectItem>
                  <SelectItem value="asc">Asc</SelectItem>
                </SelectContent>
              </Select>
              <Input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value) || 20)} placeholder="Limite" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOffset(Math.max(0, offset - limit))}>Anterior</Button>
                <Button variant="outline" onClick={() => setOffset(offset + limit)}>Próximo</Button>
              </div>
            </div>
            <Button onClick={() => refetch()} disabled={isLoading}>Filtrar</Button>
            {isLoading && <div className="text-muted-foreground mt-4">Carregando...</div>}
            {isError && <div className="text-destructive mt-4">Erro ao carregar logs.</div>}
            {rows && (
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Log Em</TableHead>
                    <TableHead>Odômetro Inicial</TableHead>
                    <TableHead>Odômetro Final</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.id}</TableCell>
                      <TableCell>{r.vehicleId}</TableCell>
                      <TableCell>{r.driverId || "-"}</TableCell>
                      <TableCell>{r.serviceId || "-"}</TableCell>
                      <TableCell>{r.logAt ? new Date(r.logAt).toLocaleString() : "-"}</TableCell>
                      <TableCell>{r.odometroInicial ?? "-"}</TableCell>
                      <TableCell>{r.odometroFinal ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
