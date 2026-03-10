import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCreateVehicleExpense, useCreateCompanyExpense, useUpdateServiceExpenses } from "@/hooks/use-financial";

export default function FinanceExpensesCreatePage() {
  const [vehicleId, setVehicleId] = useState<number | "">("");
  const [serviceId, setServiceId] = useState<number | "">("");
  const [categoria, setCategoria] = useState("");
  const [valorDisplay, setValorDisplay] = useState<string>("R$ 0,00");
  const [descricao, setDescricao] = useState("");
  const [ocorridaEm, setOcorridaEm] = useState<string>("");
  const [pagoPara, setPagoPara] = useState<string>("");

  const vehicleExpense = useCreateVehicleExpense();
  const companyExpense = useCreateCompanyExpense();
  const [serviceExpenseServiceId, setServiceExpenseServiceId] = useState<number | "">("");
  const [combDisplay, setCombDisplay] = useState<string>("R$ 0,00");
  const [pedDisplay, setPedDisplay] = useState<string>("R$ 0,00");
  const [estacDisplay, setEstacDisplay] = useState<string>("R$ 0,00");
  const [alimDisplay, setAlimDisplay] = useState<string>("R$ 0,00");
  const [outrosDisplay, setOutrosDisplay] = useState<string>("R$ 0,00");
  const serviceExpenses = useUpdateServiceExpenses(typeof serviceExpenseServiceId === "number" ? serviceExpenseServiceId : 0);

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-primary">Cadastro de Despesas</h2>
        <p className="text-muted-foreground">Registre despesas de viagem, veículo e gerais.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Despesas de Veículo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Vehicle ID" value={vehicleId} onChange={(e) => setVehicleId(Number(e.target.value) || "")} />
            <Input placeholder="Service ID (opcional)" value={serviceId} onChange={(e) => setServiceId(Number(e.target.value) || "")} />
            <Input placeholder="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
            <Input
              placeholder="Valor"
              type="text"
              value={valorDisplay}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                const cents = digits ? parseInt(digits, 10) : 0;
                const amount = cents / 100;
                setValorDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
              }}
            />
            <Input placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            <Input type="datetime-local" placeholder="Ocorrida em" value={ocorridaEm} onChange={(e) => setOcorridaEm(e.target.value)} />
            <Button
              onClick={() =>
                typeof vehicleId === "number" &&
                vehicleExpense.mutate({
                  vehicleId,
                  serviceId: typeof serviceId === "number" ? serviceId : undefined,
                  categoria,
                  valorCentavos: (() => {
                    const digits = valorDisplay.replace(/\D/g, "");
                    return digits ? parseInt(digits, 10) : 0;
                  })(),
                  descricao,
                  ocorridaEm,
                })
              }
              disabled={vehicleExpense.isPending}
            >
              Salvar
            </Button>
            {vehicleExpense.isError && <div className="text-destructive text-sm">Erro ao salvar despesa de veículo.</div>}
            {vehicleExpense.isSuccess && <div className="text-green-600 text-sm">Despesa de veículo cadastrada.</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
            <Input
              placeholder="Valor"
              type="text"
              value={valorDisplay}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                const cents = digits ? parseInt(digits, 10) : 0;
                const amount = cents / 100;
                setValorDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
              }}
            />
            <Input placeholder="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            <Input placeholder="Pago para" value={pagoPara} onChange={(e) => setPagoPara(e.target.value)} />
            <Input type="datetime-local" placeholder="Ocorrida em" value={ocorridaEm} onChange={(e) => setOcorridaEm(e.target.value)} />
            <Button
              onClick={() =>
                companyExpense.mutate({
                  categoria,
                  valorCentavos: (() => {
                    const digits = valorDisplay.replace(/\D/g, "");
                    return digits ? parseInt(digits, 10) : 0;
                  })(),
                  descricao,
                  ocorridaEm,
                  pagoPara,
                })
              }
              disabled={companyExpense.isPending}
            >
              Salvar
            </Button>
            {companyExpense.isError && <div className="text-destructive text-sm">Erro ao salvar despesa geral.</div>}
            {companyExpense.isSuccess && <div className="text-green-600 text-sm">Despesa geral cadastrada.</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas de Viagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Service ID" value={serviceExpenseServiceId} onChange={(e) => setServiceExpenseServiceId(Number(e.target.value) || "")} />
            <Input placeholder="KM Previsto" type="text" onBlur={(e) => {
              const v = e.target.value.replace(",", ".");
              if (typeof serviceExpenseServiceId === "number" && v) {
                serviceExpenses.mutate({ kmPrevisto: Number(v) });
              }
            }} />
            <Input placeholder="KM Real" type="text" onBlur={(e) => {
              const v = e.target.value.replace(",", ".");
              if (typeof serviceExpenseServiceId === "number" && v) {
                serviceExpenses.mutate({ kmReal: Number(v) });
              }
            }} />
            <Input
              placeholder="Combustível"
              type="text"
              value={combDisplay}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                const cents = digits ? parseInt(digits, 10) : 0;
                const amount = cents / 100;
                setCombDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
              }}
            />
            <Input
              placeholder="Pedágio"
              type="text"
              value={pedDisplay}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                const cents = digits ? parseInt(digits, 10) : 0;
                const amount = cents / 100;
                setPedDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
              }}
            />
            <Input
              placeholder="Estacionamento"
              type="text"
              value={estacDisplay}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                const cents = digits ? parseInt(digits, 10) : 0;
                const amount = cents / 100;
                setEstacDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
              }}
            />
            <Input
              placeholder="Alimentação"
              type="text"
              value={alimDisplay}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                const cents = digits ? parseInt(digits, 10) : 0;
                const amount = cents / 100;
                setAlimDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
              }}
            />
            <Input
              placeholder="Outros"
              type="text"
              value={outrosDisplay}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                const cents = digits ? parseInt(digits, 10) : 0;
                const amount = cents / 100;
                setOutrosDisplay(amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));
              }}
            />
            <Button
              onClick={() =>
                typeof serviceExpenseServiceId === "number" &&
                serviceExpenses.mutate({
                  combustivel: (() => { const d = combDisplay.replace(/\D/g, ""); return d ? parseInt(d, 10) : undefined; })(),
                  pedagio: (() => { const d = pedDisplay.replace(/\D/g, ""); return d ? parseInt(d, 10) : undefined; })(),
                  estacionamento: (() => { const d = estacDisplay.replace(/\D/g, ""); return d ? parseInt(d, 10) : undefined; })(),
                  alimentacao: (() => { const d = alimDisplay.replace(/\D/g, ""); return d ? parseInt(d, 10) : undefined; })(),
                  outrosCustos: (() => { const d = outrosDisplay.replace(/\D/g, ""); return d ? parseInt(d, 10) : undefined; })(),
                })
              }
              disabled={serviceExpenses.isPending}
            >
              Salvar
            </Button>
            {serviceExpenses.isError && <div className="text-destructive text-sm">Erro ao salvar despesas da viagem.</div>}
            {serviceExpenses.isSuccess && <div className="text-green-600 text-sm">Despesas da viagem atualizadas.</div>}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
