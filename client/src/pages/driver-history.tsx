import { Layout } from "@/components/layout";
import { useServicesPaged } from "@/hooks/use-services";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DriverHistoryPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const limit = 20;
  const { data, isLoading } = useServicesPaged(undefined, limit, page * limit);

  const rows = data?.rows || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const statusLabel = (s: string) =>
    s === "scheduled" ? "Agendado" :
    s === "driving_pickup" ? "Direção embarque" :
    s === "pickup_location" ? "Local embarque" :
    s === "driving_destination" ? "Direção destino" :
    s === "in_progress" ? "Direção destino" :
    s === "finished" ? "Finalizado" :
    s === "canceled" ? "Cancelado" : s;

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-3xl font-display font-bold text-primary">Histórico de Viagens</h2>
        <p className="text-muted-foreground">Todas as viagens vinculadas ao motorista.</p>
      </div>
      <div className="bg-card rounded-xl border border-border">
        {isLoading ? (
          <div className="p-6 text-muted-foreground">Carregando...</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-muted-foreground">Nenhuma viagem encontrada.</div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((s: any) => (
              <div key={s.id} className="p-4 flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(s.dateTime), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                  <div className="font-semibold text-primary">{s.clientName}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {s.origin} → {s.destination}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="secondary">
                    {statusLabel(s.status)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="p-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Página {page + 1} de {totalPages}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              Anterior
            </Button>
            <Button variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
