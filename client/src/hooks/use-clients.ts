import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertClient, InsertClientDependent } from "@shared/schema";

export function useClients() {
  return useQuery({
    queryKey: [api.clients.list.path],
    queryFn: async () => {
      try {
        const res = await fetch(api.clients.list.path, { credentials: "include" });
        if (!res.ok) {
          console.error(`[useClients] HTTP ${res.status}`);
          return [];
        }
        const data = await res.json();
        return api.clients.list.responses[200].parse(data);
      } catch (err) {
        console.error(`[useClients] fetch error`, err);
        return [];
      }
    },
  });
}

export function useClient(id: number) {
  return useQuery({
    queryKey: [api.clients.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.clients.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch client");
      return api.clients.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useClientDependents(clientId: number) {
  return useQuery({
    queryKey: [api.clients.dependents.list.path, clientId],
    queryFn: async () => {
      const url = buildUrl(api.clients.dependents.list.path, { id: clientId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dependents");
      return api.clients.dependents.list.responses[200].parse(await res.json());
    },
    enabled: !!clientId,
  });
}

export function useCreateClientDependent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ clientId, ...data }: { clientId: number } & Omit<InsertClientDependent, "clientId">) => {
      const url = buildUrl(api.clients.dependents.create.path, { id: clientId });
      const res = await fetch(url, {
        method: api.clients.dependents.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao adicionar dependente");
      return api.clients.dependents.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Invalida e força o re-fetch imediato de todas as queries relacionadas a clientes
      queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.clients.dependents.list.path, variables.clientId] });
      queryClient.invalidateQueries({ queryKey: [api.clients.get.path, variables.clientId] });
      
      toast({ 
        title: "Registro Salvo", 
        description: "Dependente adicionado com sucesso",
      });
    },
  });
}

export function useDeleteClientDependent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: number, clientId: number }) => {
      const url = buildUrl(api.clients.dependents.delete.path, { id });
      const res = await fetch(url, { method: api.clients.dependents.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Falha ao remover dependente");
    },
    onSuccess: (_, variables) => {
      // Invalida e força o re-fetch imediato
      queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.clients.dependents.list.path, variables.clientId] });
      queryClient.invalidateQueries({ queryKey: [api.clients.get.path, variables.clientId] });
      
      toast({ 
        title: "Cliente salvo", 
        description: "Dependente removido com sucesso",
      });
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertClient) => {
      const validated = api.clients.create.input.parse(data);
      const res = await fetch(api.clients.create.path, {
        method: api.clients.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.clients.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Falha ao criar cliente");
      }
      return api.clients.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
      toast({ title: "Sucesso", description: "Cliente criado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertClient>) => {
      const validated = api.clients.update.input.parse(updates);
      const url = buildUrl(api.clients.update.path, { id });
      const res = await fetch(url, {
        method: api.clients.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao atualizar cliente");
      return api.clients.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
      toast({ title: "Registro Salvo", description: "Cliente atualizado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.clients.delete.path, { id });
      const res = await fetch(url, { method: api.clients.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Falha ao excluir cliente");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.clients.list.path] });
      toast({ title: "Sucesso", description: "Cliente excluído com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
}
