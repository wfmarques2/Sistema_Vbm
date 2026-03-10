import { db } from "../db";
import { services, vehicleExpenses, companyExpenses, type Service } from "@shared/schema";
import { eq, and, sql, gte, lt } from "drizzle-orm";
import { calcularCustoTotalViagem, calcularLucroViagem } from "../lib/finance";

export class FinancialService {
  async calcularCustoTotalViagem(service: Service): Promise<number> {
    return calcularCustoTotalViagem(service);
  }

  async calcularLucroViagem(service: Service): Promise<{ lucroCentavos: number; prejuizo: boolean }> {
    return calcularLucroViagem(service);
  }

  async getFinanceByServiceId(serviceId: number): Promise<{
    custoTotalCentavos: number;
    lucroCentavos: number;
    prejuizo: boolean;
  } | undefined> {
    const [s] = await db.select().from(services).where(eq(services.id, serviceId));
    if (!s) return undefined;
    const custo = calcularCustoTotalViagem(s);
    const { lucroCentavos, prejuizo } = calcularLucroViagem(s);
    return { custoTotalCentavos: custo, lucroCentavos, prejuizo };
  }

  async disableVehicleExpense(expenseId: number): Promise<void> {
    await db.update(vehicleExpenses).set({ active: false }).where(eq(vehicleExpenses.id, expenseId));
  }

  async disableCompanyExpense(expenseId: number): Promise<void> {
    await db.update(companyExpenses).set({ active: false }).where(eq(companyExpenses.id, expenseId));
  }

  async listarDespesasVeiculoAtivas(vehicleId: number, periodo?: { inicio: Date; fim: Date }): Promise<typeof vehicleExpenses.$inferSelect[]> {
    const conditions = [
      eq(vehicleExpenses.vehicleId, vehicleId),
      eq(vehicleExpenses.active, true),
    ];
    if (periodo?.inicio && periodo?.fim) {
      conditions.push(gte(vehicleExpenses.ocorridaEm, periodo.inicio));
      conditions.push(lt(vehicleExpenses.ocorridaEm, periodo.fim));
    }
    const rows = await db
      .select()
      .from(vehicleExpenses)
      .where(and(...conditions));
    return rows;
  }
}

export const financialService = new FinancialService();
