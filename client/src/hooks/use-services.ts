import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertService } from "@shared/schema";
import { z } from "zod";

type ServiceFilters = z.infer<NonNullable<typeof api.services.list.input>>;

export function useServices(filters?: ServiceFilters) {
  const queryKey = [api.services.list.path, filters];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL(api.services.list.path, window.location.origin);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) url.searchParams.append(key, String(value));
        });
      }
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch services");
      return api.services.list.responses[200].parse(await res.json());
    },
  });
}

export function useServicesPaged(filters?: Partial<ServiceFilters & {
  vehicleId?: number;
  statusPagamento?: string;
  paymentMethod?: string;
}>, limit = 20, offset = 0) {
  const queryKey = [api.services.list.path, filters, limit, offset];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL(api.services.list.path, window.location.origin);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") url.searchParams.append(key, String(value));
        });
      }
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("offset", String(offset));
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch services");
      const rows = api.services.list.responses[200].parse(await res.json());
      const totalHeader = res.headers.get("X-Total-Count");
      const total = totalHeader ? Number(totalHeader) : rows.length;
      return { rows, total };
    },
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertService) => {
      const validated = api.services.create.input.parse(data);
      const res = await fetch(api.services.create.path, {
        method: api.services.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.services.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        try {
          const body = await res.json();
          throw new Error(body?.message || "Falha ao criar serviço");
        } catch {
          throw new Error("Falha ao criar serviço");
        }
      }
      return api.services.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.services.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Sucesso", description: "Serviço agendado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertService>) => {
      const validated = api.services.update.input.parse(updates);
      const url = buildUrl(api.services.update.path, { id });
      const res = await fetch(url, {
        method: api.services.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao atualizar serviço");
      return api.services.update.responses[200].parse(await res.json());
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.services.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      // Atualiza saldos em Clientes quando um serviço altera pagamento (ex.: saldo)
      queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/financial/services/:id/profit", variables.id] });
      }
      toast({ title: "Sucesso", description: "Serviço atualizado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.services.delete.path, { id });
      const res = await fetch(url, { method: api.services.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Falha ao excluir serviço");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.services.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({ title: "Sucesso", description: "Serviço excluído com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
}
