import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/models/auth";
import { AdminCreateUser, RegisterPassword } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ["/api/users"],
  });
}

export function useAddUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: AdminCreateUser) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || await res.text());
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário adicionado",
        description: "O usuário foi cadastrado e aguarda a definição de senha.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "operational" | "driver" }) => {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Falha ao atualizar função");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Função atualizada",
        description: "As permissões do usuário foram atualizadas.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar função",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRegisterSetup() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: RegisterPassword) => {
      const res = await fetch("/api/auth/register-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || await res.text());
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Senha registrada com sucesso",
        description: "Você já pode acessar o sistema.",
      });
      // Redirect handled by component or window location
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useLinkUserDriver() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ userId, driverId }: { userId: string; driverId: number | null }) => {
      const res = await fetch(`/api/users/${userId}/driver`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || "Falha ao vincular motorista");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Vínculo atualizado", description: "Usuário vinculado ao motorista." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao vincular", description: error.message, variant: "destructive" });
    },
  });
}
