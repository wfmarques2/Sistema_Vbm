import { Layout } from "@/components/layout";
import { useServices, useServicesPaged, useCreateService, useUpdateService, useDeleteService } from "@/hooks/use-services";
import { useDrivers } from "@/hooks/use-drivers";
import { useClients, useClientDependents, useCreateClient, useCreateClientDependent } from "@/hooks/use-clients";
import { useVehicles } from "@/hooks/use-vehicles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, Filter, Pencil, Trash2, CalendarIcon, ChevronDown, DollarSign, MoreHorizontal, Download } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceSchema, serviceTypeEnum, paymentMethodEnum, serviceStatusEnum, paymentStatusEnum } from "@shared/schema";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { useUpdateServiceExpenses, useFinanceProfit, useCreateUnifiedExpense, buildUrl, useCreateDriverPayment } from "@/hooks/use-financial";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DateQuickFilters } from "@/components/date-quick-filters";
import { useQueryClient } from "@tanstack/react-query";

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [valueDisplay, setValueDisplay] = useState("R$ 0,00");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const { data: drivers } = useDrivers();
  const { data: vehicles } = useVehicles();
  const { data: clients } = useClients();
  const createClientMutation = useCreateClient();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();
  const [filterTravelStatus, setFilterTravelStatus] = useState<string>("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("all");
  const [filterDriverId, setFilterDriverId] = useState<number | "">("");
  const [filterVehicleId, setFilterVehicleId] = useState<number | "">("");
  const pageSize = 20;
  const [page, setPage] = useState(0);
  const enabled = true;
  const { data: paged, isLoading } = useServicesPaged({
    start: start || undefined,
    end: end || undefined,
    driverId: typeof filterDriverId === "number" ? String(filterDriverId) : undefined,
    vehicleId: typeof filterVehicleId === "number" ? filterVehicleId : undefined,
    status: filterTravelStatus !== "all" ? filterTravelStatus : undefined,
    statusPagamento: filterPaymentStatus !== "all" ? filterPaymentStatus : undefined,
    paymentMethod: filterPaymentMethod !== "all" ? filterPaymentMethod : undefined,
  }, pageSize, page * pageSize);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [initializedFromQuery, setInitializedFromQuery] = useState(false);
  const [isFinanceDialogOpen, setIsFinanceDialogOpen] = useState(false);
  const [financeServiceId, setFinanceServiceId] = useState<number | null>(null);
  const updateExpensesMutation = useUpdateServiceExpenses(financeServiceId || 0);
  const createUnified = useCreateUnifiedExpense();
  const [financeDriverId, setFinanceDriverId] = useState<number | null>(null);
  const [stops, setStops] = useState<string[]>([]);
  const [dateTimeInput, setDateTimeInput] = useState<string>("");
  const [returnInput, setReturnInput] = useState<string>("");

  /* Map/autocomplete removido: endereços e km previsto agora são manuais */
  const [combDisplay, setCombDisplay] = useState("R$ 0,00");
  const [pedagioDisplay, setPedagioDisplay] = useState("R$ 0,00");
  const [estacDisplay, setEstacDisplay] = useState("R$ 0,00");
  const [alimDisplay, setAlimDisplay] = useState("R$ 0,00");
  const [outrosDisplay, setOutrosDisplay] = useState("R$ 0,00");
  const [driverPayDisplay, setDriverPayDisplay] = useState("R$ 0,00");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputId = "xlsx-import-input";
  const { toast } = useToast();
  const qc = useQueryClient();
  const createDriverPay = useCreateDriverPayment();
  const [editingService, setEditingService] = useState<any | null>(null);

  const serviceFormSchema = insertServiceSchema.extend({
    driverId: z.union([z.string(), z.number()]).nullable().optional(),
    vehicleId: z.union([z.string(), z.number()]).nullable().optional(),
    clientId: z.union([z.string(), z.number()]).nullable().optional(),
    value: z.union([z.string(), z.number()]),
    kmPrevisto: z.union([z.string(), z.number()]).optional(),
    traveler: z.string().optional(),
    passengers: z.union([z.string(), z.number()]).optional(),
    carModel: z.string().optional(),
    mozioId: z.string().optional(),
    flight: z.string().optional(),
    returnDateTime: z.union([z.date(), z.string()]).optional(),
    guide: z.string().nullable().optional(),
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
      traveler: "",
      origin: "",
      destination: "",
      dateTime: new Date(),
      type: "airport",
      value: "0.00",
      paymentMethod: "pix",
      status: "scheduled",
      statusPagamento: "pending",
      driverId: "",
      vehicleId: "",
      passengers: "",
      carModel: "",
      mozioId: "",
      flight: "",
      paxAdt: "",
      paxChd: "",
      paxInf: "",
      paxSen: "",
      paxFree: "",
      notes: ""
    }
  });

  const selectedClientId = Number(form.watch("clientId") || 0);
  const { data: dependents } = useClientDependents(selectedClientId);
  const createDependent = useCreateClientDependent();
  const [addingPassenger, setAddingPassenger] = useState(false);
  const [newPassengerName, setNewPassengerName] = useState("");
  const [newPassengerPhone, setNewPassengerPhone] = useState("");
  const [extraPassengers, setExtraPassengers] = useState<string[]>([]);

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
    // Ensure numeric fields are numbers for the API
    const raw = values.value;
    const normalized = (() => {
      if (typeof raw === "number") return raw.toFixed(2);
      const s = String(raw ?? "").trim();
      const normalizedStr = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
      const num = Number(normalizedStr || "0");
      return Number.isFinite(num) ? num.toFixed(2) : "0";
    })();
    const digits = (s: string) => String(s || "").replace(/\D/g, "");
    let clientIdNum: number | null = values.clientId ? parseInt(values.clientId) : null;
    const nameInput = String(values.clientName || "").trim();
    const phoneInput = String(values.clientPhone || "").trim();

    if (!clientIdNum && (nameInput || phoneInput)) {
      const phoneDigits = digits(phoneInput);
      const existing =
        clients?.find(c => digits(c.phone) === phoneDigits) ||
        clients?.find(c => c.name.toLowerCase() === nameInput.toLowerCase());
      if (existing) {
        clientIdNum = existing.id;
        // garantir seleção do viajante titular
        form.setValue("clientId", String(existing.id));
        form.setValue("traveler", "__client__");
        form.setValue("clientName", existing.name);
        form.setValue("clientPhone", existing.phone);
      } else {
        const created = await createClientMutation.mutateAsync({
          name: nameInput || "Cliente",
          phone: phoneInput || "",
          email: "",
          nationality: "",
          balanceCentavos: 0,
        });
        clientIdNum = created.id;
        form.setValue("clientId", String(created.id));
        form.setValue("traveler", "__client__");
      }
    }

    // Concatena titular + passageiros extras para refletir no voucher
    const titularName = String(values.clientName || "").trim();
    const uniqueExtras = Array.from(new Set(extraPassengers.map(s => s.trim()).filter(Boolean)));
    const concatenatedClientName = [titularName, ...uniqueExtras].filter(Boolean).join(" & ");

    const payload = {
      ...values,
      clientName: concatenatedClientName || values.clientName,
      value: normalized,
      kmPrevisto: values.kmPrevisto != null && values.kmPrevisto !== "" ? String(values.kmPrevisto).replace(",", ".") : undefined,
      driverId: values.driverId ? parseInt(values.driverId) : null,
      vehicleId: values.vehicleId ? parseInt(values.vehicleId) : null,
      clientId: clientIdNum,
      dateTime: new Date(values.dateTime),
      returnDateTime: values.returnDateTime ? new Date(values.returnDateTime as any) : undefined,
      guide: values.guide ? String(values.guide).trim() : undefined,
    };

    if (editingId) {
      let saldoDeltaCents: number | null = null;
      try {
        const prev = editingService;
        const prevMethod = (prev?.formaPagamento || prev?.paymentMethod);
        const nextMethod = (payload as any).formaPagamento || (payload as any).paymentMethod || prevMethod;
        const prevFinished = prev?.status === "finished";
        const nextFinished = (payload as any).status ? (payload as any).status === "finished" : prevFinished;
        if (prev && prevFinished && nextFinished && prevMethod === "saldo" && nextMethod === "saldo") {
          const prevAmount = (typeof prev?.valorCobrado === "number" && prev.valorCobrado > 0)
            ? prev.valorCobrado
            : Math.round(Number(prev?.value || 0) * 100);
          const nextValorCobrado = Number((payload as any).valorCobrado || 0);
          const nextAmount = nextValorCobrado > 0
            ? nextValorCobrado
            : Math.round(Number((payload as any).value ?? prev?.value ?? 0) * 100);
          saldoDeltaCents = nextAmount - prevAmount;
        }
      } catch { /* ignore */ }
      await updateMutation.mutateAsync({ id: editingId, ...payload });
      if (saldoDeltaCents != null && saldoDeltaCents !== 0) {
        const abs = Math.abs(saldoDeltaCents);
        const brl = (abs / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        toast({
          title: saldoDeltaCents > 0 ? "Saldo debitado" : "Saldo creditado",
          description: saldoDeltaCents > 0
            ? `Debitado ${brl} do saldo do cliente`
            : `Creditado ${brl} no saldo do cliente`,
        });
      }
    } else {
      await createMutation.mutateAsync(payload);
    }
    setIsDialogOpen(false);
    setEditingId(null);
    setEditingService(null);
    form.reset();
  };

  const openFinanceDialog = (service: any) => {
    setFinanceServiceId(service.id);
    setFinanceDriverId(typeof service.driverId === "number" ? service.driverId : null);
    setCombDisplay(((service.combustivel ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
    setPedagioDisplay(((service.pedagio ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
    setEstacDisplay(((service.estacionamento ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
    setAlimDisplay(((service.alimentacao ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
    setOutrosDisplay(((service.outrosCustos ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
    setDriverPayDisplay("R$ 0,00");
    setIsFinanceDialogOpen(true);
  };

  const toCentavos = (display: string) => {
    const digits = display.replace(/\D/g, "");
    const cents = digits ? parseInt(digits, 10) : 0;
    return cents;
  };

  const handleEdit = (service: any) => {
    setLocation(`/services/${service.id}/edit`);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este serviço?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const filteredServices = paged?.rows?.filter(s => {
    const q = search.toLowerCase();
    const matchesText =
      s.clientName.toLowerCase().includes(q) ||
      s.origin.toLowerCase().includes(q) ||
      s.destination.toLowerCase().includes(q);
    return matchesText;
  });

  const exportServicesXlsx = () => {
    const rows = (filteredServices || []).map((service: any) => {
      const paxTotal =
        Number(service.passengers || 0) > 0
          ? Number(service.passengers || 0)
          : Number(service.paxAdt || 0) +
            Number(service.paxChd || 0) +
            Number(service.paxInf || 0) +
            Number(service.paxSen || 0) +
            Number(service.paxFree || 0);
      return {
        "Data/Hora": format(new Date(service.dateTime), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        "Cliente": formatPassengerNames(service.clientName),
        "Rota": `${service.origin} → ${service.destination}`,
        "Motorista": service.driver?.name || "Não atribuído",
        "Veículo": service.vehicle ? `${service.vehicle.model}${service.vehicle.plate ? ` (${service.vehicle.plate})` : ""}` : "Sem veículo",
        "Voo": String(service.flight || ""),
        "Qtde pax": paxTotal,
        "Malas": Number(service.bags || 0),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 18 },
      { wch: 30 },
      { wch: 52 },
      { wch: 24 },
      { wch: 28 },
      { wch: 14 },
      { wch: 10 },
      { wch: 10 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Serviços");
    const suffix = `${start || "inicio"}_${end || "fim"}`.replace(/[^\d_]/g, "");
    XLSX.writeFile(wb, `servicos_${suffix || "filtro"}.xlsx`);
    toast({
      title: "Exportação concluída",
      description: `${rows.length} serviço(s) exportado(s).`,
    });
  };

  const typeLabel = (t: string) =>
    t === "corporate" ? "Executivo" :
    t === "airport" ? "Privativo" :
    t === "city_tour" ? "Privativo" :
    t === "hourly" ? "Privativo" : t;

  const paymentLabel = (p: string) =>
    p === "pix" ? "PIX" :
    p === "cash" ? "Dinheiro" :
    p === "credit_card" ? "Cartão crédito" :
    p === "debit_card" ? "Cartão débito" :
    p === "saldo" ? "Saldo" : p;

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
    s === "in_progress" ? "Em andamento" :
    s === "finished" ? "Finalizado" :
    s === "canceled" ? "Cancelado" : s;

  const formatPassengerNames = (nameStr?: string) => {
    const parts = String(nameStr || "")
      .split("&")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length <= 1) return parts[0] || String(nameStr || "");
    if (parts.length === 2) return `${parts[0]} e ${parts[1]}`;
    return `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Agendado</Badge>;
      case "in_progress": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Em andamento</Badge>;
      case "finished": return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">Finalizado</Badge>;
      case "canceled": return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const [, setLocation] = useLocation();
  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Serviços</h2>
          <p className="text-muted-foreground">Gerencie transfers e alocações.</p>
        </div>
        
        <div>
          <Button asChild className="bg-primary shadow-lg hover:shadow-primary/30">
            <Link href="/services/new">
              <Plus className="w-4 h-4 mr-2" /> Novo Serviço
            </Link>
          </Button>
        </div>
        
        <div className="flex gap-2">
          <input
            id={fileInputId}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const buf = await f.arrayBuffer();
              const wb = XLSX.read(buf);
              const sheet = wb.Sheets[wb.SheetNames[0]];
              const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
              const header = (rows[0] || []).map((h) => String(h || "").trim().toLowerCase());
              const idx = (name: string) => {
                const aliases = {
                  hora: ["hora","time"],
                  data: ["data","date"],
                  mozio: ["id mozio","mozio","mozio id"],
                  pax: ["pax","passageiros","qtd","quantidade"],
                  model: ["modelo carro","modelo","car model"],
                  origem: ["origem","origin"],
                  destino: ["destino","destination"],
                  voo: ["vôo","voo","flight"],
                  status: ["status"],
                  motorista: ["motorista","driver"],
                  veiculo: ["veículo","veiculo","vehicle"],
                } as Record<string,string[]>;
                const list = aliases[name];
                const i = header.findIndex((h) => list.includes(h));
                return i >= 0 ? i : -1;
              };
              const hIdx = {
                hora: idx("hora"),
                data: idx("data"),
                mozio: idx("mozio"),
                pax: idx("pax"),
                model: idx("model"),
                origem: idx("origem"),
                destino: idx("destino"),
                voo: idx("voo"),
                status: idx("status"),
                motorista: idx("motorista"),
                veiculo: idx("veiculo"),
                valor: idx("valor"),
                metodo: idx("metodo"),
                status_pagamento: idx("status_pagamento"),
                cliente: idx("cliente"),
                telefone: idx("telefone"),
              };
              const seen = new Set<string>();
              const body = rows.slice(1).filter(r => r && r.length > 0).map((r, i) => {
                const get = (i: number) => (i >= 0 ? String(r[i] ?? "").trim() : "");
                const parseTime = (s: string) => {
                  // accepts 04:40PM or 04:40 PM or 16:40
                  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
                  if (m) {
                    let hh = Number(m[1]); const mm = Number(m[2]); const ap = m[3];
                    if (ap) {
                      if (ap.toUpperCase() === "PM" && hh < 12) hh += 12;
                      if (ap.toUpperCase() === "AM" && hh === 12) hh = 0;
                    }
                    return { hh, mm };
                  }
                  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
                  if (m24) return { hh: Number(m24[1]), mm: Number(m24[2]) };
                  return undefined;
                };
                const dateStr = get(hIdx.data);
                const timeStr = get(hIdx.hora);
                const mozioId = get(hIdx.mozio);
                const paxStr = get(hIdx.pax);
                const carModel = get(hIdx.model);
                const origin = get(hIdx.origem);
                const destination = get(hIdx.destino);
                const flight = get(hIdx.voo);
                const status = get(hIdx.status).toLowerCase();
                const driverName = get(hIdx.motorista);
                const vehicleStr = get(hIdx.veiculo);
                const valorStr = get(hIdx.valor);
                const metodoStr = get(hIdx.metodo).toLowerCase();
                const statusPagStr = get(hIdx.status_pagamento).toLowerCase();
                const clienteStr = get(hIdx.cliente);
                const telefoneStr = get(hIdx.telefone);
                // Parse date dd/MM/yyyy or d/M/yyyy
                const parts = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                const t = parseTime(timeStr);
                let dt = new Date();
                if (parts) {
                  const dd = Number(parts[1]); const MM = Number(parts[2]) - 1; const yyyy = Number(parts[3]);
                  dt = new Date(yyyy, MM, dd, t?.hh ?? 0, t?.mm ?? 0, 0, 0);
                }
                const passengers = Number(paxStr || "0") || 0;
                const statusMap: Record<string, string> = {
                  "agendado": "scheduled",
                  "scheduled": "scheduled",
                  "finalizado": "finished",
                  "finished": "finished",
                  "cancelado": "canceled",
                  "canceled": "canceled",
                  "em andamento": "in_progress",
                  "in progress": "in_progress",
                };
                const st = statusMap[status] || "scheduled";
                const driverId = drivers?.find(d => d.name.toLowerCase() === driverName.toLowerCase())?.id;
                // Try match vehicle by plate at the end after '-' or by model
                let vehicleId: number | undefined = undefined;
                if (vehicleStr) {
                  const plate = vehicleStr.split("-").pop()?.trim().replace(/\s/g, "");
                  vehicleId = vehicles?.find(v => v.plate.replace(/\s/g, "").toUpperCase() === (plate||"").toUpperCase())?.id
                    ?? vehicles?.find(v => v.model.toLowerCase() === vehicleStr.toLowerCase())?.id;
                }
                const errors: string[] = [];
                if (!parts) errors.push("Data inválida");
                if (!origin) errors.push("Origem vazia");
                if (!destination) errors.push("Destino vazio");
                if (driverName && !driverId) errors.push("Motorista não encontrado");
                if (vehicleStr && !vehicleId) errors.push("Veículo não encontrado");
                const valorDigits = valorStr.replace(/\D/g, "");
                const valorNum = valorDigits ? (parseInt(valorDigits, 10) / 100) : 0;
                const methodMap: Record<string,string> = {
                  "pix":"pix","dinheiro":"cash","cash":"cash","cartão crédito":"credit_card","cartao credito":"credit_card","credit_card":"credit_card","cartão débito":"debit_card","cartao debito":"debit_card","debit_card":"debit_card","saldo":"saldo"
                };
                const pm = methodMap[metodoStr] || "pix";
                const statusPayMap: Record<string,string> = {
                  "pendente":"pending","pago":"paid","saldo":"saldo","parcial":"partial","atrasado":"overdue","cancelado":"canceled","pay_driver":"pay_driver","pending":"pending","paid":"paid","partial":"partial","overdue":"overdue","canceled":"canceled"
                };
                const sp = statusPayMap[statusPagStr] || "pending";
                const clientName = clienteStr || "Importado XLSX";
                const key = `${dt.toISOString()}|${origin}|${destination}|${clientName}`.toLowerCase();
                if (seen.has(key)) errors.push("Duplicado no arquivo");
                seen.add(key);
                return {
                  payload: {
                    dateTime: dt,
                    origin,
                    destination,
                    type: "airport",
                    clientName,
                    clientPhone: telefoneStr || "-",
                    clientId: null,
                    driverId: driverId ?? null,
                    vehicleId: vehicleId ?? null,
                    value: valorNum.toFixed(2),
                    paymentMethod: pm,
                    status: st,
                    statusPagamento: sp,
                    notes: "",
                    passengers,
                    carModel,
                    mozioId,
                    flight,
                  },
                  errors,
                  index: i + 2
                };
              });
              setImportRows(body);
              setIsImportOpen(true);
              // reset input so selecting the same file again works
              (e.target as HTMLInputElement).value = "";
            }}
          />
          <Button variant="secondary" onClick={() => document.getElementById(fileInputId)?.click()}>
            Importar XLSX
          </Button>
        </div>

        <Dialog open={isFinanceDialogOpen} onOpenChange={setIsFinanceDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Despesas e Pagamento do Serviço</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!financeServiceId) return;
                const driverPayCents = toCentavos(driverPayDisplay);
                const outrosCents = toCentavos(outrosDisplay);
                const totalOutros = outrosCents + driverPayCents; // desconto do motorista embutido como despesa comum
                await updateExpensesMutation.mutateAsync({
                  combustivel: toCentavos(combDisplay),
                  pedagio: toCentavos(pedagioDisplay),
                  estacionamento: toCentavos(estacDisplay),
                  alimentacao: toCentavos(alimDisplay),
                  outrosCustos: totalOutros,
                });
                qc.invalidateQueries({ queryKey: ["/api/services"] });
                toast({ title: "Despesas salvas", description: `Custos atualizados para o serviço #${financeServiceId}.` });
                setIsFinanceDialogOpen(false);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4">
                
              </div>

              <div className="grid grid-cols-2 gap-4">
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">KM Real</label>
                  <Input
                    type="number"
                    step="0.01"
                    onBlur={async (e) => {
                      if (!financeServiceId) return;
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      if (val !== undefined) await updateExpensesMutation.mutateAsync({ kmReal: val });
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Combustível</label>
                  <Input
                    type="text"
                    value={combDisplay}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      const cents = digits ? parseInt(digits, 10) : 0;
                      const amount = cents / 100;
                      setCombDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Pedágio</label>
                  <Input
                    type="text"
                    value={pedagioDisplay}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      const cents = digits ? parseInt(digits, 10) : 0;
                      const amount = cents / 100;
                      setPedagioDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Estacionamento</label>
                  <Input
                    type="text"
                    value={estacDisplay}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      const cents = digits ? parseInt(digits, 10) : 0;
                      const amount = cents / 100;
                      setEstacDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Alimentação</label>
                  <Input
                    type="text"
                    value={alimDisplay}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      const cents = digits ? parseInt(digits, 10) : 0;
                      const amount = cents / 100;
                      setAlimDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Outros Custos</label>
                  <Input
                    type="text"
                    value={outrosDisplay}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      const cents = digits ? parseInt(digits, 10) : 0;
                      const amount = cents / 100;
                      setOutrosDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Pagamento Motorista (abate no custo)</label>
                  <Input
                    type="text"
                    value={driverPayDisplay}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      const cents = digits ? parseInt(digits, 10) : 0;
                      const amount = cents / 100;
                      setDriverPayDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
                    }}
                  />
                  <div className="text-xs text-muted-foreground mt-1">Será somado em “Outros Custos”.</div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={updateExpensesMutation.isPending}>
                Salvar Despesas
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border">
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Buscar cliente, origem ou destino..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="min-w-48">
              <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Pagamento (status)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                        {["pending","paid","saldo","partial","overdue","canceled","pay_driver"].map(s => (
                    <SelectItem key={s} value={s}>{paymentStatusLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-48">
              <Select value={filterTravelStatus} onValueChange={setFilterTravelStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status da viagem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {serviceStatusEnum.map(s => (
                    <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => {}}>
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
            <Button variant="outline" className="gap-2" onClick={exportServicesXlsx}>
              <Download className="w-4 h-4" />
              Exportar XLSX
            </Button>
          </div>
        </div>
        <div className="mb-4">
          <div className="space-y-3">
            <DateQuickFilters
              start={start}
              end={end}
              onChange={({ start: s, end: e }) => { setStart(s); setEnd(e); setPage(0); }}
            />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select value={String(filterDriverId)} onValueChange={(v) => { setFilterDriverId(v === "none" ? "" : Number(v)); setPage(0); }}>
                <SelectTrigger><SelectValue placeholder="Motorista (opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {drivers?.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={String(filterVehicleId)} onValueChange={(v) => { setFilterVehicleId(v === "none" ? "" : Number(v)); setPage(0); }}>
                <SelectTrigger><SelectValue placeholder="Veículo (opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {vehicles?.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.model} ({v.plate})</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterTravelStatus} onValueChange={(v) => { setFilterTravelStatus(v); setPage(0); }}>
                <SelectTrigger><SelectValue placeholder="Status do serviço" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="finished">Finalizado</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPaymentStatus} onValueChange={(v) => { setFilterPaymentStatus(v); setPage(0); }}>
                <SelectTrigger><SelectValue placeholder="Status de pagamento" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="saldo">Saldo</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                  <SelectItem value="pay_driver">Pagar ao Motorista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select value={filterPaymentMethod} onValueChange={(v) => { setFilterPaymentMethod(v); setPage(0); }}>
                <SelectTrigger><SelectValue placeholder="Método de pagamento" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão débito</SelectItem>
                  <SelectItem value="saldo">Saldo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto hidden md:block">
        <Table className="min-w-[1100px]">
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Rota</TableHead>
              <TableHead>Motorista/Veículo</TableHead>
              <TableHead>Valor Cobrado</TableHead>
              <TableHead>Despesas</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={11} className="text-center py-8">Carregando serviços...</TableCell></TableRow>
            ) : filteredServices?.length === 0 ? (
              <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Nenhum serviço encontrado.</TableCell></TableRow>
            ) : (
              filteredServices?.map((service) => (
                <>
                <TableRow 
                  key={`main-${service.id}`} 
                  className="group hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => handleEdit(service)}
                >
                  <TableCell className="w-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === service.id ? null : service.id); }}
                      aria-label="Mostrar detalhes"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === service.id ? "rotate-180" : ""}`} />
                    </Button>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">#{String(service.id).padStart(4, "0")}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{format(new Date(service.dateTime), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(service.dateTime), 'HH:mm', { locale: ptBR })}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{formatPassengerNames(service.clientName)}</span>
                      <span className="text-xs text-muted-foreground">{service.clientPhone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col max-w-[200px]">
                      <span className="truncate text-sm" title={service.origin}>{service.origin}</span>
                      <span className="text-xs text-muted-foreground truncate" title={service.destination}>→ {service.destination}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {service.driver ? (
                       <div className="text-sm">
                         <div>{service.driver.name}</div>
                        <div className="text-xs text-muted-foreground">{service.vehicle?.model || "Sem veículo"}</div>
                       </div>
                    ) : (
                      <span className="text-destructive text-xs font-medium">Não atribuído</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const num =
                        typeof service.valorCobrado === "number" && service.valorCobrado > 0
                          ? service.valorCobrado / 100
                          : Number(service.value || 0);
                      const brl = num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                      return <span className="font-medium">{brl}</span>;
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const sum =
                        (service.combustivel || 0) +
                        (service.pedagio || 0) +
                        (service.estacionamento || 0) +
                        (service.alimentacao || 0) +
                        (service.outrosCustos || 0);
                      return (
                        <span>
                          {(sum / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <ServiceFinanceCell serviceId={service.id} />
                  </TableCell>
                  <TableCell>{getStatusBadge(service.status)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <MoreHorizontal className="w-4 h-4" />
                          Ações
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setLocation(`/services/${service.id}/edit`)}>
                          <Pencil className="w-4 h-4 text-blue-600" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openFinanceDialog(service)}>
                          <DollarSign className="w-4 h-4 text-green-600" /> Despesas
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(`/services/${service.id}/voucher`, "_blank")}>
                          PDF Voucher
                        </DropdownMenuItem>
                        {((service.statusPagamento || "pending") !== "paid" && (service.statusPagamento || "pending") !== "saldo") && (
                          <DropdownMenuItem
                            onClick={async () => {
                              try {
                                await updateMutation.mutateAsync({ id: service.id, statusPagamento: "paid" });
                                toast({ title: "Atualizado", description: `Serviço #${service.id} marcado como pago.` });
                              } catch (err: any) {
                                toast({ title: "Erro", description: err?.message || "Falha ao marcar pago", variant: "destructive" });
                              }
                            }}
                          >
                            Marcar pago
                          </DropdownMenuItem>
                        )}
                        {service.statusPagamento === "partial" && service.restanteMetodo === "pay_driver" && service.driverId && (
                          <DropdownMenuItem
                            onClick={async () => {
                              const total = Number(service.valorCobrado || 0) > 0 ? Number(service.valorCobrado || 0) : Math.round(Number(service.value || 0) * 100);
                              const pagoParcial = Number(service.valorPagoParcial || 0);
                              const restante = Math.max(0, total - pagoParcial);
                              if (restante <= 0) {
                                toast({ title: "Nada a pagar", description: "Nenhum restante para pagar ao motorista." });
                                return;
                              }
                              try {
                                await createDriverPay.mutateAsync({
                                  driverId: service.driverId,
                                  serviceId: service.id,
                                  valorCentavos: restante,
                                  metodoPagamento: "cash",
                                  statusPagamento: "pending",
                                  observacao: "Restante do serviço (pagar ao motorista)",
                                } as any);
                                toast({ title: "Registro criado", description: `Pagamento de motorista criado (R$ ${(restante / 100).toFixed(2)}).` });
                              } catch (err: any) {
                                toast({ title: "Erro", description: err?.message || "Falha ao criar pagamento de motorista", variant: "destructive" });
                              }
                            }}
                            disabled={createDriverPay.isPending}
                          >
                            Pagar motorista
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(service.id)}>
                          <Trash2 className="w-4 h-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                {expandedId === service.id && (
                  <TableRow>
                    <TableCell colSpan={11}>
                      <div className="p-4 bg-muted/20 rounded-lg">
                        <div className="mb-2 text-sm font-medium">Despesas da corrida</div>
                        <div className="flex flex-wrap gap-2">
                          {(service.combustivel || 0) > 0 && (
                            <Badge variant="outline">Combustível: {(service.combustivel / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</Badge>
                          )}
                          {(service.pedagio || 0) > 0 && (
                            <Badge variant="outline">Pedágio: {(service.pedagio / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</Badge>
                          )}
                          {(service.estacionamento || 0) > 0 && (
                            <Badge variant="outline">Estacionamento: {(service.estacionamento / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</Badge>
                          )}
                          {(service.alimentacao || 0) > 0 && (
                            <Badge variant="outline">Alimentação: {(service.alimentacao / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</Badge>
                          )}
                          {(service.outrosCustos || 0) > 0 && (
                            <Badge variant="outline">Outros: {(service.outrosCustos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</Badge>
                          )}
                          {!service.combustivel &&
                            !service.pedagio &&
                            !service.estacionamento &&
                            !service.alimentacao &&
                            !service.outrosCustos && <span className="text-xs text-muted-foreground">Sem despesas lançadas</span>}
                        </div>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">KM Previsto</div>
                            <div className="font-medium">{service.kmPrevisto ?? "-"}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">KM Real</div>
                            <div className="font-medium">{service.kmReal ?? "-"}</div>
                          </div>
                          <div className="text-right md:text-left">
                            <Button variant="outline" onClick={() => openFinanceDialog(service)}>Editar despesas</Button>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                </>
              ))
            )}
          </TableBody>
        </Table>
        </div>

        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="text-center py-8">Carregando serviços...</div>
          ) : filteredServices?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum serviço encontrado.</div>
          ) : (
            filteredServices?.map((service) => (
              <div key={`card-${service.id}`} className="rounded-lg border bg-card p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-muted-foreground">#{String(service.id).padStart(4, "0")}</div>
                    <div className="font-medium">{format(new Date(service.dateTime), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <MoreHorizontal className="w-4 h-4" />
                        Ações
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setLocation(`/services/${service.id}/edit`)}>
                        <Pencil className="w-4 h-4 text-blue-600" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openFinanceDialog(service)}>
                        <DollarSign className="w-4 h-4 text-green-600" /> Despesas
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`/services/${service.id}/voucher`, "_blank")}>
                        PDF Voucher
                      </DropdownMenuItem>
                      {((service.statusPagamento || "pending") !== "paid" && (service.statusPagamento || "pending") !== "saldo") && (
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              await updateMutation.mutateAsync({ id: service.id, statusPagamento: "paid" });
                              toast({ title: "Atualizado", description: `Serviço #${service.id} marcado como pago.` });
                            } catch (err: any) {
                              toast({ title: "Erro", description: err?.message || "Falha ao marcar pago", variant: "destructive" });
                            }
                          }}
                        >
                          Marcar pago
                        </DropdownMenuItem>
                      )}
                      {service.statusPagamento === "partial" && service.restanteMetodo === "pay_driver" && service.driverId && (
                        <DropdownMenuItem
                          onClick={async () => {
                            const total = Number(service.valorCobrado || 0) > 0 ? Number(service.valorCobrado || 0) : Math.round(Number(service.value || 0) * 100);
                            const pagoParcial = Number(service.valorPagoParcial || 0);
                            const restante = Math.max(0, total - pagoParcial);
                            if (restante <= 0) {
                              toast({ title: "Nada a pagar", description: "Nenhum restante para pagar ao motorista." });
                              return;
                            }
                            try {
                              await createDriverPay.mutateAsync({
                                driverId: service.driverId,
                                serviceId: service.id,
                                valorCentavos: restante,
                                metodoPagamento: "cash",
                                statusPagamento: "pending",
                                observacao: "Restante do serviço (pagar ao motorista)",
                              } as any);
                              toast({ title: "Registro criado", description: `Pagamento de motorista criado (R$ ${(restante / 100).toFixed(2)}).` });
                            } catch (err: any) {
                              toast({ title: "Erro", description: err?.message || "Falha ao criar pagamento de motorista", variant: "destructive" });
                            }
                          }}
                          disabled={createDriverPay.isPending}
                        >
                          Pagar motorista
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(service.id)}>
                        <Trash2 className="w-4 h-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-2">
                  <div className="text-sm font-medium">{formatPassengerNames(service.clientName)}</div>
                  <div className="text-xs text-muted-foreground">{service.clientPhone}</div>
                </div>
                <div className="mt-2 text-sm">
                  <div className="truncate"><span className="text-muted-foreground">Origem:</span> {service.origin}</div>
                  <div className="truncate"><span className="text-muted-foreground">Destino:</span> {service.destination}</div>
                </div>
                <div className="mt-2 text-sm">
                  {service.driver ? (
                    <div>
                      <div className="font-medium">{service.driver.name}</div>
                      <div className="text-xs text-muted-foreground">{service.vehicle?.model || "Sem veículo"}</div>
                    </div>
                  ) : (
                    <span className="text-destructive text-xs font-medium">Não atribuído</span>
                  )}
                </div>
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-sm">
                    {(() => {
                      const num =
                        typeof service.valorCobrado === "number" && service.valorCobrado > 0
                          ? service.valorCobrado / 100
                          : Number(service.value || 0);
                      return <span className="font-semibold">R$ {num.toFixed(2)}</span>;
                    })()}
                  </div>
                  <div>{getStatusBadge(service.status)}</div>
                </div>
                <div className="mt-2">
                  <ServiceFinanceCell serviceId={service.id} />
                </div>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-medium">{paged?.total ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Anterior</Button>
            <div className="text-sm">Página {page + 1}</div>
            <Button variant="outline" size="sm" onClick={() => {
              const nextOffset = (page + 1) * pageSize;
              if (nextOffset < (paged?.total ?? 0)) setPage((p) => p + 1);
            }} disabled={((page + 1) * pageSize) >= (paged?.total ?? 0)}>Próxima</Button>
          </div>
        </div>
      </div>
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar Agendamentos (.xlsx)</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mb-3">
            Linhas carregadas: <span className="font-medium">{importRows.length}</span>{" "}
            • Válidas: <span className="font-medium">{importRows.filter((r: any) => (r.errors || []).length === 0).length}</span>{" "}
            • Com erros: <span className="font-medium">{importRows.filter((r: any) => (r.errors || []).length > 0).length}</span>
          </div>
          <div className="border rounded-md overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Pax</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Voo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importRows.slice(0, 10).map((r: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{format(new Date(r.payload.dateTime), "dd/MM/yyyy HH:mm")}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={r.payload.origin}>{r.payload.origin}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={r.payload.destination}>{r.payload.destination}</TableCell>
                    <TableCell>{r.payload.passengers}</TableCell>
                    <TableCell>{r.payload.carModel}</TableCell>
                    <TableCell>{r.payload.flight}</TableCell>
                    <TableCell>{statusLabel(r.payload.status)}</TableCell>
                    <TableCell className="text-destructive text-xs">
                      {(r.errors || []).join("; ")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="text-xs text-muted-foreground">Mostrando 10 primeiras linhas</div>
            <Button
              disabled={importing || importRows.length === 0}
              onClick={async () => {
                setImporting(true);
                try {
                  let ok = 0; let fail = 0;
                  const validRows = importRows.filter((r: any) => (r.errors || []).length === 0);
                  for (const row of validRows) {
                    try {
                      await createMutation.mutateAsync(row.payload);
                      ok++;
                    } catch (e: any) {
                      fail++;
                    }
                  }
                  setIsImportOpen(false);
                  setImportRows([]);
                  toast({
                    title: "Importação concluída",
                    description: `Sucesso: ${ok} • Falhas: ${fail}`,
                  });
                } finally {
                  setImporting(false);
                }
              }}
            >
              {importing ? "Importando..." : `Importar ${importRows.filter((r: any) => (r.errors || []).length === 0).length} válidos`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

// (excluído) listagem inline de pagamentos de motorista — agora embutidos nas despesas comuns
function ServiceFinanceCell({ serviceId }: { serviceId: number }) {
  const { data, isLoading } = useFinanceProfit(serviceId);
  if (isLoading || !data) return <span className="text-xs text-muted-foreground">...</span>;
  const value = (data.lucroCentavos / 100).toFixed(2);
  return (
    <span className={data.prejuizo ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
      R${value}
    </span>
  );
}
