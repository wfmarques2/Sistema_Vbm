import { Layout } from "@/components/layout";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, useClientDependents, useCreateClientDependent, useDeleteClientDependent } from "@/hooks/use-clients";
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
import { Plus, Pencil, Trash2, Phone, Mail, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClientSchema, insertClientDependentSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ClientsPage() {
  const { data: clients, isLoading } = useClients();
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();
  const [saldoDisplay, setSaldoDisplay] = useState("R$ 0,00");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [initializedFromQuery, setInitializedFromQuery] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      nationality: "",
      documentType: "",
      documentNumber: "",
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
      const cents = Number(saldoDisplay.replace(/\D/g, "")) || 0;
      await updateMutation.mutateAsync({ id: editingId, ...values, balanceCentavos: cents });
    } else {
      const cents = Number(saldoDisplay.replace(/\D/g, "")) || 0;
      await createMutation.mutateAsync({ ...values, balanceCentavos: cents });
    }
    setIsDialogOpen(false);
    setEditingId(null);
    form.reset();
    setSaldoDisplay("R$ 0,00");
  };

  const handleEdit = (client: any) => {
    setEditingId(client.id);
    form.reset(client);
    const amount = ((client.balanceCentavos ?? 0) / 100);
    setSaldoDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Clientes</h2>
          <p className="text-muted-foreground">Cadastre e gerencie seus clientes.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); form.reset(); }} className="bg-primary shadow-lg hover:shadow-primary/30">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className={editingId ? "w-full max-w-5xl" : "w-full max-w-3xl"}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Cliente" : "Adicionar Cliente"}</DialogTitle>
            </DialogHeader>
            
            <div className={editingId ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "max-w-2xl mx-auto"}>
              <div className="space-y-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <FormLabel>Email</FormLabel>
                            <FormControl><Input type="email" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="documentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de documento</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="CPF">CPF</SelectItem>
                                <SelectItem value="Passaporte">Passaporte</SelectItem>
                                <SelectItem value="RG">RG</SelectItem>
                                <SelectItem value="DNI">DNI</SelectItem>
                                <SelectItem value="NIF">NIF</SelectItem>
                                <SelectItem value="SSN">SSN</SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="documentNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número do documento</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nacionalidade</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div>
                      <FormLabel>Saldo (R$)</FormLabel>
                      <Input
                        type="text"
                        value={saldoDisplay}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          const cents = digits ? parseInt(digits, 10) : 0;
                          const amount = cents / 100;
                          setSaldoDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
                        }}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingId ? "Atualizar Cliente" : "Criar Cliente"}
                    </Button>
                  </form>
                </Form>
              </div>

              {editingId && (
                <div className="border-l pl-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Dependentes
                    </h3>
                  </div>
                  <Separator />
                  <DependentList clientId={editingId} />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Nacionalidade</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>Dependentes</TableHead>
              <TableHead>Viagens Concluídas</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={7} className="text-center py-8">Carregando clientes...</TableCell></TableRow>
            ) : clients?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado.</TableCell></TableRow>
            ) : (
              clients?.map((client) => (
                <TableRow key={client.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="w-3 h-3 mr-1" />
                      {client.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="w-3 h-3 mr-1" />
                      {client.email || "—"}
                    </div>
                  </TableCell>
                  <TableCell>{client.nationality || "—"}</TableCell>
                  <TableCell>
                    {(client.balanceCentavos ? client.balanceCentavos / 100 : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{(client as any).dependentCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>{client.completedTrips ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(client)} title="Editar e Gerenciar Dependentes">
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
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

function DependentList({ clientId }: { clientId: number }) {
  const { data: dependents, isLoading } = useClientDependents(clientId);
  const createMutation = useCreateClientDependent();
  const deleteMutation = useDeleteClientDependent();
  const [isAdding, setIsAdding] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertClientDependentSchema.omit({ clientId: true })),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      notes: "",
    }
  });

  const onSubmit = async (values: any) => {
    await createMutation.mutateAsync({ clientId, ...values });
    setIsAdding(false);
    form.reset();
  };

  return (
    <div className="space-y-4">
      {isAdding ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 bg-muted/30 p-3 rounded-lg border border-border">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Nome do Dependente</FormLabel>
                  <FormControl><Input size={1} className="h-8 text-xs" {...field} /></FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Telefone</FormLabel>
                    <FormControl><Input size={1} className="h-8 text-xs" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Email</FormLabel>
                    <FormControl><Input size={1} className="h-8 text-xs" {...field} /></FormControl>
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1 h-8 text-xs" disabled={createMutation.isPending}>
                Adicionar
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setIsAdding(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => setIsAdding(true)}>
          <Plus className="w-3 h-3 mr-2" />
          Novo Dependente
        </Button>
      )}

      <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
        {isLoading ? (
          <p className="text-xs text-center text-muted-foreground py-4">Carregando...</p>
        ) : dependents?.length === 0 ? (
          <p className="text-xs text-center text-muted-foreground py-4">Nenhum dependente cadastrado.</p>
        ) : (
          dependents?.map((dep) => (
            <div key={dep.id} className="flex items-center justify-between p-2 rounded-md border bg-card text-xs group">
              <div className="space-y-0.5">
                <p className="font-medium">{dep.name}</p>
                {dep.phone && <p className="text-muted-foreground text-[10px]">{dep.phone}</p>}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => {
                  if (confirm(`Excluir dependente ${dep.name}?`)) {
                    deleteMutation.mutate({ id: dep.id, clientId });
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
