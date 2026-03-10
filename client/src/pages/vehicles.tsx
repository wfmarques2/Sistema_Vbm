import { Layout } from "@/components/layout";
import { useVehicles, useCreateVehicle, useUpdateVehicle, useDeleteVehicle } from "@/hooks/use-vehicles";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVehicleSchema, vehicleStatusEnum, vehicleTypeEnum } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function VehiclesPage() {
  const { data: vehicles, isLoading } = useVehicles();
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const deleteMutation = useDeleteVehicle();
  const labelFromType = (t?: string) =>
    t === "sedan" ? "Sedan" :
    t === "suv" ? "SUV" :
    t === "minivan" ? "Minivan" :
    t === "van" ? "Van" :
    t === "micro_onibus" ? "Micro-ônibus" :
    t === "onibus" ? "Ônibus" :
    t === "blindado" ? "Blindado" :
    "—";

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [initializedFromQuery, setInitializedFromQuery] = useState(false);

  const form = useForm({
    resolver: zodResolver(insertVehicleSchema),
    defaultValues: {
      model: "",
      plate: "",
      capacity: 4,
      type: "sedan",
      status: "available",
      notes: ""
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
    // Ensure capacity is a number
    const payload = {
        ...values,
        capacity: parseInt(values.capacity),
    };

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setIsDialogOpen(false);
    setEditingId(null);
    form.reset();
  };

  const handleEdit = (vehicle: any) => {
    setEditingId(vehicle.id);
    form.reset({
        ...vehicle,
        capacity: vehicle.capacity.toString(), // numeric input string
        type: vehicle.type || "sedan",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este veículo?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Veículos</h2>
          <p className="text-muted-foreground">Gerencie sua frota.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); form.reset(); }} className="bg-primary shadow-lg hover:shadow-primary/30">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Veículo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Veículo" : "Adicionar Veículo"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl><Input placeholder="ex.: Mercedes Benz Classe C" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="plate"
                    render={({ field }) => (
                      <FormItem>
                      <FormLabel>Placa</FormLabel>
                        <FormControl><Input placeholder="ABC-1234" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                      <FormLabel>Capacidade</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicleTypeEnum.map(t => (
                            <SelectItem key={t} value={t}>
                              {t === "sedan" ? "Sedan" :
                               t === "suv" ? "SUV" :
                               t === "minivan" ? "Minivan" :
                               t === "van" ? "Van" :
                               t === "micro_onibus" ? "Micro-ônibus" :
                               t === "onibus" ? "Ônibus" :
                               t === "blindado" ? "Blindado" : t}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione o status" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehicleStatusEnum.map(s => (
                            <SelectItem key={s} value={s}>
                              {s === "available" ? "Disponível" : s === "in_use" ? "Em uso" : s === "maintenance" ? "Manutenção" : s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Atualizar Veículo" : "Criar Veículo"}
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
              <TableHead>Modelo</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Capacidade</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando veículos...</TableCell></TableRow>
            ) : vehicles?.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum veículo encontrado.</TableCell></TableRow>
            ) : (
              vehicles?.map((vehicle) => (
                <TableRow key={vehicle.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{vehicle.model}</TableCell>
                  <TableCell className="font-mono text-xs">{vehicle.plate}</TableCell>
                  <TableCell>{vehicle.capacity} pax</TableCell>
                  <TableCell>
                    {labelFromType(vehicle.type)}
                  </TableCell>
                  <TableCell>
                     {vehicle.status === "available" && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Disponível</Badge>}
                     {vehicle.status === "in_use" && <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Em uso</Badge>}
                     {vehicle.status === "maintenance" && <Badge variant="destructive">Manutenção</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(vehicle)}>
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(vehicle.id)}>
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
