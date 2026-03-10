import { Layout } from "@/components/layout";
import { useUsers, useAddUser, useUpdateUserRole, useLinkUserDriver } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminCreateUserSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useDrivers } from "@/hooks/use-drivers";

export default function SettingsPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();
  const { data: drivers, isLoading: loadingDrivers } = useDrivers();
  const addUserMutation = useAddUser();
  const updateRoleMutation = useUpdateUserRole();
  const linkUserDriverMutation = useLinkUserDriver();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm({
    resolver: zodResolver(adminCreateUserSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "operational" as "admin" | "operational" | "driver",
    }
  });

  const onSubmit = async (values: any) => {
    await addUserMutation.mutateAsync(values);
    setIsDialogOpen(false);
    form.reset();
  };

  if (currentUser?.role !== "admin") {
      return (
          <Layout>
              <div className="flex flex-col items-center justify-center h-full">
                  <h1 className="text-2xl font-bold">Acesso Negado</h1>
                  <p>Você não tem permissão para acessar esta página.</p>
              </div>
          </Layout>
      )
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Configurações</h2>
          <p className="text-muted-foreground">Gerencie usuários e permissões do sistema.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary shadow-lg hover:shadow-primary/30">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="João da Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Função</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma função" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="operational">Operacional</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="driver">Motorista</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={addUserMutation.isPending}>
                  {addUserMutation.isPending ? "Adicionando..." : "Adicionar Usuário"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Carregando...</TableCell>
              </TableRow>
            ) : users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.firstName} {user.lastName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.role || "operational"}
                    onValueChange={(value) => {
                      updateRoleMutation.mutate({ userId: user.id, role: value as "admin" | "operational" | "driver" });
                    }}
                    disabled={updateRoleMutation.isPending}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operacional</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="driver">Motorista</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {user.role === "driver" ? (
                    <Select
                      value={(user as any).driverId == null ? "none" : String((user as any).driverId)}
                      onValueChange={(value) => {
                        const driverId = value === "none" ? null : Number(value);
                        linkUserDriverMutation.mutate({ userId: user.id, driverId });
                      }}
                      disabled={linkUserDriverMutation.isPending || loadingDrivers}
                    >
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Vincular motorista" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Sem vínculo —</SelectItem>
                        {(drivers || []).map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name} {d.email ? `(${d.email})` : "(sem e-mail)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {/* Como saber se está ativo? Se tiver localAuth ou password. 
                      Mas a API de listagem de usuários não retorna isso explicitamente.
                      Assumindo que todos listados são usuários criados. */}
                   <span className="text-muted-foreground">Cadastrado</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}
