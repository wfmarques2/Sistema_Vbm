import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceSchema, paymentMethodEnum, serviceStatusEnum, paymentStatusEnum } from "@shared/schema";
import { z } from "zod";
import { useCreateService, useDeleteService, useUpdateService } from "@/hooks/use-services";
import { useDrivers } from "@/hooks/use-drivers";
import { useVehicles } from "@/hooks/use-vehicles";
import { useClients, useClientDependents, useCreateClient, useCreateClientDependent } from "@/hooks/use-clients";
import { useRoute, useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function ServiceEditPage() {
  const [, params] = useRoute("/services/:id/edit");
  const isEdit = Boolean(params?.id);
  const id = params?.id ? Number(params.id) : 0;
  const [, navigate] = useLocation();

  const { data: drivers } = useDrivers();
  const { data: vehicles } = useVehicles();
  const { data: clients } = useClients();
  const createClient = useCreateClient();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [returnServiceId, setReturnServiceId] = useState<number | null>(null);
  const [currentIsReturnService, setCurrentIsReturnService] = useState(false);

  const [valueDisplay, setValueDisplay] = useState("R$ 0,00");
  const [dateTimeInput, setDateTimeInput] = useState<string>("");
  const [returnInput, setReturnInput] = useState<string>("");
  const [valorParcialDisplay, setValorParcialDisplay] = useState<string>("");
  const paymentLabel = (p: string) =>
    p === "pix" ? "PIX" :
    p === "cash" ? "Dinheiro" :
    p === "credit_card" ? "Cartão crédito" :
    p === "debit_card" ? "Cartão débito" :
    p === "saldo" ? "Saldo" : p.toUpperCase();
  const paymentStatusLabel = (s: string) =>
    s === "paid" ? "Pago" :
    s === "pending" ? "Pendente" :
    s === "saldo" ? "Saldo" :
    s === "partial" ? "Parcial" :
    s === "overdue" ? "Atrasado" :
    s === "canceled" ? "Cancelado" :
    s === "pay_driver" ? "Pagar ao Motorista" : s;
  const statusLabel = (s: string) =>
    s === "scheduled" ? "Agendado" :
    s === "driving_pickup" ? "Direção embarque" :
    s === "pickup_location" ? "Local embarque" :
    s === "driving_destination" ? "Direção destino" :
    s === "in_progress" ? "Direção destino" :
    s === "finished" ? "Finalizado" :
    s === "canceled" ? "Cancelado" : s;

  const serviceFormSchema = (isEdit ? insertServiceSchema.partial() : insertServiceSchema).extend({
    driverId: z.union([z.string(), z.number()]).nullable().optional(),
    vehicleId: z.union([z.string(), z.number()]).nullable().optional(),
    returnDriverId: z.union([z.string(), z.number()]).nullable().optional(),
    returnVehicleId: z.union([z.string(), z.number()]).nullable().optional(),
    clientId: z.union([z.string(), z.number()]).nullable().optional(),
    value: z.union([z.string(), z.number()]),
    kmPrevisto: z.union([z.string(), z.number()]).optional(),
    guide: z.string().nullable().optional(),
    hasReturn: z.boolean().optional(),
    returnDateTime: z.union([z.date(), z.string()]).optional(),
    returnOrigin: z.string().optional(),
    returnDestination: z.string().optional(),
    returnFlight: z.string().optional(),
    paxAdt: z.union([z.string(), z.number()]).optional(),
    paxChd: z.union([z.string(), z.number()]).optional(),
    paxInf: z.union([z.string(), z.number()]).optional(),
    paxSen: z.union([z.string(), z.number()]).optional(),
    paxFree: z.union([z.string(), z.number()]).optional(),
  });

  const form = useForm<z.infer<typeof serviceFormSchema>>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      clientName: "",
      clientPhone: "",
      clientId: "",
      origin: "",
      destination: "",
      dateTime: new Date(),
      type: "airport",
      value: "0.00",
      paymentMethod: "pix",
      status: "scheduled",
      statusPagamento: "pending",
      hasReturn: false,
      driverId: "",
      vehicleId: "",
      returnDriverId: "",
      returnVehicleId: "",
      kmPrevisto: "",
      notes: "",
      guide: "",
      flight: "",
      returnOrigin: "",
      returnDestination: "",
      returnFlight: "",
      passengers: 0,
      bags: 0,
      paxAdt: "",
      paxChd: "",
      paxInf: "",
      paxSen: "",
      paxFree: "",
    },
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!isEdit || !id) return;
      const res = await fetch(api.services.get.path.replace(":id", String(id)), { credentials: "include" });
      if (!res.ok) return;
      const service = await res.json();
      if (!mounted) return;
      const isCurrentReturn = Boolean(service.isReturn);
      setCurrentIsReturnService(isCurrentReturn);
      setReturnServiceId(null);
      if (isCurrentReturn) {
        toast({
          title: "Viagem de retorno",
          description: "Para retorno, utilize apenas a edição de despesas.",
        });
        navigate(`/services?finance=${id}`);
        return;
      }
      const amount =
        typeof service.valorCobrado === "number" && service.valorCobrado > 0
          ? service.valorCobrado / 100
          : Number(service.value || 0);
      const paymentMethodNorm = service.formaPagamento || service.paymentMethod || "pix";
      let returnService: any = null;
      if (!isCurrentReturn) {
        try {
          const childRes = await fetch(`/api/services?parentServiceId=${id}&isReturn=true&limit=1`, { credentials: "include" });
          if (childRes.ok) {
            const childRows = await childRes.json();
            returnService = Array.isArray(childRows) ? childRows[0] : null;
          }
        } catch {}
      }
      const hasReturnNorm = Boolean(returnService);
      if (returnService?.id) setReturnServiceId(Number(returnService.id));
      form.reset({
        ...service,
        paymentMethod: paymentMethodNorm,
        statusPagamento: service.statusPagamento || "pending",
        status: service.status || "scheduled",
        hasReturn: hasReturnNorm,
        value: amount.toFixed(2),
        driverId: service.driverId?.toString(),
        vehicleId: service.vehicleId?.toString(),
        returnDriverId: returnService?.driverId?.toString() ?? "",
        returnVehicleId: returnService?.vehicleId?.toString() ?? "",
        clientId: service.clientId?.toString(),
        dateTime: new Date(service.dateTime),
        returnDateTime: returnService?.dateTime ? new Date(returnService.dateTime) : undefined,
        returnOrigin: returnService?.origin ?? "",
        returnDestination: returnService?.destination ?? "",
        returnFlight: returnService?.flight ?? "",
        kmPrevisto: service.kmPrevisto != null ? String(service.kmPrevisto) : "",
        guide: service.guide ?? "",
        restanteMetodoDriver: service.restanteMetodoDriver ?? undefined,
      });
      setDateTimeInput(format(new Date(service.dateTime), "yyyy-MM-dd'T'HH:mm"));
      setReturnInput(returnService?.dateTime ? format(new Date(returnService.dateTime), "yyyy-MM-dd'T'HH:mm") : "");
      setValueDisplay(
        (isFinite(amount) ? amount : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      );
    }
    load();
    return () => {
      mounted = false;
    };
  }, [id, isEdit]);

  const selectedClientId = form.watch("clientId");
  const selectedClientIdNum = Number(selectedClientId || 0);
  const { data: dependents } = useClientDependents(Number.isFinite(selectedClientIdNum) ? selectedClientIdNum : 0);
  const createDependent = useCreateClientDependent();
  const [depSelectedId, setDepSelectedId] = useState<number>(0);
  const [newDepName, setNewDepName] = useState("");
  const [newDepPhone, setNewDepPhone] = useState("");
  const [extraDependentId, setExtraDependentId] = useState<number>(0);
  const [extraPassengers, setExtraPassengers] = useState<Array<{ name: string; phone?: string }>>([]);
  useEffect(() => {
    const idNum = Number(selectedClientId);
    if (!clients || !Number.isFinite(idNum) || idNum <= 0) return;
    const c = clients.find((cl: any) => Number(cl.id) === idNum);
    if (!c) return;
    form.setValue("clientName", c.name ?? "", { shouldDirty: true });
    form.setValue("clientPhone", c.phone ?? "", { shouldDirty: true });
    setDepSelectedId(0);
    setNewDepName("");
    setNewDepPhone("");
    setExtraDependentId(0);
    setExtraPassengers([]);
  }, [selectedClientId, clients]);

  const onSubmit = async (values: any) => {
    const raw = values.value;
    const normalized = (() => {
      if (typeof raw === "number") return raw.toFixed(2);
      const s = String(raw ?? "").trim();
      const normalizedStr = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
      const num = Number(normalizedStr || "0");
      return Number.isFinite(num) ? num.toFixed(2) : "0";
    })();

    const digits = (s?: string) => String(s || "").replace(/\D/g, "");
    let clientIdFinal = values.clientId ? parseInt(values.clientId) : undefined;
    if (!clientIdFinal) {
      const nameInput = String(values.clientName || "").trim();
      const phoneInput = String(values.clientPhone || "").trim();
      if (nameInput || phoneInput) {
        const phoneDigits = digits(phoneInput);
        const existing = (clients || []).find((c: any) => {
          const samePhone = phoneDigits ? digits(c.phone) === phoneDigits : false;
          const sameName = String(c.name || "").trim().toLowerCase() === nameInput.toLowerCase();
          return samePhone || sameName;
        });
        if (existing) {
          clientIdFinal = Number(existing.id);
        } else {
          const created = await createClient.mutateAsync({
            name: nameInput || "Cliente",
            phone: phoneInput || "",
            email: "",
            nationality: "",
            balanceCentavos: 0,
          } as any);
          clientIdFinal = Number(created.id);
        }
      }
    }

    // Se houver dependente selecionado, usa os dados dele como passageiro.
    let clientNameFinal = String(values.clientName || "").trim();
    let clientPhoneFinal = String(values.clientPhone || "").trim();
    if (selectedClientIdNum > 0 && depSelectedId > 0) {
      const dep = (dependents || []).find((d: any) => d.id === depSelectedId);
      if (dep) {
        clientNameFinal = dep.name || clientNameFinal;
        clientPhoneFinal = dep.phone || clientPhoneFinal;
      }
    }
    const normalizedExtra = Array.from(
      new Map(
        extraPassengers
          .map((p) => ({ name: String(p.name || "").trim(), phone: String(p.phone || "").trim() }))
          .filter((p) => p.name)
          .map((p) => [`${p.name.toLowerCase()}|${digits(p.phone)}`, p])
      ).values()
    );
    const resolvedExtraNames: string[] = [];
    for (const p of normalizedExtra) {
      if ((clientIdFinal || 0) > 0) {
        const existing = (dependents || []).find((d: any) => {
          const sameName = String(d.name || "").trim().toLowerCase() === p.name.toLowerCase();
          const samePhone = digits(d.phone) === digits(p.phone);
          return sameName && (samePhone || !p.phone);
        });
        if (existing) {
          resolvedExtraNames.push(String(existing.name || p.name));
          continue;
        }
        try {
          const created = await createDependent.mutateAsync({
            clientId: Number(clientIdFinal),
            name: p.name,
            phone: p.phone || undefined,
          } as any);
          resolvedExtraNames.push(String(created?.name || p.name));
        } catch {
          resolvedExtraNames.push(p.name);
        }
      } else {
        resolvedExtraNames.push(p.name);
      }
    }
    const passengerNames = Array.from(
      new Set(
        [clientNameFinal, ...resolvedExtraNames]
          .map((n) => String(n || "").trim())
          .filter(Boolean)
      )
    );
    const passengerCountFromNames = passengerNames.length;
    const manualPassengerCount = Number(values.passengers ?? 0) || 0;
    const passengersFinal = Math.max(manualPassengerCount, passengerCountFromNames);

    const hasReturn = Boolean(values.hasReturn) && !currentIsReturnService;
    const payload = {
      ...values,
      clientName: passengerNames.join(" & ") || values.clientName,
      clientPhone: clientPhoneFinal || values.clientPhone,
      value: normalized,
      kmPrevisto: values.kmPrevisto != null && values.kmPrevisto !== "" ? String(values.kmPrevisto).replace(",", ".") : undefined,
      driverId: values.driverId ? parseInt(values.driverId) : undefined,
      vehicleId: values.vehicleId ? parseInt(values.vehicleId) : undefined,
      hasReturn,
      isReturn: currentIsReturnService,
      parentServiceId: currentIsReturnService ? values.parentServiceId : undefined,
      clientId: clientIdFinal,
      dateTime: new Date(values.dateTime),
      returnDateTime: undefined,
      returnOrigin: undefined,
      returnDestination: undefined,
      returnFlight: undefined,
      returnDriverId: undefined,
      returnVehicleId: undefined,
      guide: values.guide ? String(values.guide).trim() : undefined,
      flight: values.flight ? String(values.flight).trim() : undefined,
      passengers: passengersFinal || undefined,
      bags: Number(values.bags ?? 0) || undefined,
      paxAdt: Number(values.paxAdt ?? 0) || undefined,
      paxChd: Number(values.paxChd ?? 0) || undefined,
      paxInf: Number(values.paxInf ?? 0) || undefined,
      paxSen: Number(values.paxSen ?? 0) || undefined,
      paxFree: Number(values.paxFree ?? 0) || undefined,
      valorPagoParcial: (() => {
        const display = String(valorParcialDisplay || "").replace(/\D/g, "");
        return display ? parseInt(display, 10) : undefined;
      })(),
      restanteMetodo: values.restanteMetodo || undefined,
      restanteMetodoDriver: values.restanteMetodo === "pay_driver" ? values.restanteMetodoDriver || undefined : undefined,
    };

    try {
      setSaving(true);
      toast({ title: isEdit ? "Atualizando serviço" : "Criando serviço", description: "Enviando dados..." });
      let mainService: any;
      if (isEdit && id) {
        mainService = await updateMutation.mutateAsync({ id, ...payload });
      } else {
        mainService = await createMutation.mutateAsync(payload);
      }
      if (!currentIsReturnService) {
        const returnPayload = hasReturn && values.returnDateTime && values.returnOrigin && values.returnDestination
          ? {
              dateTime: new Date(values.returnDateTime as any),
              origin: String(values.returnOrigin || "").trim(),
              destination: String(values.returnDestination || "").trim(),
              type: values.type,
              clientName: passengerNames.join(" & ") || values.clientName,
              clientPhone: clientPhoneFinal || values.clientPhone,
              clientId: clientIdFinal,
              parentServiceId: Number(mainService?.id || id),
              isReturn: true,
              hasReturn: false,
              value: "0.00",
              paymentMethod: values.paymentMethod,
              status: "scheduled" as const,
              statusPagamento: "pending" as const,
              driverId: values.returnDriverId ? parseInt(values.returnDriverId) : undefined,
              vehicleId: values.returnVehicleId ? parseInt(values.returnVehicleId) : undefined,
              flight: values.returnFlight ? String(values.returnFlight).trim() : undefined,
              guide: values.guide ? String(values.guide).trim() : undefined,
              notes: values.notes ? String(values.notes).trim() : undefined,
              passengers: passengersFinal || undefined,
              bags: Number(values.bags ?? 0) || undefined,
              paxAdt: Number(values.paxAdt ?? 0) || undefined,
              paxChd: Number(values.paxChd ?? 0) || undefined,
              paxInf: Number(values.paxInf ?? 0) || undefined,
              paxSen: Number(values.paxSen ?? 0) || undefined,
              paxFree: Number(values.paxFree ?? 0) || undefined,
            }
          : null;
        if (returnPayload) {
          if (returnServiceId) {
            await updateMutation.mutateAsync({ id: returnServiceId, ...returnPayload });
          } else {
            await createMutation.mutateAsync(returnPayload as any);
          }
        } else if (returnServiceId) {
          await deleteMutation.mutateAsync(returnServiceId);
        }
      }
      navigate("/services");
    } catch (err: any) {
      toast({
        title: "Erro",
        description: String(err?.message || "Falha ao salvar serviço"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onInvalid = (errors: any) => {
    const firstField = Object.keys(errors || {})[0];
    const firstMessage =
      (firstField && (errors as any)?.[firstField]?.message)
        ? String((errors as any)[firstField].message)
        : "Preencha os campos obrigatórios";
    toast({
      title: "Formulário inválido",
      description: firstMessage,
      variant: "destructive",
    });
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold text-primary">{isEdit ? "Editar Serviço" : "Novo Serviço"}</h2>
        <Button variant="outline" onClick={() => navigate("/services")}>Voltar</Button>
      </div>
      <div className="max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-4">
            <div className="rounded-lg border border-border/70 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-primary">Cliente e Passageiros</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="clientName" render={({ field }) => (
                  <FormItem><FormLabel>Nome do Cliente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="clientPhone" render={({ field }) => (
                  <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={form.control} name="clientId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente (cadastrado)</FormLabel>
                  <Select onValueChange={field.onChange} value={String(field.value ?? "")}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {clients?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name} ({c.phone})</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              {Number(selectedClientId || 0) > 0 && (
                <div className="space-y-3 rounded-md border border-border/60 p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Passageiro principal</label>
                      <Select value={String(depSelectedId)} onValueChange={(v) => setDepSelectedId(Number(v))}>
                        <SelectTrigger><SelectValue placeholder="Selecione o passageiro" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">— Titular ({form.watch("clientName") || "Cliente"}) —</SelectItem>
                          {(dependents || []).map((d: any) => (
                            <SelectItem key={d.id} value={String(d.id)}>{d.name}{d.phone ? ` (${d.phone})` : ""}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Adicionar dependente existente</label>
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <Select value={String(extraDependentId)} onValueChange={(v) => setExtraDependentId(Number(v))}>
                          <SelectTrigger><SelectValue placeholder="Selecione dependente" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Selecione</SelectItem>
                            {(dependents || []).map((d: any) => (
                              <SelectItem key={d.id} value={String(d.id)}>{d.name}{d.phone ? ` (${d.phone})` : ""}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            if (!extraDependentId) return;
                            const dep = (dependents || []).find((d: any) => Number(d.id) === Number(extraDependentId));
                            if (!dep) return;
                            const depName = String(dep.name || "").trim();
                            if (!depName) return;
                            const depPhone = String(dep.phone || "").trim();
                            const exists = extraPassengers.some((p) => String(p.name || "").trim().toLowerCase() === depName.toLowerCase() && String(p.phone || "").replace(/\D/g, "") === depPhone.replace(/\D/g, ""));
                            if (!exists) {
                              setExtraPassengers((prev) => [...prev, { name: depName, phone: depPhone || undefined }]);
                            }
                            setExtraDependentId(0);
                          }}
                        >
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-2">
                    <div>
                      <label className="text-sm font-medium">Novo passageiro (nome)</label>
                      <Input value={newDepName} onChange={(e) => setNewDepName(e.target.value)} placeholder="Nome completo" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Telefone (opcional)</label>
                      <Input value={newDepPhone} onChange={(e) => setNewDepPhone(e.target.value)} placeholder="(11) 99999-9999" />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        onClick={() => {
                          const name = newDepName.trim();
                          if (!name) return;
                          const phone = newDepPhone.trim();
                          const exists = extraPassengers.some((p) => String(p.name || "").trim().toLowerCase() === name.toLowerCase() && String(p.phone || "").replace(/\D/g, "") === phone.replace(/\D/g, ""));
                          if (!exists) {
                            setExtraPassengers((prev) => [...prev, { name, phone: phone || undefined }]);
                          }
                          setNewDepName("");
                          setNewDepPhone("");
                        }}
                      >
                        Adicionar passageiro
                      </Button>
                    </div>
                  </div>
                  {extraPassengers.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Passageiros adicionais</label>
                      <div className="space-y-1">
                        {extraPassengers.map((p, idx) => (
                          <div key={`${p.name}-${p.phone || ""}-${idx}`} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
                            <span>{p.name}{p.phone ? ` (${p.phone})` : ""}</span>
                            <Button type="button" variant="ghost" onClick={() => setExtraPassengers((prev) => prev.filter((_, i) => i !== idx))}>
                              Remover
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="rounded-lg border border-border/70 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-primary">Agendamento</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="dateTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data e Hora</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" value={dateTimeInput || (field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : "")}
                        onChange={(e) => { const v = e.target.value; setDateTimeInput(v); if (!v) { field.onChange(undefined); return; } if (v.length >= 16) { const d = new Date(v); if (!isNaN(d.getTime())) field.onChange(d); }}}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value ?? "")}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="corporate">Executivo</SelectItem>
                        <SelectItem value="airport">Privativo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="guide" render={({ field }) => (
                <FormItem>
                  <FormLabel>Guia (opcional)</FormLabel>
                  <FormControl><Input value={field.value ?? ""} onChange={field.onChange} placeholder="Nome do guia turístico" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              {!currentIsReturnService ? (
                <FormField
                  control={form.control}
                  name="hasReturn"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border border-border/70 p-3">
                      <FormControl>
                        <Checkbox
                          checked={Boolean(field.value)}
                          onCheckedChange={(checked) => {
                            const enabled = Boolean(checked);
                            field.onChange(enabled);
                            if (!enabled) {
                              setReturnInput("");
                              form.setValue("returnDateTime", undefined);
                              form.setValue("returnOrigin", "");
                              form.setValue("returnDestination", "");
                              form.setValue("returnFlight", "");
                              form.setValue("returnDriverId", "");
                              form.setValue("returnVehicleId", "");
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Criar viagem de retorno vinculada</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              ) : (
                <div className="rounded-md border border-border/70 p-3 text-sm text-muted-foreground">
                  Esta é uma viagem de retorno vinculada a outra viagem.
                </div>
              )}
              {!currentIsReturnService && form.watch("hasReturn") && (
                <div className="rounded-md border border-primary/40 bg-primary/5 p-4 space-y-4">
                  <div className="text-sm font-medium">Viagem de retorno vinculada</div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="returnDateTime" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data/Hora retorno</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" value={returnInput || (field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : "")}
                            onChange={(e) => { const v = e.target.value; setReturnInput(v); if (!v) { field.onChange(undefined); return; } if (v.length >= 16) { const d = new Date(v); if (!isNaN(d.getTime())) field.onChange(d); }}}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="returnFlight" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Voo retorno</FormLabel>
                        <FormControl><Input value={field.value ?? ""} onChange={field.onChange} placeholder="Ex.: G3 9876" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="returnOrigin" render={({ field }) => (
                      <FormItem><FormLabel>Origem retorno</FormLabel><FormControl><Input value={field.value ?? ""} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="returnDestination" render={({ field }) => (
                      <FormItem><FormLabel>Destino retorno</FormLabel><FormControl><Input value={field.value ?? ""} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="returnDriverId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motorista retorno</FormLabel>
                        <Select onValueChange={field.onChange} value={String(field.value ?? "")}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Atribuir motorista" /></SelectTrigger></FormControl>
                          <SelectContent>{drivers?.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="returnVehicleId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Veículo retorno</FormLabel>
                        <Select onValueChange={field.onChange} value={String(field.value ?? "")}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Atribuir veículo" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {(vehicles || []).map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.model} ({v.plate})</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-border/70 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-primary">Dados da Viagem</h3>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl><Textarea value={field.value ?? ""} onChange={field.onChange} rows={3} placeholder="Informações adicionais para o voucher" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="flight" render={({ field }) => (
                <FormItem>
                  <FormLabel>Voo</FormLabel>
                  <FormControl><Input value={field.value ?? ""} onChange={field.onChange} placeholder="Ex.: G3 1234" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="passengers" render={({ field }) => {
                const selectedVehicleId = Number(form.watch("vehicleId") || 0);
                const selectedVehicle = (vehicles || []).find(v => v.id === selectedVehicleId);
                const maxPax = selectedVehicle ? Number(selectedVehicle.capacity || 0) : undefined;
                return (
                  <FormItem>
                    <FormLabel>Qtde pax</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={maxPax ?? undefined}
                        value={String(field.value ?? 0)}
                        onChange={(e) => {
                          let val = parseInt(e.target.value || "0", 10);
                          if (!Number.isFinite(val) || val < 0) val = 0;
                          if (maxPax != null) val = Math.min(val, maxPax);
                          field.onChange(val);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }} />
              <FormField control={form.control} name="bags" render={({ field }) => {
                const selectedVehicleId = Number(form.watch("vehicleId") || 0);
                const selectedVehicle = (vehicles || []).find(v => v.id === selectedVehicleId);
                const maxBags = selectedVehicle ? Number(selectedVehicle.luggageCapacity || 0) : undefined;
                return (
                  <FormItem>
                    <FormLabel>Malas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={maxBags ?? undefined}
                        value={String(field.value ?? 0)}
                        onChange={(e) => {
                          let val = parseInt(e.target.value || "0", 10);
                          if (!Number.isFinite(val) || val < 0) val = 0;
                          if (maxBags != null) val = Math.min(val, maxBags);
                          field.onChange(val);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }} />
            </div>
            <div className="grid grid-cols-5 gap-4">
              <FormField control={form.control} name="paxAdt" render={({ field }) => (
                <FormItem>
                  <FormLabel>ADT</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={String(field.value ?? "")}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="paxChd" render={({ field }) => (
                <FormItem>
                  <FormLabel>CHD</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={String(field.value ?? "")}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="paxInf" render={({ field }) => (
                <FormItem>
                  <FormLabel>INF</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={String(field.value ?? "")}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="paxSen" render={({ field }) => (
                <FormItem>
                  <FormLabel>SEN</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={String(field.value ?? "")}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="paxFree" render={({ field }) => (
                <FormItem>
                  <FormLabel>FREE</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={String(field.value ?? "")}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="origin" render={({ field }) => (
                <FormItem><FormLabel>Origem</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="destination" render={({ field }) => (
                <FormItem><FormLabel>Destino</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="kmPrevisto" render={({ field }) => (
                <FormItem>
                  <FormLabel>KM da Rota</FormLabel>
                  <FormControl><Input type="text" inputMode="decimal" value={String(field.value ?? "")} onChange={(e) => field.onChange(e.target.value)} placeholder="0,00" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex items-end">
                <Button type="button" variant="secondary" asChild disabled={!form.watch("origin") || !form.watch("destination")}>
                  <a href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(String(form.watch("origin") || ""))}&destination=${encodeURIComponent(String(form.watch("destination") || ""))}&travelmode=driving`} target="_blank" rel="noreferrer">Ver rota e Km</a>
                </Button>
              </div>
            </div>
            </div>
            <div className="rounded-lg border border-border/70 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-primary">Financeiro e Alocação</h3>
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="value" render={() => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input type="text" value={valueDisplay} onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      const cents = digits ? parseInt(digits, 10) : 0;
                      const amount = cents / 100;
                      setValueDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
                      form.setValue("value", amount.toFixed(2));
                    }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} value={String(field.value ?? "")}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Método" /></SelectTrigger></FormControl>
                    <SelectContent>{paymentMethodEnum.map(m => <SelectItem key={m} value={m}>{paymentLabel(m)}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="statusPagamento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pagamento (status)</FormLabel>
                  <Select onValueChange={field.onChange} value={String(field.value ?? "")}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Status do pagamento" /></SelectTrigger></FormControl>
                    <SelectContent>{paymentStatusEnum.map(s => <SelectItem key={s} value={s}>{paymentStatusLabel(s)}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            {form.watch("statusPagamento") === "partial" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel>Valor pago parcial</FormLabel>
                  <Input
                    type="text"
                    value={valorParcialDisplay}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      const cents = digits ? parseInt(digits, 10) : 0;
                      const amount = cents / 100;
                      setValorParcialDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
                    }}
                    placeholder="R$ 0,00"
                  />
                </div>
                <FormField control={form.control} name="restanteMetodo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Como pagar o restante</FormLabel>
                    <Select onValueChange={field.onChange} value={String(field.value ?? "")}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="pay_driver">Pagar ao Motorista</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                {form.watch("restanteMetodo") === "pay_driver" && (
                  <FormField control={form.control} name="restanteMetodoDriver" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método ao Motorista</FormLabel>
                      <Select onValueChange={field.onChange} value={String(field.value ?? "")}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione o método" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                          <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                          <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status da Viagem</FormLabel>
                  <Select onValueChange={field.onChange} value={String(field.value ?? "")}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Status da viagem" /></SelectTrigger></FormControl>
                    <SelectContent>{serviceStatusEnum.map(s => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="driverId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Motorista</FormLabel>
                  <Select onValueChange={field.onChange} value={String(field.value ?? "")}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Atribuir motorista" /></SelectTrigger></FormControl>
                    <SelectContent>{drivers?.map(d => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="vehicleId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Veículo</FormLabel>
                  {(() => {
                    const paxWatch = Number(form.watch("passengers") || 0);
                    const bagsWatch = Number(form.watch("bags") || 0);
                    const filteredVehicles = useMemo(() => {
                      return (vehicles || []).filter(v => {
                        const okPax = paxWatch > 0 ? Number(v.capacity || 0) >= paxWatch : true;
                        const okBags = bagsWatch > 0 ? Number(v.luggageCapacity || 0) >= bagsWatch : true;
                        return okPax && okBags;
                      });
                    }, [vehicles, paxWatch, bagsWatch]);
                    return (
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          const vObj = (vehicles || []).find(v => String(v.id) === String(val));
                          if (vObj) {
                            const maxPax = Number(vObj.capacity || 0);
                            const maxBags = Number(vObj.luggageCapacity || 0);
                            const currentPax = Number(form.getValues("passengers") || 0);
                            const currentBags = Number(form.getValues("bags") || 0);
                            if (currentPax > maxPax) form.setValue("passengers", maxPax);
                            if (currentBags > maxBags) form.setValue("bags", maxBags);
                          }
                        }}
                        value={String(field.value ?? "")}
                      >
                        <FormControl><SelectTrigger><SelectValue placeholder="Atribuir veículo" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {filteredVehicles.map(v => <SelectItem key={v.id} value={v.id.toString()}>{v.model} ({v.plate})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    );
                  })()}
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={() => form.handleSubmit(onSubmit, onInvalid)()}
            >
              {isEdit ? "Atualizar Serviço" : "Criar Serviço"}
            </Button>
          </form>
        </Form>
      </div>
    </Layout>
  );
}
