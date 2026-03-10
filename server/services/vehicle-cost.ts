import { db } from "../db";
import { services, vehicleExpenses, vehicleKmLogs } from "@shared/schema";
import { and, eq, gte, lt, sql, isNotNull } from "drizzle-orm";

export class VehicleCostService {
  async calcularCustoMedioPorKm(vehicleId: number, periodo: { inicio: Date; fim: Date }): Promise<{
    custoMedioPorKmCentavos: number | null;
    totalDespesasCentavos: number;
    kmTotal: number;
  }> {
    const [{ totalDespesas }] = await db
      .select({ totalDespesas: sql<number>`coalesce(sum(${vehicleExpenses.valorCentavos}), 0)` })
      .from(vehicleExpenses)
      .where(
        and(
          eq(vehicleExpenses.vehicleId, vehicleId),
          eq(vehicleExpenses.active, true),
          gte(vehicleExpenses.ocorridaEm, periodo.inicio),
          lt(vehicleExpenses.ocorridaEm, periodo.fim)
        )
      );

    const [{ kmServicosStr }] = await db
      .select({ kmServicosStr: sql<string>`coalesce(sum(${services.kmReal}), '0')` })
      .from(services)
      .where(
        and(
          eq(services.vehicleId, vehicleId),
          gte(services.dateTime, periodo.inicio),
          lt(services.dateTime, periodo.fim)
        )
      );
    const kmServicos = parseFloat(kmServicosStr || "0");

    const [{ kmLogs }] = await db
      .select({
        kmLogs: sql<number>`coalesce(sum(${vehicleKmLogs.odometroFinal} - ${vehicleKmLogs.odometroInicial}), 0)`,
      })
      .from(vehicleKmLogs)
      .where(
        and(
          eq(vehicleKmLogs.vehicleId, vehicleId),
          gte(vehicleKmLogs.logAt, periodo.inicio),
          lt(vehicleKmLogs.logAt, periodo.fim),
          isNotNull(vehicleKmLogs.odometroInicial),
          isNotNull(vehicleKmLogs.odometroFinal)
        )
      );

    const kmTotal = kmServicos > 0 ? kmServicos : Number(kmLogs || 0);
    const totalDespesasCentavos = Number(totalDespesas || 0);

    if (kmTotal <= 0) {
      return { custoMedioPorKmCentavos: null, totalDespesasCentavos, kmTotal };
    }
    const custoMedio = Math.floor(totalDespesasCentavos / kmTotal);
    return { custoMedioPorKmCentavos: custoMedio, totalDespesasCentavos, kmTotal };
  }
}

export const vehicleCostService = new VehicleCostService();
