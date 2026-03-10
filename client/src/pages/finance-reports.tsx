import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useFinancialReport, useListUnifiedExpenses } from "@/hooks/use-financial";
import { useServices } from "@/hooks/use-services";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateQuickFilters } from "@/components/date-quick-filters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVehicles } from "@/hooks/use-vehicles";
import { useDrivers } from "@/hooks/use-drivers";
import { saveAs } from "file-saver";

export default function FinanceReportsPage() {
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [vehicleId, setVehicleId] = useState<number | "">("");
  const [driverId, setDriverId] = useState<number | "">("");
  const { data: vehicles } = useVehicles();
  const { data: drivers } = useDrivers();

  const enabled = start && end;
  const { data: report, isLoading, isError, refetch } = useFinancialReport({
    start,
    end,
    vehicleId: typeof vehicleId === "number" ? vehicleId : undefined,
    driverId: typeof driverId === "number" ? driverId : undefined,
  });
  const { data: services, isLoading: isLoadingServices, isError: isErrorServices } = useServices(
    start && end ? { start, end } : undefined
  );
  const { data: expenses, isLoading: isLoadingExpenses, isError: isErrorExpenses } = useListUnifiedExpenses({
    start: start || undefined,
    end: end || undefined,
    sortOrder: "desc",
  });

  const exportPdf = async () => {
    const { jsPDF } = await import("jspdf");
    async function loadImageDataUrl(url: string): Promise<string | null> {
      try {
        const res = await fetch(url, { cache: "force-cache" });
        if (!res.ok) return null;
        const blob = await res.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    }
    async function getImageSize(dataUrl: string): Promise<{ w: number; h: number }> {
      return await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 0, h: 0 });
        img.src = dataUrl;
      });
    }
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    const dtStr = new Date().toLocaleString("pt-BR");
    let y = margin;
    let pageNo = 1;
    const fmt = (v: number) => `R$${(v / 100).toFixed(2)}`;
    const receitaTotal = Number(report?.totalValorCobradoCentavos || 0);
    const despesasTotal = Number(report?.totalCustosCentavos || 0) + Number(report?.despesasExtrasCentavos || 0);
    const lucroTotal = Number(report?.lucroBrutoCentavos || 0);
    const receitaServicos = Number(report?.totalReceitasServicosCentavos || 0);
    const receitaExtras = Number(report?.totalReceitasExtrasCentavos || 0);
    const despExtras = Number(report?.despesasExtrasCentavos || 0);
    const col = (r: number, g: number, b: number) => pdf.setTextColor(r, g, b);
    const fill = (r: number, g: number, b: number) => pdf.setFillColor(r, g, b);
    const line = (r: number, g: number, b: number) => pdf.setDrawColor(r, g, b);
    const logoUrl = "/logo-vbm.png";
    const logoDataUrl = await loadImageDataUrl(logoUrl);
    async function drawPageHeader() {
      fill(255, 255, 255);
      line(50, 50, 50);
      if (logoDataUrl) {
        const sz = await getImageSize(logoDataUrl);
        const targetH = 12;
        const ratio = sz.h > 0 ? targetH / sz.h : 1;
        const targetW = Math.min(28, sz.w * ratio);
        pdf.addImage(logoDataUrl, "PNG", margin, y, targetW, targetH, undefined, "FAST");
      }
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.text("Relatório Financeiro", margin + 34, y + 6);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`VBM Transfer Executivo`, margin + 34, y + 11);
      pdf.setLineWidth(0.4);
      pdf.line(margin, y + 14, pageWidth - margin, y + 14);
      y = margin + 20;
      pdf.setFontSize(10);
      pdf.text(`Período: ${start} a ${end}`, margin, y);
      pdf.text(`Gerado em: ${dtStr}`, pageWidth - margin, y, { align: "right" });
      y += 6;
    }
    await drawPageHeader();
    pdf.setFontSize(12);
    fill(245, 245, 245);
    line(200, 200, 200);
    const summaryH = 30;
    pdf.rect(margin, y, contentWidth, summaryH, "F");
    const leftX = margin + 4;
    const rightX = margin + contentWidth / 2 + 2;
    col(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Receita total: ${fmt(receitaTotal)}`, leftX, y + 9);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Despesas: ${fmt(despesasTotal)}`, leftX, y + 16);
    pdf.setFont("helvetica", "bold");
    col(lucroTotal < 0 ? 200 : 0, lucroTotal < 0 ? 0 : 120, 0);
    pdf.text(`Lucro líquido: ${fmt(lucroTotal)}`, leftX, y + 23);
    col(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Receitas de serviços: ${fmt(receitaServicos)}`, rightX, y + 12);
    pdf.text(`Receitas extras: ${fmt(receitaExtras)}`, rightX, y + 18);
    pdf.text(`Despesas extras: ${fmt(despExtras)}`, rightX, y + 24);
    y += summaryH + 6;
    pdf.setFontSize(11);
    const widths = [17, 28, 39, 39, 26, 18, 20];
    const headers = ["Data", "Cliente", "Origem", "Destino", "Motorista", "Valor", "Status"];
    const accX: number[] = [];
    let acc = margin;
    for (let i = 0; i < widths.length; i++) {
      accX.push(acc);
      acc += widths[i];
    }
    const baseRow = 7;
    const drawFooter = () => {
      pdf.setFontSize(9);
      pdf.text(`Página ${pageNo}`, margin, pageHeight - margin / 2);
      pdf.text(dtStr, pageWidth - margin, pageHeight - margin / 2, { align: "right" });
    };
    const drawHeaderRow = () => {
      line(160, 160, 160);
      pdf.setLineWidth(0.25);
      fill(235, 235, 235);
      pdf.rect(margin, y, contentWidth, baseRow, "F");
      for (let i = 1; i < widths.length; i++) {
        pdf.line(accX[i], y, accX[i], y + baseRow);
      }
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      for (let i = 0; i < headers.length; i++) {
        pdf.text(headers[i], accX[i] + 2, y + 5);
      }
      pdf.setFont("helvetica", "normal");
      y += baseRow;
    };
    const ensureSpace = async () => {
      if (y + baseRow > pageHeight - margin) {
        drawFooter();
        pdf.addPage();
        pageNo += 1;
        y = margin;
        await drawPageHeader();
        drawHeaderRow();
      }
    };
    drawHeaderRow();
    const rows = (services || []).map((s: any) => ({
      data: new Date(s.dateTime).toLocaleDateString("pt-BR"),
      cliente: String(s.clientName || "-"),
      origem: String(s.origin || "-"),
      destino: String(s.destination || "-"),
      motorista: String(s.driver?.name || "-"),
      valor: fmt(Number(s.valorCobrado || 0)),
      status: (() => {
        const st = String(s.statusPagamento || "-");
        if (st === "paid") return "Pago";
        if (st === "pending") return "Pendente";
        if (st === "saldo") return "Saldo";
        if (st === "partial") return "Parcial";
        if (st === "overdue") return "Atrasado";
        if (st === "canceled") return "Cancelado";
        if (st === "pay_driver") return "Pagar ao Motorista";
        return st;
      })(),
    }));
    let zebra = false;
    for (const r of rows) {
      await ensureSpace();
      const texts = [
        [r.data],
        pdf.splitTextToSize(r.cliente, widths[1] - 3) as string[],
        pdf.splitTextToSize(r.origem, widths[2] - 3) as string[],
        pdf.splitTextToSize(r.destino, widths[3] - 3) as string[],
        pdf.splitTextToSize(r.motorista, widths[4] - 3) as string[],
        [r.valor],
        [r.status],
      ];
      const maxLines = Math.max(...texts.map(t => Array.isArray(t) ? t.length : 1));
      const rowHeight = Math.max(baseRow, 5 + (maxLines - 1) * 4);
      if (y + rowHeight > pageHeight - margin) {
        drawFooter();
        pdf.addPage();
        pageNo += 1;
        y = margin;
        await drawPageHeader();
        drawHeaderRow();
      }
      if (zebra) {
        fill(250, 250, 250);
        pdf.rect(margin, y, contentWidth, rowHeight, "F");
      }
      line(200, 200, 200);
      pdf.rect(margin, y, contentWidth, rowHeight);
      for (let i = 1; i < widths.length; i++) {
        pdf.line(accX[i], y, accX[i], y + rowHeight);
      }
      pdf.setFontSize(9);
      for (let i = 0; i < texts.length; i++) {
        const lines = texts[i] as string[];
        let yy = y + 5;
        for (const ln of lines) {
          const xPad = i === 5 ? widths[i] - 2 + accX[i] : accX[i] + 2;
          const align = i === 5 ? "right" : "left";
          pdf.text(ln, xPad, yy, { align } as any);
          yy += 4.2;
        }
      }
      y += rowHeight;
      zebra = !zebra;
    }
    drawFooter();
    pdf.save(`relatorio-financeiro_${start}_a_${end}.pdf`);
  };

  const exportExcel = async () => {
    const Excel = await import("exceljs");
    const workbook = new (Excel as any).Workbook();
    const resumo = workbook.addWorksheet("Resumo");
    resumo.columns = [
      { header: "Campo", key: "campo", width: 28 },
      { header: "Valor", key: "valor", width: 22 },
    ];
    resumo.addRow({ campo: "Período", valor: `${start} a ${end}` });
    resumo.addRow({ campo: "Receita total", valor: Number(report?.totalValorCobradoCentavos || 0) / 100 });
    resumo.addRow({
      campo: "Despesas",
      valor: (Number(report?.totalCustosCentavos || 0) + Number(report?.despesasExtrasCentavos || 0)) / 100,
    });
    resumo.addRow({ campo: "Lucro bruto", valor: Number(report?.lucroBrutoCentavos || 0) / 100 });
    resumo.addRow({ campo: "Receitas de serviços", valor: Number(report?.totalReceitasServicosCentavos || 0) / 100 });
    resumo.addRow({ campo: "Receitas extras", valor: Number(report?.totalReceitasExtrasCentavos || 0) / 100 });
    resumo.addRow({ campo: "Despesas extras", valor: Number(report?.despesasExtrasCentavos || 0) / 100 });
    resumo.addRow({
      campo: "Custo médio por km",
      valor: report?.custoMedioPorKmCentavos != null ? report.custoMedioPorKmCentavos / 100 : null,
    });
    resumo.addRow({
      campo: "Preço médio por km",
      valor: report?.precoMedioPorKmCentavos != null ? report.precoMedioPorKmCentavos / 100 : null,
    });
    resumo.addRow({ campo: "Km total", valor: Number(report?.kmTotal || 0) });
    resumo.getColumn("valor").numFmt = '"R$"#,##0.00';
    const servicosWs = workbook.addWorksheet("Serviços");
    servicosWs.columns = [
      { header: "Data/Hora", key: "dataHora", width: 20 },
      { header: "Cliente", key: "cliente", width: 24 },
      { header: "Origem", key: "origem", width: 24 },
      { header: "Destino", key: "destino", width: 24 },
      { header: "Motorista", key: "motorista", width: 22 },
      { header: "Valor Cobrado", key: "valorCobrado", width: 16 },
      { header: "Custos", key: "custos", width: 16 },
      { header: "Lucro Bruto", key: "lucroBruto", width: 16 },
      { header: "Método", key: "metodo", width: 16 },
      { header: "Status", key: "status", width: 18 },
    ];
    (services || []).forEach((s: any) => {
      const custoTotal =
        Number(s.combustivel || 0) +
        Number(s.pedagio || 0) +
        Number(s.estacionamento || 0) +
        Number(s.alimentacao || 0) +
        Number(s.outrosCustos || 0);
      const valorCobrado = Number(s.valorCobrado || 0);
      const lucroBruto = valorCobrado - custoTotal;
      servicosWs.addRow({
        dataHora: new Date(s.dateTime).toLocaleString("pt-BR"),
        cliente: String(s.clientName || "-"),
        origem: String(s.origin || "-"),
        destino: String(s.destination || "-"),
        motorista: String(s.driver?.name || "-"),
        valorCobrado: valorCobrado / 100,
        custos: custoTotal / 100,
        lucroBruto: lucroBruto / 100,
        metodo: paymentLabel(String(s.paymentMethod || "")),
        status: paymentStatusLabel(String(s.statusPagamento || "")),
      });
    });
    servicosWs.getColumn("valorCobrado").numFmt = '"R$"#,##0.00';
    servicosWs.getColumn("custos").numFmt = '"R$"#,##0.00';
    servicosWs.getColumn("lucroBruto").numFmt = '"R$"#,##0.00';
    const despesasWs = workbook.addWorksheet("Despesas");
    despesasWs.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Tipo", key: "tipo", width: 14 },
      { header: "Data", key: "data", width: 20 },
      { header: "Categoria/Descrição", key: "descricao", width: 28 },
      { header: "Centro", key: "centro", width: 22 },
      { header: "Valor", key: "valor", width: 14 },
    ];
    (expenses || []).forEach((r: any) => {
      despesasWs.addRow({
        id: r.id,
        tipo: r.tipo === "vehicle" ? "Veículo" : r.tipo === "company" ? "Empresa" : "Motorista",
        data: new Date(r.ocorridaEm).toLocaleString("pt-BR"),
        descricao: "categoria" in r ? r.categoria : "observacao" in r ? r.observacao || "-" : "-",
        centro:
          "vehicleId" in r && r.vehicleId
            ? `Veículo #${r.vehicleId}`
            : "driverId" in r && r.driverId
            ? `Motorista #${r.driverId}`
            : "serviceId" in r && r.serviceId
            ? `Serviço #${r.serviceId}`
            : "-",
        valor: Number(r.valorCentavos || 0) / 100,
      });
    });
    despesasWs.getColumn("valor").numFmt = '"R$"#,##0.00';
    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `relatorio-financeiro_${start}_a_${end}.xlsx`);
  };

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary">Relatórios Financeiros</h2>
          <p className="text-muted-foreground">Resumo por período com custo médio por km.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={exportPdf} disabled={!enabled || isLoading}>Exportar PDF</Button>
          <Button variant="secondary" onClick={exportExcel} disabled={!enabled || isLoading}>Exportar Excel</Button>
        </div>
      </div>

      <div className="finance-report-area">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DateQuickFilters
            start={start}
            end={end}
            onChange={({ start: s, end: e }) => { setStart(s); setEnd(e); }}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={String(vehicleId)} onValueChange={(v) => setVehicleId(v === "none" ? "" : Number(v))}>
              <SelectTrigger><SelectValue placeholder="Veículo (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {vehicles?.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>{v.model} ({v.plate})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(driverId)} onValueChange={(v) => setDriverId(v === "none" ? "" : Number(v))}>
              <SelectTrigger><SelectValue placeholder="Motorista (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {drivers?.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => enabled && refetch()} disabled={!enabled || isLoading}>
            Gerar
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Resultado</CardTitle>
        </CardHeader>
        <CardContent>
          {!enabled && <div className="text-muted-foreground">Selecione período para gerar relatório.</div>}
          {isLoading && <div className="text-muted-foreground">Carregando...</div>}
          {isError && <div className="text-destructive">Erro ao gerar relatório.</div>}
          {report && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Total Cobrado</div>
                <div className="text-2xl font-semibold">
                  R${(report.totalValorCobradoCentavos / 100).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total de Custos</div>
                <div className="text-2xl font-semibold">
                  R${(report.totalCustosCentavos / 100).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Lucro Bruto</div>
                <div className={`text-2xl font-semibold ${report.lucroBrutoCentavos < 0 ? "text-red-600" : "text-green-600"}`}>
                  R${(report.lucroBrutoCentavos / 100).toFixed(2)}
                </div>
              </div>
            </div>
          )}
          {report && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Receitas de Serviços</div>
                <div className="text-xl">R${((report.totalReceitasServicosCentavos || 0) / 100).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Receitas Extras</div>
                <div className="text-xl">R${((report.totalReceitasExtrasCentavos || 0) / 100).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Despesas Extras</div>
                <div className="text-xl">R${((report.despesasExtrasCentavos || 0) / 100).toFixed(2)}</div>
              </div>
            </div>
          )}
          {services && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-md p-3">
                <div className="text-sm text-muted-foreground mb-2">Por método de pagamento</div>
                {(Object.entries(groupByPaymentMethod(services)) as [string, number][]).map(([m, total]) => (
                  <div key={m} className="flex justify-between">
                    <div>{paymentLabel(m)}</div>
                    <div className="font-semibold">R${(total / 100).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="border rounded-md p-3">
                <div className="text-sm text-muted-foreground mb-2">Por status de pagamento</div>
                {(Object.entries(groupByPaymentStatus(services)) as [string, number][]).map(([s, total]) => (
                  <div key={s} className="flex justify-between">
                    <div>{paymentStatusLabel(s)}</div>
                    <div className="font-semibold">R${(total / 100).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {report && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Custo Médio por Km</div>
                <div className="text-xl">
                  {report.custoMedioPorKmCentavos != null ? `R$${(report.custoMedioPorKmCentavos / 100).toFixed(2)}` : "--"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Preço Médio por Km</div>
                <div className="text-xl">
                  {report.precoMedioPorKmCentavos != null ? `R$${(report.precoMedioPorKmCentavos / 100).toFixed(2)}` : "--"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Km Total</div>
                <div className="text-xl">{report.kmTotal}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Serviços no Período</CardTitle>
        </CardHeader>
        <CardContent>
          {!enabled && <div className="text-muted-foreground">Informe início e fim para listar.</div>}
          {isLoadingServices && <div className="text-muted-foreground">Carregando serviços...</div>}
          {isErrorServices && <div className="text-destructive">Erro ao carregar serviços.</div>}
          {services && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Origem/Destino</TableHead>
                  <TableHead>Valor Cobrado</TableHead>
                  <TableHead>Custos</TableHead>
                  <TableHead>Lucro Bruto</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((s) => {
                  const custoTotal = Number(s.combustivel || 0) + Number(s.pedagio || 0) + Number(s.estacionamento || 0) + Number(s.alimentacao || 0) + Number(s.outrosCustos || 0);
                  const valorCobrado = Number(s.valorCobrado || 0);
                  const lucroBruto = valorCobrado - custoTotal;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{new Date(s.dateTime).toLocaleString()}</TableCell>
                      <TableCell>{s.clientName}</TableCell>
                      <TableCell>{s.origin} → {s.destination}</TableCell>
                      <TableCell>R${(valorCobrado / 100).toFixed(2)}</TableCell>
                      <TableCell>R${(custoTotal / 100).toFixed(2)}</TableCell>
                      <TableCell className={lucroBruto < 0 ? "text-red-600" : "text-green-600"}>R${(lucroBruto / 100).toFixed(2)}</TableCell>
                      <TableCell>{`${paymentLabel(s.paymentMethod)} • ${paymentStatusLabel(s.statusPagamento || "")}`}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Despesas no Período</CardTitle>
        </CardHeader>
        <CardContent>
          {!enabled && <div className="text-muted-foreground">Informe início e fim para listar.</div>}
          {isLoadingExpenses && <div className="text-muted-foreground">Carregando despesas...</div>}
          {isErrorExpenses && <div className="text-destructive">Erro ao carregar despesas.</div>}
          {expenses && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Categoria/Descrição</TableHead>
                  <TableHead>Centro</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((r) => (
                  <TableRow key={`${r.tipo}-${r.id}`}>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.tipo === "vehicle" ? "Veículo" : r.tipo === "company" ? "Empresa" : "Motorista"}</TableCell>
                    <TableCell>{new Date(r.ocorridaEm).toLocaleString()}</TableCell>
                    <TableCell>{"categoria" in r ? r.categoria : "observacao" in r ? (r.observacao || "-") : "-"}</TableCell>
                    <TableCell>
                      {"vehicleId" in r && (r as any).vehicleId ? `Veículo #${(r as any).vehicleId}` :
                        "driverId" in r && (r as any).driverId ? `Motorista #${(r as any).driverId}` :
                        "serviceId" in r && (r as any).serviceId ? `Serviço #${(r as any).serviceId}` : "-"}
                    </TableCell>
                    <TableCell>{(r.valorCentavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
          @page { size: A4; margin: 12mm; }
          body * { visibility: hidden !important; }
          .finance-report-area, .finance-report-area * { visibility: visible !important; }
          .finance-report-area { position: absolute; left: 0; top: 0; right: 0; margin: 0 auto; }
        }
      `}</style>
    </Layout>
  );
}

function paymentLabel(p: string) {
  return p === "pix" ? "PIX" :
    p === "cash" ? "Dinheiro" :
    p === "credit_card" ? "Cartão crédito" :
    p === "debit_card" ? "Cartão débito" : p || "-";
}

function paymentStatusLabel(s: string) {
  return s === "paid" ? "Pago" :
    s === "pending" ? "Pendente" :
    s === "saldo" ? "Saldo" :
    s === "partial" ? "Parcial" :
    s === "pending" ? "Pendente" :
    s === "overdue" ? "Atrasado" :
    s === "canceled" ? "Cancelado" : s || "-";
}

function groupByPaymentMethod(services: any[]) {
  return services.reduce((acc, s) => {
    const m = s.paymentMethod || "-";
    const v = Number(s.valorCobrado || 0);
    acc[m] = (acc[m] || 0) + v;
    return acc;
  }, {} as Record<string, number>);
}

function groupByPaymentStatus(services: any[]) {
  return services.reduce((acc, s) => {
    const st = s.statusPagamento || "pending";
    const v = Number(s.valorCobrado || 0);
    acc[st] = (acc[st] || 0) + v;
    return acc;
  }, {} as Record<string, number>);
}
