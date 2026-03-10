import { type Service } from "@shared/schema";

export function calcularCustoTotalViagem(service: Service): number {
  const c = Number(service.combustivel || 0);
  const p = Number(service.pedagio || 0);
  const e = Number(service.estacionamento || 0);
  const a = Number(service.alimentacao || 0);
  const o = Number(service.outrosCustos || 0);
  return c + p + e + a + o;
}

export function calcularLucroViagem(service: Service): { lucroCentavos: number; prejuizo: boolean } {
  const valor = Number(service.valorCobrado || 0);
  const custo = calcularCustoTotalViagem(service);
  const lucro = valor - custo;
  return { lucroCentavos: lucro, prejuizo: lucro < 0 };
}
