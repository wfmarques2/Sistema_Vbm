import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { format } from "date-fns";
import { api } from "@shared/routes";
import vbmLogoUrl from "@assets/vbm-logo-2.png?url";
import privativoIconUrl from "@assets/privativo.png?url";
import executivoIconUrl from "@assets/executivo.png?url";
import paxIconUrl from "@assets/pax_icon.png?url";
import malaIconUrl from "@assets/mala_icon.png?url";
import { ptBR, es } from "date-fns/locale";

const translations = {
  pt: {
    title: "Voucher de Viagem",
    itineraryData: "Dados do itinerário - Serviço",
    itinerary: "Itinerário",
    date: "Data",
    vehicle: "Veículo",
    return: "Retorno",
    driver: "Motorista",
    operator: "Operador",
    notes: "Observação",
    guide: "Guia",
    hour: "Hora",
    osNumber: "Nro OS",
    origin: "Origem",
    destination: "Destino",
    client: "Cliente",
    charge: "Cobrar",
    toInvoice: "A faturar",
    atSight: "À vista",
    phone: "Tel.",
    legend: "Legenda:",
    private: "Privativo",
    executive: "Executivo",
    totalToCollect: "TOTAL A RECOLHER",
    total: "TOTAL",
    observations: "Observações:",
    page: "Página",
    of: "de",
    issuedAt: "Emitido em",
    embarkationOrder: "ORDEM DE EMBARQUE",
    loading: "Carregando...",
  },
  es: {
    title: "Voucher de Viaje",
    itineraryData: "Datos del itinerario - Servicio",
    itinerary: "Itinerario",
    date: "Fecha",
    vehicle: "Vehículo",
    return: "Regreso",
    driver: "Conductor",
    operator: "Operador",
    notes: "Observación",
    guide: "Guía",
    hour: "Hora",
    osNumber: "Nro OS",
    origin: "Origen",
    destination: "Destino",
    client: "Cliente",
    charge: "Cobrar",
    toInvoice: "A facturar",
    atSight: "Al contado",
    phone: "Tel.",
    legend: "Leyenda:",
    private: "Privado",
    executive: "Ejecutivo",
    totalToCollect: "TOTAL A RECOGER",
    total: "TOTAL",
    observations: "Observaciones:",
    page: "Página",
    of: "de",
    issuedAt: "Emitido el",
    embarkationOrder: "ORDEN DE EMBARQUE",
    loading: "Cargando...",
  }
};

type Service = Awaited<ReturnType<typeof fetch>> extends never ? never : any;

function paymentLabel(p?: string) {
  const s = String(p || "").toLowerCase();
  return s === "pix" ? "PIX" :
    s === "cash" ? "Dinheiro" :
    s === "credit_card" ? "Cartão crédito" :
    s === "debit_card" ? "Cartão débito" :
    s === "saldo" ? "Saldo (cliente)" : "—";
}

export default function ServiceVoucherPage() {
  const [, params] = useRoute("/services/:id/voucher");
  const id = Number(params?.id || 0);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<"pt" | "es">("pt");
  
  const t = translations[lang];
  const dateLocale = lang === "pt" ? ptBR : es;
  const search = new URLSearchParams(window.location.search);
  const getOverride = (key: string): number | undefined => {
    const v = search.get(key);
    if (v === null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const qsAdt = getOverride("adt");
  const qsChd = getOverride("chd");
  const qsInf = getOverride("inf");
  const qsSen = getOverride("sen");
  const qsFree = getOverride("free");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(api.services.get.path.replace(":id", String(id)), { credentials: "include" });
        if (!res.ok) throw new Error("Falha ao carregar serviço");
        const data = await res.json();
        if (mounted) setService(data);
      } catch (e: any) {
        if (mounted) setError(e.message || "Erro");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (id) load();
    return () => {
      mounted = false;
    };
  }, [id]);

  const printVoucher = () => window.print();
  const qrData = `${window.location.origin}/services/${id}/voucher`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrData)}`;
  const exportPdf = async () => {
    const area = document.querySelector(".print-area") as HTMLElement | null;
    if (!area) return;
    area.classList.add("pdf-export");
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const rect = area.getBoundingClientRect();
    try {
      const canvas = await html2canvas(area, {
        scale: Math.max(2, Math.ceil(window.devicePixelRatio || 2)),
        backgroundColor: "#ffffff",
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    const pageWidth = pdf.internal.pageSize.getWidth();   // 210 mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
    const margin = 12; // mm (coerente com @page)
    const targetMaxWidth = pageWidth - margin * 2; // 186 mm
    const pxWidth = rect.width;
    const pxHeight = rect.height;
    // converte proporcionalmente mantendo a largura máxima e aspecto
    const pxToMm = (px: number) => (px * 25.4) / 96;
    const elemWidthMm = pxToMm(pxWidth);
    const scale = Math.min(1, targetMaxWidth / elemWidthMm);
    const renderWidthMm = elemWidthMm * scale;
    const renderHeightMm = pxToMm(pxHeight) * scale;
    pdf.addImage(imgData, "JPEG", margin, margin, renderWidthMm, Math.min(renderHeightMm, pageHeight - margin * 2), undefined, "FAST");
    pdf.save(`voucher-${String(id).padStart(6, "0")}.pdf`);
    } finally {
      area.classList.remove("pdf-export");
    }
  };

  // WhatsApp removido a pedido: permanecem apenas imprimir e exportar PDF

  const paxAdt = qsAdt ?? (service?.paxAdt ?? 0);
  const paxChd = qsChd ?? (service?.paxChd ?? 0);
  const paxInf = qsInf ?? (service?.paxInf ?? 0);
  const paxSen = qsSen ?? (service?.paxSen ?? 0);
  const paxFree = qsFree ?? (service?.paxFree ?? 0);
  const totalPax = paxAdt + paxChd + paxInf + paxSen + paxFree;

  return (
    <Layout>
      <div className="max-w-[190mm] mx-auto my-6 bg-white print:bg-white">
          <div className="flex justify-between items-start mb-4 no-print">
          <h2 className="text-2xl font-display font-bold text-primary">{t.title}</h2>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 mr-4 border rounded-md p-1 bg-muted/20">
              <Button 
                variant={lang === "pt" ? "default" : "ghost"} 
                size="sm" 
                className="h-8 px-3"
                onClick={() => setLang("pt")}
              >
                PT
              </Button>
              <Button 
                variant={lang === "es" ? "default" : "ghost"} 
                size="sm" 
                className="h-8 px-3"
                onClick={() => setLang("es")}
              >
                ES
              </Button>
            </div>
            <Button onClick={printVoucher}>Imprimir / Salvar PDF</Button>
              <Button variant="secondary" onClick={exportPdf}>Exportar PDF</Button>
          </div>
        </div>
        {loading ? (
          <div>{t.loading}</div>
        ) : error ? (
          <div className="text-destructive">{error}</div>
        ) : service ? (
          <div className="print-area a4-sheet bg-white text-black p-6 rounded-md shadow print:shadow-none print:border print:border-black">
            <div className="flex items-start gap-4">
              <div className="w-24 h-16 flex items-center justify-center overflow-hidden">
                <img src={vbmLogoUrl} alt="VBM" className="max-w-full max-h-full" style={{ imageRendering: "auto" }} />
              </div>
              <div className="flex-1 leading-tight">
                <div className="font-semibold text-[12px]">VBM Transfer Executivo</div>
                <div className="text-[10px]">CNPJ: 58.474.986/0001-11</div>
                <div className="text-[10px]">CADASTUR: 58.474.986/0001-11</div>
                <div className="text-[10px]">Rua Leonel Pereira Nelito, 715, Sala 02</div>
                <div className="text-[10px]">Cachoeira do Bom Jesus • Florianópolis/SC • 88056-300</div>
                <div className="text-[10px]">Tel: (48) 99141-6808 e (48) 99134-4310</div>
                <div className="text-[10px]">vbm.transfer@gmail.com</div>
              </div>
              <div className="w-40">
                <div className="flex items-start gap-2">
                  <div className="text-right flex-1">
                    <div className="text-xs font-semibold">{t.embarkationOrder}</div>
                    <div className="text-[10px] mt-0.5">{t.itinerary.toUpperCase()}</div>
                    <div className="text-sm font-medium leading-none">{String(service.id).padStart(6, "0")}</div>
                  </div>
                  <img src={qrUrl} alt={`QR Itinerário ${service.id}`} style={{ width: "20mm", height: "20mm" }} />
                </div>
              </div>
            </div>
            <div className="border-b mt-2 mb-3" />

            <div className="mt-4 text-sm">
              <div className="font-semibold">{t.itineraryData}</div>
              <div className="grid grid-cols-3 gap-3 mt-2 border rounded p-3">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-neutral-600">{t.itinerary}</div>
                  <div className="font-medium">{String(service.id).padStart(6, "0")}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] text-neutral-600">{t.date}</div>
                  <div className="font-medium">{format(new Date(service.dateTime), "dd/MM/yyyy HH:mm", { locale: dateLocale })}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] text-neutral-600">{t.vehicle}</div>
                  <div className="font-medium leading-tight">
                    <div>{service.vehicle?.model || "—"}</div>
                    {service.vehicle?.plate ? <div className="text-[10px] text-neutral-700">{service.vehicle.plate}</div> : null}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] text-neutral-600">{t.return}</div>
                  <div className="font-medium">{service.returnDateTime ? format(new Date(service.returnDateTime), "dd/MM/yyyy HH:mm", { locale: dateLocale }) : "—"}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] text-neutral-600">{t.driver}</div>
                  <div className="font-medium">{service.driver?.name || "—"}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] text-neutral-600">{t.operator}</div>
                  <div className="font-medium">VBM - TRANSFER EXECUTIVO</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] text-neutral-600">{t.notes}</div>
                  <div className="font-medium">
                    {(() => {
                      const parts = [service.notes, service.observacaoCustos].map((s: any) => String(s || "").trim()).filter(Boolean);
                      return parts.length ? parts.join(" • ") : "—";
                    })()}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-[11px] text-neutral-600">{t.guide}</div>
                  <div className="font-medium">{service.guide || "—"}</div>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="w-full text-[12px] border rounded-md divide-y voucher-grid">
                <div className="grid grid-cols-[110px_1fr]">
                  <div className="px-2 py-1 border-r text-neutral-600 cell">{t.hour}</div>
                  <div className="px-2 py-1 cell">{format(new Date(service.dateTime), "HH:mm", { locale: dateLocale })}</div>
                </div>
                <div className="grid grid-cols-[110px_1fr]">
                  <div className="px-2 py-1 border-r text-neutral-600 cell">{t.osNumber}</div>
                  <div className="px-2 py-1 cell">{String(service.id).padStart(6, "0")}</div>
                </div>
                <div className="grid grid-cols-[110px_1fr]">
                  <div className="px-2 py-1 border-r text-neutral-600 cell">{t.client}</div>
                  <div className="px-2 py-1 leading-tight cell">
                    {(() => {
                      const parts = String(service.clientName || "")
                        .split("&")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      if (parts.length <= 1) return parts[0] || String(service.clientName || "");
                      if (parts.length === 2) return `${parts[0]} e ${parts[1]}`;
                      return `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
                    })()}
                  </div>
                </div>
                <div className="grid grid-cols-[110px_1fr]">
                  <div className="px-2 py-1 border-r text-neutral-600 cell">{t.origin}</div>
                  <div className="px-2 py-1 leading-tight cell">
                    {(() => {
                      const origin = String(service.origin);
                      const flight = String(service.flight || "").trim();
                      return flight ? `${origin} - Voo: ${flight}` : origin;
                    })()}
                  </div>
                </div>
                <div className="grid grid-cols-[110px_1fr]">
                  <div className="px-2 py-1 border-r text-neutral-600 cell">{t.destination}</div>
                  <div className="px-2 py-1 leading-tight cell">{String(service.destination)}</div>
                </div>
                <div className="grid grid-cols-[110px_1fr]">
                  <div className="px-2 py-1 border-r text-neutral-600 cell">T</div>
                  <div className="px-2 py-1 cell">
                    {service.type === "corporate" ? (
                      <div className="inline-flex items-center gap-2" title={t.executive}>
                        <img src={executivoIconUrl} alt={t.executive} className="w-4 h-4 object-contain border border-neutral-100 rounded bg-neutral-50/50" />
                        <span>{t.executive}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2" title={t.private}>
                        <img src={privativoIconUrl} alt={t.private} className="w-4 h-4 object-contain border border-red-100 rounded bg-red-50/50" />
                        <span>{t.private}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-[110px_1fr]">
                  <div className="px-2 py-1 border-r text-neutral-600 whitespace-nowrap cell">PAX</div>
                  <div className="px-2 py-1 cell">
                    <div className="grid grid-cols-5 gap-x-4 text-[12px]">
                      <div className="whitespace-nowrap">ADT: {paxAdt}</div>
                      <div className="whitespace-nowrap">CHD: {paxChd}</div>
                      <div className="whitespace-nowrap">INF: {paxInf}</div>
                      <div className="whitespace-nowrap">SEN: {paxSen}</div>
                      <div className="whitespace-nowrap">FREE: {paxFree}</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-[110px_1fr]">
                  <div className="px-2 py-1 border-r text-neutral-600 cell">{t.charge}</div>
                  <div className="px-2 py-1 cell">
                    {service.statusPagamento === "paid" ? "Pago" :
                     service.statusPagamento === "pending" ? "Pendente" :
                     service.statusPagamento === "saldo" ? "Saldo" :
                     service.statusPagamento === "partial" ? (() => {
                       const pago = Number(service.valorPagoParcial || 0);
                       const restanteCents = Math.max(0, Number(service.valorCobrado || 0) - pago);
                       const restanteFmt = (restanteCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                       const pagoFmt = (pago / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                       const restoMetodo =
                         service.restanteMetodo === "pay_driver"
                           ? `ao motorista${service.restanteMetodoDriver ? ` (${paymentLabel(service.restanteMetodoDriver)})` : ""}`
                           : service.restanteMetodo === "pix"
                           ? "PIX"
                           : "";
                       return `Parcial • Pago: R$ ${pagoFmt}${restoMetodo ? ` • Restante (${restoMetodo}): R$ ${restanteFmt}` : ""}`;
                     })() :
                     service.statusPagamento === "pay_driver" ? "Pagar ao Motorista" : "—"}
                    {" • Método: "}{paymentLabel(service.formaPagamento || service.paymentMethod)}
                  </div>
                </div>
              </div>
              <div className="text-xs mt-1 flex items-center justify-between gap-4">
                <span className="text-red-600">{t.phone} {service.clientPhone || "-"}</span>
                <div className="inline-flex items-center gap-4">
                  <div className="inline-flex items-center gap-2">
                    <img src={paxIconUrl} alt="PAX" className="w-4 h-4 object-contain border border-neutral-100 rounded bg-neutral-50/50" />
                    <span>Qtde pax: <span className="font-medium">{Number(service.passengers ?? 0) || (Number.isFinite(totalPax) ? totalPax : 0)}</span></span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <img src={malaIconUrl} alt="Malas" className="w-4 h-4 object-contain border border-neutral-100 rounded bg-neutral-50/50" />
                    <span>Malas: <span className="font-medium">{Number(service.bags ?? 0) || 0}</span></span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center text-[12px] mt-2">
                <div className="flex gap-6 items-center">
                  <div className="font-semibold mr-1 text-neutral-600">{t.legend}</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 flex items-center justify-center border border-red-100 rounded bg-red-50/50">
                      <img src={privativoIconUrl} alt={t.private} className="w-3.5 h-3.5 object-contain" />
                    </div>
                    <span>{t.private}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 flex items-center justify-center border border-neutral-100 rounded bg-neutral-50/50">
                      <img src={executivoIconUrl} alt={t.executive} className="w-3.5 h-3.5 object-contain" />
                    </div>
                    <span>{t.executive}</span>
                  </div>
                </div>
                <div className="font-medium flex items-center gap-2">
                  <span className="text-neutral-600">{t.totalToCollect}:</span>
                  {(() => {
                    const toCurrency = (cents: number) =>
                      (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const valorCobradoCents = (() => {
                      const vc = Number(service.valorCobrado || 0);
                      if (vc > 0) return vc;
                      const raw = String(service.value || "0").trim();
                      const num = Number(raw.replace(",", "."));
                      return Math.round((Number.isFinite(num) ? num : 0) * 100);
                    })();
                    let totalCents = 0;
                    if (service.statusPagamento === "pay_driver") {
                      totalCents = valorCobradoCents;
                    } else if (service.statusPagamento === "partial" && service.restanteMetodo === "pay_driver") {
                      const pago = Number(service.valorPagoParcial || 0);
                      totalCents = Math.max(0, valorCobradoCents - pago);
                    }
                    const tag = totalCents > 0 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-100 text-yellow-800">
                        R$ {toCurrency(totalCents)}
                      </span>
                    ) : (
                      <span>R$ {toCurrency(0)}</span>
                    );
                    return tag;
                  })()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[12px] mt-3">
              <div className="border rounded p-3">
                <div className="grid grid-cols-6 gap-2 items-end">
                  <div className="text-center">
                    <div className="text-[11px]">ADT</div>
                    <div className="font-medium text-base">{paxAdt}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[11px]">CHD</div>
                    <div className="font-medium text-base">{paxChd}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[11px]">INF</div>
                    <div className="font-medium text-base">{paxInf}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[11px]">SEN</div>
                    <div className="font-medium text-base">{paxSen}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[11px]">FREE</div>
                    <div className="font-medium text-base">{paxFree}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[11px]">{t.total}</div>
                    <div className="font-semibold text-base">{totalPax}</div>
                  </div>
                </div>
              </div>
            </div>

            

            <div className="mt-6 text-xs flex justify-between">
              <div></div>
              <div>{t.page} 1 {t.of} 1</div>
            </div>
          </div>
        ) : null}
      </div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; }
          @page { size: A4; margin: 12mm; }
          /* Isola somente o voucher para impressão */
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { position: absolute; left: 0; top: 0; right: 0; margin: 0 auto; }
        }
        .a4-sheet { width: 190mm; min-height: 277mm; page-break-inside: avoid; }
        .pdf-export { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
        .pdf-export .voucher-grid { line-height: 1.35; }
        .pdf-export .voucher-grid .cell { padding-top: 6px; padding-bottom: 6px; }
      `}</style>
    </Layout>
  );
}
