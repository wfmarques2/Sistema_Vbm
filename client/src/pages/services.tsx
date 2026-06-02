import { Layout } from "@/components/layout";
import { useServicesPaged, useCreateService, useUpdateService, useDeleteService } from "@/hooks/use-services";
import { useDrivers, useCreateDriver } from "@/hooks/use-drivers";
import { useClients, useClientDependents, useCreateClient, useCreateClientDependent } from "@/hooks/use-clients";
import { useVehicles, useCreateVehicle } from "@/hooks/use-vehicles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { es, ptBR } from "date-fns/locale";
import { Plus, Search, Filter, Pencil, Trash2, ChevronDown, DollarSign, MoreHorizontal, Download } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useEffect, useMemo, useState } from "react";
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertServiceSchema } from "@shared/schema";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { useUpdateServiceExpenses, useCreateDriverPayment } from "@/hooks/use-financial";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DateQuickFilters } from "@/components/date-quick-filters";
import { Switch } from "@/components/ui/switch";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";

export default function ServicesPage() {
  const { language, t } = useI18n();
  const numberLocale = language === "es" ? "es-ES" : "pt-BR";
  const dateLocale = language === "es" ? es : ptBR;
  const [location, setLocation] = useLocation();
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
  const createDriverMutation = useCreateDriver();
  const createVehicleMutation = useCreateVehicle();
  const [filterTravelStatus, setFilterTravelStatus] = useState<string>("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("all");
  const [filterDriverId, setFilterDriverId] = useState<number | "">("");
  const [filterVehicleId, setFilterVehicleId] = useState<number | "">("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterMonth, setFilterMonth] = useState<string>("all");
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
  const [driverPaymentDate, setDriverPaymentDate] = useState<string>("");
  const [driverPaymentStatus, setDriverPaymentStatus] = useState<string>("pending");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputId = "xlsx-import-input";
  const { toast } = useToast();
  const qc = useQueryClient();
  const createDriverPay = useCreateDriverPayment();
  const [editingService, setEditingService] = useState<any | null>(null);
  const monthOptions = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const toDateInput = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

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
        const brl = (abs / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" });
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
    setCombDisplay(((service.combustivel ?? 0) / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" }));
    setPedagioDisplay(((service.pedagio ?? 0) / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" }));
    setEstacDisplay(((service.estacionamento ?? 0) / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" }));
    setAlimDisplay(((service.alimentacao ?? 0) / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" }));
    setOutrosDisplay(((service.outrosCustos ?? 0) / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" }));
    setDriverPayDisplay(((service.driverPaymentCents ?? 0) / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" }));
    setDriverPaymentDate(service.driverPaymentDate ? toDateInput(new Date(service.driverPaymentDate)) : "");
    setDriverPaymentStatus(service.driverPaymentStatus || "pending");
    setIsFinanceDialogOpen(true);
  };

  useEffect(() => {
    const query = location.includes("?") ? location.split("?")[1] : "";
    if (!query) return;
    const params = new URLSearchParams(query);
    const financeParam = Number(params.get("finance") || 0);
    if (!financeParam || !paged?.rows?.length) return;
    const target = (paged.rows || []).find((s: any) => Number(s.id) === financeParam);
    if (!target) return;
    openFinanceDialog(target);
    setLocation("/services");
  }, [location, paged?.rows]);

  const toCentavos = (display: string) => {
    const digits = display.replace(/\D/g, "");
    const cents = digits ? parseInt(digits, 10) : 0;
    return cents;
  };

  const handleEdit = (service: any) => {
    if (service?.isReturn) {
      openFinanceDialog(service);
      return;
    }
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
  const displayServices = useMemo(() => {
    const rows = filteredServices || [];
    return [...rows].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [filteredServices]);
  const servicesById = useMemo(() => {
    const map = new Map<number, any>();
    for (const s of filteredServices || []) {
      map.set(Number(s.id), s);
    }
    return map;
  }, [filteredServices]);
  const returnServicesByParent = useMemo(() => {
    const map = new Map<number, any[]>();
    for (const s of filteredServices || []) {
      if (!s.isReturn || !s.parentServiceId) continue;
      const key = Number(s.parentServiceId);
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    }
    return map;
  }, [filteredServices]);

  const getDirectValueCents = (service: any) => {
    if (typeof service.valorCobrado === "number" && service.valorCobrado > 0) return Number(service.valorCobrado);
    const parsed = Math.round(Number(service.value || 0) * 100);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const getDirectExpenseCents = (service: any) =>
    Number(service.combustivel || 0) +
    Number(service.pedagio || 0) +
    Number(service.estacionamento || 0) +
    Number(service.alimentacao || 0) +
    Number(service.outrosCustos || 0);
  const getFinancialView = (service: any) => {
    if (service.isReturn) {
      const parent = servicesById.get(Number(service.parentServiceId || 0));
      return {
        valueCents: 0,
        expenseCents: getDirectExpenseCents(service),
        resultCents: 0,
        isReturn: true,
        parentId: parent?.id,
      };
    }
    const returns = returnServicesByParent.get(Number(service.id)) || [];
    const valueCents = getDirectValueCents(service);
    const ownExpenses = getDirectExpenseCents(service);
    const returnExpenses = returns.reduce((sum, r) => sum + getDirectExpenseCents(r), 0);
    const expenseCents = ownExpenses + returnExpenses;
    return {
      valueCents,
      expenseCents,
      resultCents: valueCents - expenseCents,
      isReturn: false,
      returnCount: returns.length,
      returnExpenses,
    };
  };

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
        "Data/Hora": format(new Date(service.dateTime), "dd/MM/yyyy HH:mm", { locale: dateLocale }),
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
    p === "mozio" ? "MOZIO" :
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
    s === "driving_pickup" ? "Direção embarque" :
    s === "pickup_location" ? "Local embarque" :
    s === "driving_destination" ? "Direção destino" :
    s === "in_progress" ? "Direção destino" :
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

  const findDriverSmarter = (name: string) => {
    if (!name) return null;
    const search = name.toLowerCase().trim();
    // 1. Exact match
    const exact = drivers?.find(d => d.name.toLowerCase().trim() === search);
    if (exact) return exact;
    
    // 2. Partial match: verifica se todas as partes do nome buscado existem no nome do motorista
    // ou se todas as partes do nome do motorista existem na busca.
    const searchParts = search.split(/\s+/).filter(p => p.length > 2); // ignora "de", "da", etc.
    const partial = drivers?.find(d => {
      const dName = d.name.toLowerCase().trim();
      if (searchParts.length === 0) return dName === search;
      return searchParts.every(p => dName.includes(p)) || dName.split(/\s+/).filter(p => p.length > 2).every(p => search.includes(p));
    });
    return partial || null;
  };

  const findVehicleSmarter = (model: string, plate: string) => {
    if (!plate && !model) return null;
    const plateSearch = plate?.replace(/\s/g, "").toUpperCase();
    const modelSearch = model?.toLowerCase().trim();

    // 1. Prioridade Total: Busca pela Placa (Identificador Único)
    if (plateSearch) {
      const byPlate = vehicles?.find(v => v.plate.replace(/\s/g, "").toUpperCase() === plateSearch);
      if (byPlate) return byPlate;
    }

    // 2. Segunda Opção: Busca pelo Modelo exato
    if (modelSearch) {
      const byModel = vehicles?.find(v => v.model.toLowerCase().trim() === modelSearch);
      if (byModel) return byModel;
    }

    return null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled": return <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200">Agendado</Badge>;
      case "driving_pickup": return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Direção embarque</Badge>;
      case "pickup_location": return <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200">Local embarque</Badge>;
      case "driving_destination": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Direção destino</Badge>;
      case "in_progress": return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">Direção destino</Badge>;
      case "finished": return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">Finalizado</Badge>;
      case "canceled": return <Badge variant="destructive">Cancelado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">{t("services.title")}</h2>
          <p className="text-muted-foreground">Gerencie transfers e alocações.</p>
        </div>
        
        <div>
          <Button asChild className="bg-primary shadow-lg hover:shadow-primary/30">
            <Link href="/services/new">
              <Plus className="w-4 h-4 mr-2" /> {t("services.new")}
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
              const headerRowIndex = rows.findIndex(r => r.includes("DATA") && r.includes("HORA"));
              const header = (rows[headerRowIndex] || []).map((h) => String(h || "").trim().toLowerCase());
              
              const excelDateToJS = (serial: any) => {
                if (!serial) return new Date();
                if (serial instanceof Date) return serial;

                if (typeof serial === "string") {
                  const p = serial.split(/[\/\-]/);
                  if (p.length === 3) {
                    let day, month, year;
                    if (p[0].length === 4) {
                      // YYYY-MM-DD
                      year = Number(p[0]);
                      month = Number(p[1]) - 1;
                      day = Number(p[2]);
                    } else {
                      const v0 = Number(p[0]);
                      const v1 = Number(p[1]);
                      const v2 = Number(p[2]);
                      
                      // Se o segundo componente for > 12, provavelmente é M/D/Y (formato americano)
                      if (v1 > 12) {
                        month = v0 - 1;
                        day = v1;
                        year = v2;
                      } else {
                        // Caso contrário, assume D/M/Y (formato brasileiro/padrão)
                        day = v0;
                        month = v1 - 1;
                        year = v2;
                      }
                      if (year < 100) year += 2000;
                    }
                    const d = new Date(year, month, day);
                    if (!isNaN(d.getTime())) return d;
                  }
                  
                  const d = new Date(serial);
                  if (!isNaN(d.getTime())) return d;
                }

                const num = Number(serial);
                if (isNaN(num)) return new Date();
                return new Date(Math.round((num - 25569) * 86400 * 1000));
              };

              const parseTime = (s: any) => {
                if (typeof s === "number") {
                  const totalSeconds = Math.round(s * 86400);
                  const hh = Math.floor(totalSeconds / 3600);
                  const mm = Math.floor((totalSeconds % 3600) / 60);
                  return { hh, mm };
                }
                const str = String(s || "");
                const m = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
                if (m) {
                  let hh = Number(m[1]); const mm = Number(m[2]); const ap = m[3];
                  if (ap) {
                    if (ap.toUpperCase() === "PM" && hh < 12) hh += 12;
                    if (ap.toUpperCase() === "AM" && hh === 12) hh = 0;
                  }
                  return { hh, mm };
                }
                const m24 = str.match(/^(\d{1,2}):(\d{2})$/);
                if (m24) return { hh: Number(m24[1]), mm: Number(m24[2]) };
                return undefined;
              };

              const idx = (name: string) => {
                const aliases = {
                  hora: ["hora", "time"],
                  data: ["data", "date"],
                  nome: ["nome", "passenger", "cliente"],
                  telefone: ["telefone", "phone"],
                  voo: ["vôo", "voo", "flight", "vèo"],
                  pax: ["pax", "passageiros", "qtd", "quantidade"],
                  origem: ["origem", "origin"],
                  destino: ["destino", "destination"],
                  valor: ["valor", "value", "price"],
                  motorista: ["motorista", "driver"],
                  veiculo: ["carro", "veículo", "veiculo", "vehicle"],
                } as Record<string, string[]>;
                const list = aliases[name];
                if (name === "veiculo") {
                  const i = header.lastIndexOf("carro");
                  if (i >= 0) return i;
                }
                const i = header.findIndex((h) => list.includes(h));
                return i >= 0 ? i : -1;
              };
              const hIdx = {
                hora: idx("hora"),
                data: idx("data"),
                nome: idx("nome"),
                telefone: idx("telefone"),
                voo: idx("voo"),
                pax: idx("pax"),
                origem: idx("origem"),
                destino: idx("destino"),
                valor: idx("valor"),
                motorista: idx("motorista"),
                veiculo: idx("veiculo"),
              };

              // Buscar serviços existentes para verificação de duplicidade
              const relevantRows = rows.slice(headerRowIndex + 1).filter(r => r && r.length > 0 && r[hIdx.data]);
              const dates = relevantRows.map(r => excelDateToJS(r[hIdx.data]));
              const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
              const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
              // Adiciona margem de 1 dia
              minDate.setDate(minDate.getDate() - 1);
              maxDate.setDate(maxDate.getDate() + 1);

              let existingServices: any[] = [];
              try {
                const res = await fetch(`/api/services?start=${minDate.toISOString()}&end=${maxDate.toISOString()}`, { credentials: "include" });
                if (res.ok) {
                  existingServices = await res.json();
                }
              } catch (err) {
                console.error("Erro ao buscar serviços existentes:", err);
              }

              const seen = new Set<string>();
              const body = relevantRows.map((r, i) => {
                const get = (i: number) => (i >= 0 ? String(r[i] ?? "").trim() : "");
                
                const dateVal = r[hIdx.data];
                const timeVal = r[hIdx.hora];
                const paxStr = get(hIdx.pax);
                const origin = get(hIdx.origem);
                const destination = get(hIdx.destino);
                const flight = get(hIdx.voo);
                const driverName = get(hIdx.motorista);
                const vehicleStr = get(hIdx.veiculo);
                const valorStr = get(hIdx.valor);
                const clienteStr = get(hIdx.nome);
                let telefoneStr = get(hIdx.telefone).replace(/\s/g, "");
                if (telefoneStr && !telefoneStr.startsWith("+")) {
                  telefoneStr = "+" + telefoneStr;
                }

                const dtBase = excelDateToJS(dateVal);
                const t = parseTime(timeVal);
                const dt = new Date(dtBase.getFullYear(), dtBase.getMonth(), dtBase.getDate(), t?.hh ?? 0, t?.mm ?? 0);
                
                const passengers = Number(paxStr || "0") || 0;
                
                // Limpa o valor de símbolos de moeda e garante o formato numérico correto
                const cleanValor = (s: string) => {
                  if (!s) return 0;
                  // Remove tudo que não for número, vírgula ou ponto
                  let cleaned = s.replace(/[^\d,\.]/g, "");
                  
                  // Se houver vírgula e ponto, assume que o último é o separador decimal
                  const lastComma = cleaned.lastIndexOf(",");
                  const lastDot = cleaned.lastIndexOf(".");
                  
                  if (lastComma > lastDot) {
                    // Formato 1.234,56 -> 1234.56
                    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
                  } else if (lastDot > lastComma && lastComma !== -1) {
                    // Formato 1,234.56 -> 1234.56
                    cleaned = cleaned.replace(/,/g, "");
                  } else if (lastComma !== -1) {
                    // Apenas vírgula: 15,50 -> 15.50
                    cleaned = cleaned.replace(",", ".");
                  }
                  
                  return parseFloat(cleaned) || 0;
                };

                const valorNumUsd = cleanValor(String(valorStr));
                const conversionRate = 5.5; 
                const valorNumBrl = valorNumUsd * conversionRate;

                const matchedDriver = findDriverSmarter(driverName);
                const driverId = matchedDriver?.id;

                let vehicleId: number | undefined = undefined;
                if (vehicleStr) {
                  let extractedModel = "Importado";
                  let extractedPlate = "";
                  
                  if (vehicleStr.includes(" - ")) {
                    const parts = vehicleStr.split(" - ");
                    extractedModel = parts[0].trim();
                    extractedPlate = parts.slice(1).join(" - ").trim();
                  } else if (vehicleStr.includes("-")) {
                    const parts = vehicleStr.split("-").map(p => p.trim());
                    if (parts.length > 2) {
                      extractedModel = parts[0];
                      extractedPlate = parts.slice(1).join("-");
                    } else {
                      extractedModel = parts[0];
                      extractedPlate = parts[1] || "";
                    }
                  } else {
                    extractedModel = vehicleStr;
                  }

                  const matchedVehicle = findVehicleSmarter(extractedModel, extractedPlate);
                  vehicleId = matchedVehicle?.id;
                }

                const errors: string[] = [];
                if (!dateVal) errors.push("Data ausente");
                if (!origin) errors.push("Origem vazia");
                if (!destination) errors.push("Destino vazio");
                
                const clientName = clienteStr || "Importado XLSX";
                
                // Verificação de duplicidade no arquivo
                const key = `${dt.toISOString()}|${origin}|${destination}|${clientName}`.toLowerCase();
                if (seen.has(key)) errors.push("Duplicado no arquivo");
                seen.add(key);

                // Verificação de duplicidade no banco de dados
                const isDuplicateInDb = existingServices?.some((s: any) => {
                  const sDt = new Date(s.dateTime);
                  return (
                    sDt.getTime() === dt.getTime() &&
                    s.origin.toLowerCase().trim() === origin.toLowerCase().trim() &&
                    s.destination.toLowerCase().trim() === destination.toLowerCase().trim() &&
                    s.clientName.toLowerCase().trim() === clientName.toLowerCase().trim()
                  );
                });
                if (isDuplicateInDb) errors.push("Já existe no sistema");

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
                    value: valorNumBrl.toFixed(2),
                    paymentMethod: "mozio",
                    status: "scheduled",
                    statusPagamento: "pending",
                    notes: "",
                    passengers,
                    bags: passengers,
                    paxAdt: passengers,
                    flight,
                    guide: "",
                    driverNameDraft: driverName,
                    vehicleModelDraft: vehicleStr,
                  },
                  errors,
                  index: i + headerRowIndex + 2
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
                  driverPaymentDate: driverPaymentDate || null,
                  driverPaymentCents: driverPayCents,
                  driverPaymentStatus: driverPaymentStatus,
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
                      setCombDisplay(amount.toLocaleString(numberLocale, { style: "currency", currency: "BRL" }));
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
                      setPedagioDisplay(amount.toLocaleString(numberLocale, { style: "currency", currency: "BRL" }));
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
                      setEstacDisplay(amount.toLocaleString(numberLocale, { style: "currency", currency: "BRL" }));
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
                      setAlimDisplay(amount.toLocaleString(numberLocale, { style: "currency", currency: "BRL" }));
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
                      setOutrosDisplay(amount.toLocaleString(numberLocale, { style: "currency", currency: "BRL" }));
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
                      setDriverPayDisplay(amount.toLocaleString(numberLocale, { style: "currency", currency: "BRL" }));
                    }}
                  />
                  <div className="text-xs text-muted-foreground mt-1">Será somado em “Outros Custos”.</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Data do Pagamento</label>
                  <Input
                    type="date"
                    value={driverPaymentDate}
                    onChange={(e) => setDriverPaymentDate(e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground mt-1">Data que aparecerá no financeiro.</div>
                </div>
              </div>

              <div className="flex items-center gap-2 py-2 px-1 bg-secondary/20 rounded-lg">
                <label className="text-sm font-medium flex-1">Status do Pagamento ao Motorista</label>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${driverPaymentStatus === "paid" ? "text-green-600" : "text-amber-600"}`}>
                    {driverPaymentStatus === "paid" ? "PAGO" : "PENDENTE"}
                  </span>
                  <Switch
                    checked={driverPaymentStatus === "paid"}
                    onCheckedChange={(checked: boolean) => setDriverPaymentStatus(checked ? "paid" : "pending")}
                  />
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
            <div className="min-w-40">
              <Select
                value={filterMonth}
                onValueChange={(v) => {
                  setFilterMonth(v);
                  if (v === "all") {
                    setStart("");
                    setEnd("");
                    setPage(0);
                    return;
                  }
                  const year = new Date().getFullYear();
                  const month = Number(v);
                  const monthStart = new Date(year, month, 1);
                  const monthEnd = new Date(year, month + 1, 0);
                  setStart(toDateInput(monthStart));
                  setEnd(toDateInput(monthEnd));
                  setPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {monthOptions.map((m, idx) => (
                    <SelectItem key={m} value={String(idx)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => setShowFilters((v) => !v)}>
              <Filter className="w-4 h-4" />
              {showFilters ? "Ocultar filtros" : "Filtros"}
            </Button>
            <Button variant="outline" className="gap-2" onClick={exportServicesXlsx}>
              <Download className="w-4 h-4" />
              Exportar XLSX
            </Button>
          </div>
        </div>
        {showFilters && (
        <div className="mb-4 p-4 border-b border-border/60">
          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
            <DateQuickFilters
              start={start}
              end={end}
              onChange={({ start: s, end: e }) => {
                setStart(s);
                setEnd(e);
                setFilterMonth("all");
                setPage(0);
              }}
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
                  <SelectItem value="driving_pickup">Direção embarque</SelectItem>
                  <SelectItem value="pickup_location">Local embarque</SelectItem>
                  <SelectItem value="driving_destination">Direção destino</SelectItem>
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
                  <SelectItem value="mozio">MOZIO</SelectItem>
                  <SelectItem value="saldo">Saldo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        )}

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
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={11} className="text-center py-8">{t("services.loading")}</TableCell></TableRow>
            ) : displayServices.length === 0 ? (
              <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">{t("services.empty")}</TableCell></TableRow>
            ) : (
              displayServices.map((service) => {
                const linkedReturns = returnServicesByParent.get(Number(service.id)) || [];
                const hasLinkedReturn = !service.isReturn && linkedReturns.length > 0;
                const parentId = Number(service.parentServiceId || 0);
                const parentService = service.isReturn ? servicesById.get(parentId) : null;
                const finance = getFinancialView(service);
                return (
                <React.Fragment key={`main-${service.id}`}>
                <TableRow 
                  className={`group hover:bg-muted/30 transition-colors cursor-pointer ${service.isReturn ? "bg-amber-50/70 hover:bg-amber-100/80 dark:bg-[#3a2c1c]/45 dark:hover:bg-[#4a3720]/55" : ""} ${hasLinkedReturn ? "bg-cyan-50/50 dark:bg-[#1e2f39]/30" : ""}`}
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
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>#{String(service.id).padStart(4, "0")}</span>
                      {service.isReturn && parentId > 0 && (
                        <Badge variant="outline" className="text-[10px] border-amber-600/70 text-amber-700 dark:text-amber-300">
                          RETORNO DA IDA #{String(parentId).padStart(4, "0")}
                        </Badge>
                      )}
                      {hasLinkedReturn && (
                        <Badge variant="outline" className="text-[10px] border-cyan-700/60 text-cyan-700 dark:text-cyan-300">
                          POSSUI RETORNO
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{format(new Date(service.dateTime), 'dd/MM/yyyy', { locale: dateLocale })}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(service.dateTime), 'HH:mm', { locale: dateLocale })}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {formatPassengerNames(service.clientName)}{service.isReturn ? " • Retorno" : ""}
                      </span>
                      {service.isReturn && parentService && (
                        <span className="text-[11px] text-amber-700 dark:text-amber-300">
                          Referência: ida de {format(new Date(parentService.dateTime), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}
                        </span>
                      )}
                      {hasLinkedReturn && (
                        <span className="text-[11px] text-cyan-700 dark:text-cyan-300">
                          Retorno(s): {(linkedReturns || []).map((r: any) => `#${String(r.id).padStart(4, "0")}`).join(", ")}
                        </span>
                      )}
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
                    {service.isReturn ? (
                      <span className="text-xs text-muted-foreground">Incluso na ida</span>
                    ) : (
                      <span className="font-medium">
                        {(finance.valueCents / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>
                        {(finance.expenseCents / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" })}
                      </span>
                      {!service.isReturn && finance.returnExpenses > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          inclui retorno: {(finance.returnExpenses / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" })}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {service.isReturn ? (
                      <span className="text-xs text-muted-foreground">Consolidado na ida</span>
                    ) : (
                      <span className={finance.resultCents < 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                        {(finance.resultCents / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(service.status)}</TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <MoreHorizontal className="w-4 h-4" />
                          {t("common.actions")}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!service.isReturn && (
                          <DropdownMenuItem onClick={() => setLocation(`/services/${service.id}/edit`)}>
                            <Pencil className="w-4 h-4 text-blue-600" /> Editar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => openFinanceDialog(service)}>
                          <DollarSign className="w-4 h-4 text-green-600" /> Despesas
                        </DropdownMenuItem>
                        {!service.isReturn && (
                          <DropdownMenuItem onClick={() => window.open(`/services/${service.id}/voucher`, "_blank")}>
                            PDF Voucher
                          </DropdownMenuItem>
                        )}
                        {!service.isReturn && ((service.statusPagamento || "pending") !== "paid" && (service.statusPagamento || "pending") !== "saldo") && (
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
                        {!service.isReturn && service.statusPagamento === "partial" && service.restanteMetodo === "pay_driver" && service.driverId && (
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
                            <Badge variant="outline">Combustível: {(service.combustivel / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" })}</Badge>
                          )}
                          {(service.pedagio || 0) > 0 && (
                            <Badge variant="outline">Pedágio: {(service.pedagio / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" })}</Badge>
                          )}
                          {(service.estacionamento || 0) > 0 && (
                            <Badge variant="outline">Estacionamento: {(service.estacionamento / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" })}</Badge>
                          )}
                          {(service.alimentacao || 0) > 0 && (
                            <Badge variant="outline">Alimentação: {(service.alimentacao / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" })}</Badge>
                          )}
                          {(service.outrosCustos || 0) > 0 && (
                            <Badge variant="outline">Outros: {(service.outrosCustos / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" })}</Badge>
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
                </React.Fragment>
              )})
            )}
          </TableBody>
        </Table>
        </div>

        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="text-center py-8">{t("services.loading")}</div>
            ) : displayServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{t("services.empty")}</div>
          ) : (
            displayServices.map((service) => {
              const linkedReturns = returnServicesByParent.get(Number(service.id)) || [];
              const hasLinkedReturn = !service.isReturn && linkedReturns.length > 0;
              const parentId = Number(service.parentServiceId || 0);
              const parentService = service.isReturn ? servicesById.get(parentId) : null;
              const finance = getFinancialView(service);
              return (
              <div key={`card-${service.id}`} className={`rounded-lg border bg-card p-3 ${service.isReturn ? "border-l-4 border-l-amber-500 bg-amber-50/70 dark:bg-[#3a2c1c]/45 dark:border-l-amber-500" : ""} ${hasLinkedReturn ? "bg-cyan-50/40 dark:bg-[#1e2f39]/30" : ""}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-muted-foreground">#{String(service.id).padStart(4, "0")}</div>
                    <div className="font-medium">
                      {format(new Date(service.dateTime), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}{service.isReturn ? " • Retorno" : ""}
                    </div>
                    <div className="mt-1">
                      {service.isReturn && parentId > 0 && (
                        <Badge variant="outline" className="text-[10px] border-amber-600/70 text-amber-700 dark:text-amber-300">
                          RETORNO DA IDA #{String(parentId).padStart(4, "0")}
                        </Badge>
                      )}
                      {hasLinkedReturn && (
                        <Badge variant="outline" className="text-[10px] border-cyan-700/60 text-cyan-700 dark:text-cyan-300">
                          POSSUI RETORNO
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1">
                        <MoreHorizontal className="w-4 h-4" />
                        {t("common.actions")}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!service.isReturn && (
                        <DropdownMenuItem onClick={() => setLocation(`/services/${service.id}/edit`)}>
                          <Pencil className="w-4 h-4 text-blue-600" /> Editar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => openFinanceDialog(service)}>
                        <DollarSign className="w-4 h-4 text-green-600" /> Despesas
                      </DropdownMenuItem>
                      {!service.isReturn && (
                        <DropdownMenuItem onClick={() => window.open(`/services/${service.id}/voucher`, "_blank")}>
                          PDF Voucher
                        </DropdownMenuItem>
                      )}
                      {!service.isReturn && ((service.statusPagamento || "pending") !== "paid" && (service.statusPagamento || "pending") !== "saldo") && (
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
                      {!service.isReturn && service.statusPagamento === "partial" && service.restanteMetodo === "pay_driver" && service.driverId && (
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
                  {service.isReturn && parentService && (
                    <div className="text-[11px] text-amber-700 dark:text-amber-300">
                      Referência da ida: #{String(parentService.id).padStart(4, "0")} em {format(new Date(parentService.dateTime), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}
                    </div>
                  )}
                  {hasLinkedReturn && (
                    <div className="text-[11px] text-cyan-700 dark:text-cyan-300">
                      Retorno(s): {(linkedReturns || []).map((r: any) => `#${String(r.id).padStart(4, "0")}`).join(", ")}
                    </div>
                  )}
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
                    {service.isReturn ? (
                      <span className="text-xs text-muted-foreground">Valor incluso na ida</span>
                    ) : (
                      <span className="font-semibold">
                        {(finance.valueCents / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" })}
                      </span>
                    )}
                  </div>
                  <div>{getStatusBadge(service.status)}</div>
                </div>
                <div className="mt-2">
                  {service.isReturn ? (
                    <div className="text-xs text-muted-foreground">
                      Despesas desta corrida são consolidadas no resultado da ida.
                    </div>
                  ) : (
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-muted-foreground">Despesas:</span>{" "}
                        {(finance.expenseCents / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" })}
                      </div>
                      <div className={finance.resultCents < 0 ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                        Resultado: {(finance.resultCents / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )})
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
                  
                  const createdDrivers = new Map<string, number>();
                  const createdVehicles = new Map<string, number>();

                  for (const row of validRows) {
                    try {
                      const payload = { ...row.payload };
                      
                      // Handle Driver creation/link
                      if (payload.driverNameDraft && !payload.driverId) {
                        const nameKey = payload.driverNameDraft.toLowerCase().trim();
                        if (createdDrivers.has(nameKey)) {
                          payload.driverId = createdDrivers.get(nameKey);
                        } else {
                          const matchedDriver = findDriverSmarter(payload.driverNameDraft);
                          if (matchedDriver) {
                            payload.driverId = matchedDriver.id;
                          } else {
                            try {
                              const newDriver = await createDriverMutation.mutateAsync({
                                name: payload.driverNameDraft,
                                phone: "-",
                                type: "freelance",
                                licenseValidity: new Date().toISOString().slice(0, 10),
                              });
                              payload.driverId = newDriver.id;
                              createdDrivers.set(nameKey, newDriver.id);
                            } catch (e) {
                              console.error("Erro ao criar motorista na importação:", e);
                            }
                          }
                        }
                      }

                      // Handle Vehicle creation/link
                      if (payload.vehicleModelDraft && !payload.vehicleId) {
                        const rawVehicle = String(payload.vehicleModelDraft);
                        // Tenta dividir pelo separador " - " (espaço hífen espaço) que separa Modelo da Placa
                        let model = "Importado";
                        let plate = "IMP-" + Math.random().toString(36).substring(7).toUpperCase();

                        if (rawVehicle.includes(" - ")) {
                          const mainParts = rawVehicle.split(" - ");
                          model = mainParts[0].trim();
                          plate = mainParts.slice(1).join(" - ").trim();
                        } else if (rawVehicle.includes("-")) {
                          // Caso não tenha espaços, mas tenha hífen (ex: VIRTUS-SXK-8E23)
                          // Vamos assumir que o modelo é tudo antes do primeiro hífen se houver mais de um, 
                          // ou simplesmente tratar com cautela.
                          const parts = rawVehicle.split("-").map(p => p.trim());
                          if (parts.length > 2) {
                            // Se tem 3 partes (ex: VIRTUS, SXK, 8E23), modelo é a primeira e placa é o resto
                            model = parts[0];
                            plate = parts.slice(1).join("-");
                          } else if (parts.length === 2) {
                            model = parts[0];
                            plate = parts[1];
                          }
                        } else {
                          model = rawVehicle;
                        }
                        
                        const modelKey = model.toLowerCase();
                        const plateKey = plate.replace(/\s/g, "").toUpperCase();

                        if (createdVehicles.has(plateKey)) {
                          payload.vehicleId = createdVehicles.get(plateKey);
                        } else {
                          const matchedVehicle = findVehicleSmarter(model, plate);
                          if (matchedVehicle) {
                            payload.vehicleId = matchedVehicle.id;
                          } else {
                            try {
                              const newVehicle = await createVehicleMutation.mutateAsync({
                                model: model,
                                plate: plate,
                                capacity: payload.passengers || 4,
                                luggageCapacity: payload.passengers || 4,
                                type: "sedan",
                                status: "available",
                              });
                              payload.vehicleId = newVehicle.id;
                              createdVehicles.set(plateKey, newVehicle.id);
                            } catch (e) {
                              console.error("Erro ao criar veículo na importação:", e);
                            }
                          }
                        }
                      }

                      await createMutation.mutateAsync(payload);
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
