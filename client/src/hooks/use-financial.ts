import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

export function buildUrl(path: string, params?: Record<string, any>) {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }
  return url.pathname + url.search;
}

const financialProfitSchema = z.object({
  custoTotalCentavos: z.number(),
  lucroCentavos: z.number(),
  prejuizo: z.boolean(),
});

const financialPeriodReportSchema = z.object({
  periodo: z.object({
    start: z.string(),
    end: z.string(),
  }),
  totalValorCobradoCentavos: z.number(),
  totalCustosCentavos: z.number(),
  lucroBrutoCentavos: z.number(),
  custoMedioPorKmCentavos: z.number().nullable(),
  precoMedioPorKmCentavos: z.number().nullable().optional(),
  kmTotal: z.number(),
  somaDespesasVeiculoCentavos: z.number().optional(),
  somaDespesasGeraisCentavos: z.number().optional(),
  somaPagamentosMotoristasCentavos: z.number().optional(),
  despesasExtrasCentavos: z.number().optional(),
  totalReceitasServicosCentavos: z.number().optional(),
  totalReceitasExtrasCentavos: z.number().optional(),
});

export function useFinanceProfit(serviceId: number) {
  return useQuery({
    queryKey: ["/api/financial/services/:id/profit", serviceId],
    queryFn: async () => {
      const res = await fetch(`/api/financial/services/${serviceId}/profit`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch finance");
      return financialProfitSchema.parse(await res.json());
    },
    enabled: !!serviceId,
  });
}

export function useFinancialReport(params: { start: string; end: string; vehicleId?: number; driverId?: number }) {
  return useQuery({
    queryKey: ["/api/financial/reports/period", params],
    queryFn: async () => {
      const res = await fetch(buildUrl("/api/financial/reports/period", params), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch report");
      return financialPeriodReportSchema.parse(await res.json());
    },
  });
}

const revenueSchema = z.object({
  id: z.number(),
  tipo: z.enum(["service","manual","client_topup"]),
  ocorridaEm: z.string(),
  valorCentavos: z.number(),
  metodoPagamento: z.enum(["pix","cash","credit_card","debit_card","saldo"]).nullable().optional(),
  clientId: z.number().nullable().optional(),
  serviceId: z.number().nullable().optional(),
  descricao: z.string().nullable().optional(),
});
export function useListRevenues(params?: { start?: string; end?: string; clientId?: number; serviceId?: number; limit?: number; offset?: number; sortOrder?: "asc"|"desc" }) {
  return useQuery({
    queryKey: ["/api/financial/revenues", params],
    queryFn: async () => {
      const res = await fetch(buildUrl("/api/financial/revenues", params as any), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to list revenues");
      return z.array(revenueSchema).parse(await res.json());
    },
  });
}
export function useCreateRevenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/financial/revenues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        try {
          const data = await res.json();
          const message = data?.message ? `${res.status}: ${data.message}` : `HTTP ${res.status}`;
          throw new Error(message);
        } catch {
          if (res.status === 401) {
            throw new Error(`401: Unauthorized`);
          }
          throw new Error("Failed to create revenue");
        }
      }
      return revenueSchema.parse(await res.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/financial/revenues"] });
      qc.invalidateQueries({ queryKey: ["/api/clients"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/reports/period"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/dashboard"] });
    },
  });
}
export function useDeleteRevenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/financial/revenues/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) throw new Error("Falha ao excluir receita");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/financial/revenues"] });
      qc.invalidateQueries({ queryKey: ["/api/clients"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/reports/period"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/dashboard"] });
    },
  });
}
const createVehicleExpenseSchema = z.object({
  vehicleId: z.number(),
  serviceId: z.number().optional(),
  categoria: z.string(),
  valorCentavos: z.number(),
  descricao: z.string().optional(),
  ocorridaEm: z.string().optional(),
  statusPagamento: z.enum(["pending","paid","saldo","partial","overdue","canceled","pay_driver"]).optional(),
  pagoEm: z.string().optional(),
  id: z.number(),
  active: z.boolean(),
  createdAt: z.string(),
});

export function useCreateVehicleExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<z.infer<typeof createVehicleExpenseSchema>, "id" | "active" | "createdAt">) => {
      const res = await fetch("/api/financial/vehicle-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create vehicle expense");
      return createVehicleExpenseSchema.parse(await res.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/financial/reports/period"] });
    },
  });
}

const createCompanyExpenseSchema = z.object({
  categoria: z.string(),
  valorCentavos: z.number(),
  descricao: z.string().nullable().optional(),
  pagoPara: z.string().nullable().optional(),
  ocorridaEm: z.string().optional(),
  statusPagamento: z.enum(["pending","paid","saldo","partial","overdue","canceled","pay_driver"]).optional(),
  pagoEm: z.string().nullable().optional(),
  id: z.number(),
  active: z.boolean(),
  createdAt: z.string(),
});

export function useCreateCompanyExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<z.infer<typeof createCompanyExpenseSchema>, "id" | "active" | "createdAt">) => {
      const res = await fetch("/api/financial/company-expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create company expense");
      return createCompanyExpenseSchema.parse(await res.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/financial/expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/company-expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/reports/period"] });
    },
  });
}

const listCompanyExpenseSchema = z.array(createCompanyExpenseSchema);

export function useListCompanyExpenses(params?: { start?: string; end?: string; categoria?: string; pagoPara?: string; active?: boolean; limit?: number; offset?: number; sortBy?: "ocorridaEm"|"categoria"|"valorCentavos"|"createdAt"; sortOrder?: "asc"|"desc" }) {
  return useQuery({
    queryKey: ["/api/financial/company-expenses", params],
    queryFn: async () => {
      const res = await fetch(buildUrl("/api/financial/company-expenses", {
        start: params?.start,
        end: params?.end,
        categoria: params?.categoria,
        pagoPara: params?.pagoPara,
        active: params?.active,
        limit: params?.limit,
        offset: params?.offset,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
      }), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to list company expenses");
      return listCompanyExpenseSchema.parse(await res.json());
    },
  });
}

export function useUpdateCompanyExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<z.infer<typeof createCompanyExpenseSchema>> & { id: number }) => {
      const { id, ...rest } = payload;
      const res = await fetch(`/api/financial/company-expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(rest),
      });
      if (!res.ok) throw new Error("Failed to update company expense");
      return createCompanyExpenseSchema.parse(await res.json());
    },
    onMutate: async (variables) => {
      const all = qc.getQueryCache().findAll({ queryKey: ["/api/financial/expenses"] });
      all.forEach((q) => {
        const key = q.queryKey as any;
        qc.setQueryData(key, (prev: any) => {
          if (Array.isArray(prev)) {
            return prev.map((r) => {
              if (r?.tipo === "company" && r?.id === variables.id) {
                return { ...r, statusPagamento: variables.statusPagamento ?? r.statusPagamento };
              }
              return r;
            });
          }
          return prev;
        });
      });
    },
    onSuccess: (updated) => {
      const all = qc.getQueryCache().findAll({ queryKey: ["/api/financial/expenses"] });
      all.forEach((q) => {
        const key = q.queryKey as any;
        qc.setQueryData(key, (prev: any) => {
          if (Array.isArray(prev)) {
            return prev.map((r) => {
              if (r?.tipo === "company" && r?.id === updated.id) {
                return { ...r, statusPagamento: updated.statusPagamento };
              }
              return r;
            });
          }
          return prev;
        });
      });
      qc.invalidateQueries({ queryKey: ["/api/financial/expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/company-expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/reports/period"] });
    },
  });
}

export function useDisableCompanyExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/financial/company-expenses/${id}/disable`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to disable company expense");
      return createCompanyExpenseSchema.parse(await res.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/financial/company-expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/reports/period"] });
    },
  });
}

const vehicleExpenseSchema = z.object({
  vehicleId: z.number(),
  serviceId: z.number().optional(),
  categoria: z.string(),
  valorCentavos: z.number(),
  descricao: z.string().optional(),
  ocorridaEm: z.string().optional(),
  statusPagamento: z.enum(["pending","paid","saldo","partial","overdue","canceled","pay_driver"]).optional(),
  pagoEm: z.string().nullable().optional(),
  id: z.number(),
  active: z.boolean(),
  createdAt: z.string(),
});
const listVehicleExpenseSchema = z.array(vehicleExpenseSchema);

export function useListVehicleExpenses(params?: { start?: string; end?: string; vehicleId?: number; serviceId?: number; categoria?: string; active?: boolean; limit?: number; offset?: number; sortBy?: "ocorridaEm"|"categoria"|"valorCentavos"|"createdAt"; sortOrder?: "asc"|"desc" }) {
  return useQuery({
    queryKey: ["/api/financial/vehicle-expenses", params],
    queryFn: async () => {
      const res = await fetch(buildUrl("/api/financial/vehicle-expenses", {
        start: params?.start,
        end: params?.end,
        vehicleId: params?.vehicleId,
        serviceId: params?.serviceId,
        categoria: params?.categoria,
        active: params?.active,
        limit: params?.limit,
        offset: params?.offset,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
      }), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to list vehicle expenses");
      return listVehicleExpenseSchema.parse(await res.json());
    },
  });
}

export function useUpdateVehicleExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<z.infer<typeof vehicleExpenseSchema>> & { id: number }) => {
      const { id, ...rest } = payload;
      const res = await fetch(`/api/financial/vehicle-expenses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(rest),
      });
      if (!res.ok) throw new Error("Failed to update vehicle expense");
      return vehicleExpenseSchema.parse(await res.json());
    },
    onMutate: async (variables) => {
      const all = qc.getQueryCache().findAll({ queryKey: ["/api/financial/expenses"] });
      all.forEach((q) => {
        const key = q.queryKey as any;
        qc.setQueryData(key, (prev: any) => {
          if (Array.isArray(prev)) {
            return prev.map((r) => {
              if (r?.tipo === "vehicle" && r?.id === variables.id) {
                return { ...r, statusPagamento: variables.statusPagamento ?? r.statusPagamento };
              }
              return r;
            });
          }
          return prev;
        });
      });
    },
    onSuccess: (updated) => {
      const all = qc.getQueryCache().findAll({ queryKey: ["/api/financial/expenses"] });
      all.forEach((q) => {
        const key = q.queryKey as any;
        qc.setQueryData(key, (prev: any) => {
          if (Array.isArray(prev)) {
            return prev.map((r) => {
              if (r?.tipo === "vehicle" && r?.id === updated.id) {
                return { ...r, statusPagamento: updated.statusPagamento };
              }
              return r;
            });
          }
          return prev;
        });
      });
      qc.invalidateQueries({ queryKey: ["/api/financial/expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/vehicle-expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/reports/period"] });
    },
  });
}

export function useDisableVehicleExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/financial/vehicle-expenses/${id}/disable`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to disable vehicle expense");
      return vehicleExpenseSchema.parse(await res.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/financial/vehicle-expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/reports/period"] });
    },
  });
}

const driverPaymentSchema = z.object({
  driverId: z.number(),
  serviceId: z.number().nullable().optional(),
  valorCentavos: z.number(),
  metodoPagamento: z.enum(["pix","cash","credit_card","debit_card"]).nullable().optional(),
  statusPagamento: z.enum(["pending", "paid", "saldo", "partial", "overdue", "canceled"]).optional(),
  periodoInicio: z.string().nullable().optional(),
  periodoFim: z.string().nullable().optional(),
  pagoEm: z.string().nullable().optional(),
  observacao: z.string().nullable().optional(),
  id: z.number(),
  createdAt: z.string(),
});
const listDriverPaymentSchema = z.array(driverPaymentSchema);

export function useCreateDriverPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<z.infer<typeof driverPaymentSchema>, "id" | "createdAt">) => {
      const res = await fetch("/api/financial/driver-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create driver payment");
      return driverPaymentSchema.parse(await res.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/financial/driver-payments"] });
    },
  });
}

export function useListDriverPayments(params?: { start?: string; end?: string; driverId?: number; serviceId?: number; statusPagamento?: "pending"|"paid"|"saldo"|"partial"|"overdue"|"canceled"|"pay_driver"; limit?: number; offset?: number; sortBy?: "pagoEm"|"valorCentavos"|"createdAt"; sortOrder?: "asc"|"desc" }) {
  return useQuery({
    queryKey: ["/api/financial/driver-payments", params],
    queryFn: async () => {
      const res = await fetch(buildUrl("/api/financial/driver-payments", params), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to list driver payments");
      return listDriverPaymentSchema.parse(await res.json());
    },
  });
}
export function useDeleteDriverPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/financial/driver-payments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete driver payment");
      return { id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/financial/driver-payments"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/reports/period"] });
    },
  });
}
export function useUpdateDriverPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<z.infer<typeof driverPaymentSchema>> & { id: number }) => {
      const { id, ...rest } = payload;
      const res = await fetch(`/api/financial/driver-payments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(rest),
      });
      if (!res.ok) throw new Error("Failed to update driver payment");
      return driverPaymentSchema.parse(await res.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/financial/driver-payments"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/reports/period"] });
    },
  });
}

const unifiedExpenseSchema = z.discriminatedUnion("tipo", [
  z.object({
    id: z.number(),
    tipo: z.literal("vehicle"),
    ocorridaEm: z.string(),
    categoria: z.string(),
    valorCentavos: z.number(),
    descricao: z.string().nullable().optional(),
    vehicleId: z.number(),
    serviceId: z.number().nullable().optional(),
  statusPagamento: z.enum(["pending","paid","saldo","partial","overdue","canceled","pay_driver"]).nullable().optional(),
    active: z.boolean(),
  }),
  z.object({
    id: z.number(),
    tipo: z.literal("company"),
    ocorridaEm: z.string(),
    categoria: z.string(),
    valorCentavos: z.number(),
    descricao: z.string().nullable().optional(),
    pagoPara: z.string().nullable().optional(),
  statusPagamento: z.enum(["pending","paid","saldo","partial","overdue","canceled","pay_driver"]).nullable().optional(),
    active: z.boolean(),
  }),
  z.object({
    id: z.number(),
    tipo: z.literal("driver_payment"),
    ocorridaEm: z.string(),
    valorCentavos: z.number(),
    driverId: z.number(),
    serviceId: z.number().nullable().optional(),
  statusPagamento: z.enum(["pending","paid","saldo","partial","overdue","canceled","pay_driver"]).nullable().optional(),
  metodoPagamento: z.enum(["pix","cash","credit_card","debit_card"]).nullable().optional(),
    observacao: z.string().nullable().optional(),
  }),
  z.object({
    id: z.number(),
    tipo: z.literal("service"),
    ocorridaEm: z.string(),
    categoria: z.string(),
    valorCentavos: z.number(),
    serviceId: z.number(),
  }),
]);

export function useListUnifiedExpenses(params?: { start?: string; end?: string; vehicleId?: number; driverId?: number; serviceId?: number; categoria?: string; tipo?: "vehicle"|"company"|"driver_payment"|"service"; statusPagamento?: "pending"|"paid"|"saldo"|"partial"|"overdue"|"canceled"|"pay_driver"; active?: boolean; limit?: number; offset?: number; sortOrder?: "asc"|"desc" }) {
  return useQuery({
    queryKey: ["/api/financial/expenses", params],
    queryFn: async () => {
      const res = await fetch(buildUrl("/api/financial/expenses", {
        start: params?.start,
        end: params?.end,
        vehicleId: params?.vehicleId,
        driverId: params?.driverId,
        serviceId: params?.serviceId,
        categoria: params?.categoria,
        tipo: params?.tipo,
        statusPagamento: params?.statusPagamento,
        active: typeof params?.active === "boolean" ? String(params?.active) : undefined,
        limit: params?.limit,
        offset: params?.offset,
        sortOrder: params?.sortOrder,
      }), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to list unified expenses");
      return z.array(unifiedExpenseSchema).parse(await res.json());
    },
  });
}

export function useCreateUnifiedExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/financial/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create unified expense");
      return unifiedExpenseSchema.parse(await res.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/financial/expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/company-expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/vehicle-expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/driver-payments"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/reports/period"] });
    },
  });
}
export function useDeleteUnifiedExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { tipo: "vehicle"|"company"|"driver_payment"; id: number }) => {
      if (input.tipo === "vehicle") {
        const res = await fetch(`/api/financial/vehicle-expenses/${input.id}/disable`, { method: "POST", credentials: "include" });
        if (!res.ok) throw new Error("Failed to disable vehicle expense");
        return { tipo: input.tipo, id: input.id };
      }
      if (input.tipo === "company") {
        const res = await fetch(`/api/financial/company-expenses/${input.id}/disable`, { method: "POST", credentials: "include" });
        if (!res.ok) throw new Error("Failed to disable company expense");
        return { tipo: input.tipo, id: input.id };
      }
      if (input.tipo === "driver_payment") {
        const res = await fetch(`/api/financial/driver-payments/${input.id}`, { method: "DELETE", credentials: "include" });
        if (!res.ok && res.status !== 204) throw new Error("Failed to delete driver payment");
        return { tipo: input.tipo, id: input.id };
      }
      throw new Error("Tipo não suportado para exclusão");
    },
    onSuccess: (_data, variables) => {
      const all = qc.getQueryCache().findAll({ queryKey: ["/api/financial/expenses"] });
      all.forEach((q) => {
        const key = q.queryKey as any;
        qc.setQueryData(key, (prev: any) => {
          if (Array.isArray(prev)) {
            return prev.filter((r) => !(r?.tipo === variables.tipo && r?.id === variables.id));
          }
          return prev;
        });
      });
      qc.invalidateQueries({ queryKey: ["/api/financial/expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/company-expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/vehicle-expenses"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/driver-payments"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/reports/period"] });
    },
  });
}
const kmLogSchema = z.object({
  vehicleId: z.number(),
  driverId: z.number().optional(),
  serviceId: z.number().optional(),
  logAt: z.string().optional(),
  odometroInicial: z.number().optional(),
  odometroFinal: z.number().optional(),
  observacao: z.string().optional(),
  id: z.number(),
  createdAt: z.string(),
});
const listKmLogSchema = z.array(kmLogSchema);

export function useCreateKmLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<z.infer<typeof kmLogSchema>, "id" | "createdAt">) => {
      const res = await fetch("/api/financial/vehicle-km-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create km log");
      return kmLogSchema.parse(await res.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/financial/vehicle-km-logs"] });
    },
  });
}

export function useListKmLogs(params?: { start?: string; end?: string; vehicleId?: number; driverId?: number; serviceId?: number; limit?: number; offset?: number; sortOrder?: "asc"|"desc" }) {
  return useQuery({
    queryKey: ["/api/financial/vehicle-km-logs", params],
    queryFn: async () => {
      const res = await fetch(buildUrl("/api/financial/vehicle-km-logs", params), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to list km logs");
      return listKmLogSchema.parse(await res.json());
    },
  });
}
const updateServiceExpensesSchema = z.object({
  service: z.any(),
  finance: financialProfitSchema.nullable(),
});

export function useUpdateServiceExpenses(serviceId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      kmPrevisto?: number | string;
      kmReal?: number | string;
      combustivel?: number;
      pedagio?: number;
      estacionamento?: number;
      alimentacao?: number;
      outrosCustos?: number;
      observacaoCustos?: string;
    }) => {
      const res = await fetch(`/api/services/${serviceId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update service expenses");
      return updateServiceExpensesSchema.parse(await res.json());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/services"] });
      qc.invalidateQueries({ queryKey: ["/api/financial/services/:id/profit", serviceId] });
    },
  });
}
