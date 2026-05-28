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
import { Plus, Pencil, Trash2, MoreHorizontal, Receipt, Car } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVehicleSchema, vehicleStatusEnum, vehicleTypeEnum } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function VehiclesPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
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
      color: "",
      luggageCapacity: 0,
      autonomy: "",
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
    try {
      const payload = {
          ...values,
          capacity: parseInt(values.capacity),
          luggageCapacity: parseInt(values.luggageCapacity ?? 0),
          autonomy: values.autonomy ? parseFloat(values.autonomy) : null,
      };

      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...payload });
        toast({ title: "Sucesso", description: "Veículo atualizado." });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: "Sucesso", description: "Veículo cadastrado." });
      }
      setIsDialogOpen(false);
      setEditingId(null);
      form.reset();
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao salvar veículo.", variant: "destructive" });
    }
  };

  const handleEdit = (vehicle: any) => {
    setEditingId(vehicle.id);
    form.reset({
        ...vehicle,
        capacity: vehicle.capacity.toString(),
        color: vehicle.color || "",
        luggageCapacity: Number(vehicle.luggageCapacity ?? 0),
        autonomy: vehicle.autonomy ? vehicle.autonomy.toString() : "",
        type: vehicle.type || "sedan",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este veículo?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast({ title: "Sucesso", description: "Veículo excluído." });
      } catch (error) {
        toast({ title: "Erro", description: "Erro ao excluir veículo.", variant: "destructive" });
      }
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary flex items-center gap-3">
            <Car className="w-8 h-8" />
            {t("vehicles.title")}
          </h2>
          <p className="text-muted-foreground">{t("vehicles.subtitle")}</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setLocation("/vehicles/expenses")}>
            <Receipt className="w-4 h-4" />
            Todas as Despesas
          </Button>
          <Button onClick={() => { setEditingId(null); form.reset(); setIsDialogOpen(true); }} className="bg-primary shadow-lg hover:shadow-primary/30">
            <Plus className="w-4 h-4 mr-2" />
            {t("vehicles.add")}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Modelo</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Capacidade PAX</TableHead>
              <TableHead>Cor</TableHead>
              <TableHead>Capacidade de Malas</TableHead>
              <TableHead>Autonomia</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={9} className="text-center py-8">{t("vehicles.loading")}</TableCell></TableRow>
            ) : vehicles?.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{t("vehicles.empty")}</TableCell></TableRow>
            ) : (
              vehicles?.map((vehicle: any) => (
                <TableRow key={vehicle.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{vehicle.model}</TableCell>
                  <TableCell className="font-mono text-xs">{vehicle.plate}</TableCell>
                  <TableCell>{vehicle.capacity} pax</TableCell>
                  <TableCell>{vehicle.color || "—"}</TableCell>
                  <TableCell>{Number(vehicle.luggageCapacity ?? 0)} malas</TableCell>
                  <TableCell>{vehicle.autonomy ? `${vehicle.autonomy} km/l` : "—"}</TableCell>
                  <TableCell>
                    {labelFromType(vehicle.type)}
                  </TableCell>
                  <TableCell>
                     {vehicle.status === "available" && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Disponível</Badge>}
                     {vehicle.status === "in_use" && <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Em uso</Badge>}
                     {vehicle.status === "maintenance" && <Badge variant="destructive">Manutenção</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <MoreHorizontal className="w-4 h-4" />
                          {t("common.actions")}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(vehicle)}>
                          <Pencil className="w-4 h-4 mr-2 text-blue-600" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLocation(`/vehicles/expenses/${vehicle.id}`)}>
                          <Receipt className="w-4 h-4 mr-2 text-orange-600" />
                          Despesas
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(vehicle.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t("common.delete")}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? t("vehicles.edit") : t("vehicles.add")}</DialogTitle>
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
                    <FormLabel>Capacidade PAX</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <FormControl><Input placeholder="ex.: Preto" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="luggageCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidade de Malas</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="autonomy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Autonomia (km/l)</FormLabel>
                      <FormControl><Input type="number" step="0.1" placeholder="ex.: 12.5" {...field} /></FormControl>
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
                {editingId ? t("vehicles.update") : t("vehicles.create")}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
