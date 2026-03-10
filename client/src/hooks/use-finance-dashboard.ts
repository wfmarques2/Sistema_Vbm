import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

const topExpenseSchema = z.object({
  categoria: z.string(),
  totalCentavos: z.number(),
  tipo: z.string(),
});

const dashboardSchema = z.object({
  receitaMesCentavos: z.number(),
  lucroLiquidoMesCentavos: z.number(),
  custoMedioPorKmCentavos: z.number().nullable(),
  lucroPorKmCentavos: z.number().nullable().optional(),
  margemMediaPorViagem: z.number().nullable(),
  topDespesas: z.array(topExpenseSchema),
  comparacao: z.object({
    receitaDeltaCentavos: z.number(),
    receitaPct: z.number().nullable(),
    lucroDeltaCentavos: z.number(),
    lucroPct: z.number().nullable(),
  }),
  prejuizo: z.boolean(),
});

export function useFinanceDashboard(params?: { start?: string; end?: string; vehicleId?: number; driverId?: number }) {
  return useQuery({
    queryKey: ["/api/financial/dashboard", params],
    queryFn: async () => {
      const url = new URL("/api/financial/dashboard", window.location.origin);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") url.searchParams.append(key, String(value));
        });
      }
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch financial dashboard");
      return dashboardSchema.parse(await res.json());
    },
  });
}
