import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useFinanceProfit } from "@/hooks/use-financial";
import { useRoute } from "wouter";

export default function FinanceServiceDetailPage() {
  const [match, params] = useRoute("/finance/services/:id");
  const id = params?.id ? Number(params.id) : 0;
  const { data: finance, isLoading, isError } = useFinanceProfit(id);

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Detalhe Financeiro da Viagem</h2>
          <p className="text-muted-foreground">Resumo financeiro com indicador de prejuízo.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Viagem #{id}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="text-muted-foreground">Carregando...</div>}
          {isError && <div className="text-destructive">Erro ao carregar dados financeiros.</div>}
          {finance && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Custo Total</div>
                <div className="text-2xl font-semibold">
                  R${(finance.custoTotalCentavos / 100).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Lucro Bruto</div>
                <div className={`text-2xl font-semibold ${finance.prejuizo ? "text-red-600" : "text-green-600"}`}>
                  R${(finance.lucroCentavos / 100).toFixed(2)}
                </div>
              </div>
              <div className="flex items-end">
                {finance.prejuizo ? (
                  <Badge variant="destructive">Prejuízo</Badge>
                ) : (
                  <Badge variant="outline">Lucro</Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
