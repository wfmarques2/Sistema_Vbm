import { Layout } from "@/components/layout";
import { useDrivers, useCreateDriver, useUpdateDriver, useDeleteDriver } from "@/hooks/use-drivers";
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
import { Plus, Pencil, Trash2, Phone, Calendar, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDriverSchema, driverTypeEnum } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DriversPage() {
  const { data: drivers, isLoading } = useDrivers();
  const createMutation = useCreateDriver();
  const updateMutation = useUpdateDriver();
  const deleteMutation = useDeleteDriver();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [initializedFromQuery, setInitializedFromQuery] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertDriverSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      type: "fixed",
      licenseValidity: new Date().toISOString().split('T')[0],
      notes: "",
      active: true,
    }
  });

  if (!initializedFromQuery) {
    const params = new URLSearchParams(window.location.search);
    if (params.get("new")) {
      setEditingId(null);
      form.reset();
      setIsDialogOpen(true);
    }
    setInitializedFromQuery(true);
  }

  const onSubmit = async (values: any) => {
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setIsDialogOpen(false);
    setEditingId(null);
    form.reset();
  };

  const handleEdit = (driver: any) => {
    setEditingId(driver.id);
    form.reset({
      ...driver,
      email: driver.email || "",
      licenseValidity: driver.licenseValidity ? new Date(driver.licenseValidity).toISOString().split('T')[0] : "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este motorista?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Motoristas</h2>
          <p className="text-muted-foreground">Gerencie a equipe de motoristas.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); form.reset(); }} className="bg-primary shadow-lg hover:shadow-primary/30">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Motorista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Motorista" : "Adicionar Motorista"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail (login do motorista)</FormLabel>
                      <FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vínculo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecione o vínculo" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {driverTypeEnum.map(t => (
                              <SelectItem key={t} value={t}>
                                {t === "fixed" ? "Fixo" : t === "freelance" ? "Autônomo" : t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="licenseValidity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Validade da CNH</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Atualizar Motorista" : "Criar Motorista"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Vínculo</TableHead>
              <TableHead>Validade CNH</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando motoristas...</TableCell></TableRow>
            ) : drivers?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum motorista encontrado.</TableCell></TableRow>
            ) : (
              drivers?.map((driver) => (
                <TableRow key={driver.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{driver.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="w-3 h-3 mr-1" />
                      {driver.phone}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{driver.email || "—"}</TableCell>
                  <TableCell className="capitalize">
                    {driver.type === "fixed" ? "Fixo" : driver.type === "freelance" ? "Autônomo" : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-3 h-3 mr-1" />
                      {format(new Date(driver.licenseValidity), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {driver.active ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Ativo</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <MoreHorizontal className="w-4 h-4" />
                          Ações
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(driver)}>
                          <Pencil className="w-4 h-4 text-blue-600" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(driver.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}
