import { Layout } from "@/components/layout";
import { useServices } from "@/hooks/use-services";
import { format, isSameDay, isSameMonth, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { es, ptBR } from "date-fns/locale";
import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Clock, MapPin, ChevronLeft as BackIcon, CircleAlert, CheckCircle2 } from "lucide-react";
import { SiWaze, SiGooglemaps, SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useUpdateService } from "@/hooks/use-services";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n";

type AgendaServiceItem = {
  key: string;
  serviceId: number;
  kind: "return" | "outbound";
  dateTime: string | Date;
  origin: string;
  destination: string;
  driverName: string;
  type: string;
  clientName: string;
  status: string;
  clientPhone?: string | null;
};

export default function AgendaPage() {
  const { language, t } = useI18n();
  const numberLocale = language === "es" ? "es-ES" : "pt-BR";
  const dateLocale = language === "es" ? es : ptBR;
  const STOP_PROGRESS_STORAGE_KEY = "vbm_agenda_stop_progress";
  const [stopProgressByService, setStopProgressByService] = useState<Record<number, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(STOP_PROGRESS_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return {};
      return parsed as Record<number, number>;
    } catch {
      return {};
    }
  });

  const persistStopProgress = (next: Record<number, number>) => {
    setStopProgressByService(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STOP_PROGRESS_STORAGE_KEY, JSON.stringify(next));
    }
  };

  const setServiceStopProgress = (serviceId: number, progress: number) => {
    const normalized = Math.max(0, Math.floor(progress));
    const next = { ...stopProgressByService, [serviceId]: normalized };
    persistStopProgress(next);
  };

  const clearServiceStopProgress = (serviceId: number) => {
    if (!(serviceId in stopProgressByService)) return;
    const next = { ...stopProgressByService };
    delete next[serviceId];
    persistStopProgress(next);
  };
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: services, isLoading } = useServices(
    user?.role === "driver" && (user as any)?.driverId
      ? { driverId: String((user as any).driverId) }
      : undefined
  );

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const agendaServices = useMemo<AgendaServiceItem[]>(() => {
    const base = services || [];
    return base.map((service: any) => ({
      key: `service-${service.id}`,
      serviceId: service.id as number,
      kind: service.isReturn ? ("return" as const) : ("outbound" as const),
      dateTime: service.dateTime,
      origin: service.origin,
      destination: service.destination,
      driverName: service.driver?.name || "Não atribuído",
      type: service.type,
      clientName: service.clientName,
      status: service.status,
      clientPhone: service.clientPhone,
    }));
  }, [services]);

  const todaysServices = agendaServices
    .filter((s: AgendaServiceItem) => isSameDay(new Date(s.dateTime), selectedDate))
    .sort((a: AgendaServiceItem, b: AgendaServiceItem) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const [openServiceId, setOpenServiceId] = useState<string | null>(null);
  const [completionFxServiceId, setCompletionFxServiceId] = useState<number | null>(null);
  const updateMutation = useUpdateService();
  const [savingCosts, setSavingCosts] = useState(false);
  const [costs, setCosts] = useState<any>({
    kmReal: "",
    combustivel: "R$ 0,00",
    pedagio: "R$ 0,00",
    estacionamento: "R$ 0,00",
    alimentacao: "R$ 0,00",
    outrosCustos: "R$ 0,00",
    observacaoCustos: "",
  });

  function toBRL(cents: number | null | undefined): string {
    const value = typeof cents === "number" ? cents : 0;
    const reais = value / 100;
    return reais.toLocaleString(numberLocale, { style: "currency", currency: "BRL" });
  }

  function parseBRLToCents(input: string): number {
    if (!input) return 0;
    const digits = String(input).replace(/[^\d]/g, "");
    if (digits.length === 0) return 0;
    const cents = parseInt(digits, 10);
    return isNaN(cents) ? 0 : cents;
  }

  function formatInputBRL(raw: string): string {
    const cents = parseBRLToCents(raw);
    return toBRL(cents);
  }

  function buildWhatsappUrl(phone?: string | null): string | null {
    const raw = String(phone || "").trim();
    if (!raw) return null;

    const isInternational = raw.startsWith("+");
    const digits = raw.replace(/\D/g, "");
    if (!digits) return null;

    // Regra solicitada:
    // - Com "+" => internacional, mantém DDI informado.
    // - Sem "+" => nacional, força DDI do Brasil.
    let normalized = digits;
    if (!isInternational) {
      const national = digits.replace(/^0+/, "");
      normalized = national.startsWith("55") ? national : `55${national}`;
    }

    if (normalized.length < 8 || normalized.length > 15) return null;
    return `https://wa.me/${normalized}`;
  }

  function paymentMethodLabel(method?: string | null): string {
    const m = String(method || "").toLowerCase();
    return m === "pix" ? "PIX" :
      m === "cash" ? "Dinheiro" :
      m === "credit_card" ? "Cartão crédito" :
      m === "debit_card" ? "Cartão débito" :
      m === "mozio" ? "MOZIO" :
      m === "saldo" ? "Saldo" :
      m ? m : "-";
  }

  function wazeWebUrl(address: string): string {
    return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
  }

  function buildFlightSearchUrl(flight?: string | null): string | null {
    const code = String(flight || "").replace(/\s+/g, "").toUpperCase();
    if (!code) return null;
    return `https://www.google.com/search?q=${encodeURIComponent(`voo ${code}`)}`;
  }

  async function adjustTripDateTime(
    serviceId: number,
    currentDateTime?: string | Date | null,
    delayMinutes?: number
  ) {
    const base = currentDateTime ? new Date(currentDateTime) : new Date();
    if (isNaN(base.getTime())) return;
    if (typeof delayMinutes === "number") {
      const delayed = new Date(base.getTime() + delayMinutes * 60_000);
      await updateMutation.mutateAsync({ id: serviceId, dateTime: delayed });
      toast({
        title: "Horário atualizado",
        description: `Viagem ajustada com +${delayMinutes} min.`,
      });
      return;
    }
    const initial = isNaN(base.getTime()) ? "" : format(base, "yyyy-MM-dd'T'HH:mm");
    const nextValue = window.prompt(
      "Informe a nova data/hora no formato AAAA-MM-DDTHH:mm",
      initial
    );
    if (nextValue == null) return;
    const parsed = new Date(nextValue);
    if (isNaN(parsed.getTime())) {
      toast({
        title: "Data/Hora inválida",
        description: "Use o formato AAAA-MM-DDTHH:mm (ex.: 2026-04-20T14:30).",
        variant: "destructive",
      });
      return;
    }
    await updateMutation.mutateAsync({ id: serviceId, dateTime: parsed });
    toast({
      title: "Horário atualizado",
      description: "A hora da viagem foi ajustada com sucesso.",
    });
  }

  function openWaze(address: string) {
    const appUrl = `waze://?q=${encodeURIComponent(address)}&navigate=yes`;
    const webUrl = wazeWebUrl(address);
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) {
      window.open(webUrl, "_blank", "noopener,noreferrer");
      return;
    }
    const startedAt = Date.now();
    window.location.href = appUrl;
    window.setTimeout(() => {
      if (Date.now() - startedAt < 1700) {
        window.open(webUrl, "_blank", "noopener,noreferrer");
      }
    }, 1200);
  }

  function initCostsFromService(s: any | undefined) {
    if (!s) return;
    setCosts({
      kmReal: s.kmReal ?? "",
      combustivel: toBRL(s.combustivel ?? 0),
      pedagio: toBRL(s.pedagio ?? 0),
      estacionamento: toBRL(s.estacionamento ?? 0),
      alimentacao: toBRL(s.alimentacao ?? 0),
      outrosCustos: toBRL(s.outrosCustos ?? 0),
      observacaoCustos: s.observacaoCustos ?? "",
    });
  }

  async function saveCosts(serviceId: number) {
    try {
      setSavingCosts(true);
      const res = await fetch(`/api/services/${serviceId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...costs,
          kmReal: costs.kmReal === "" ? undefined : costs.kmReal,
          combustivel: parseBRLToCents(costs.combustivel),
          pedagio: parseBRLToCents(costs.pedagio),
          estacionamento: parseBRLToCents(costs.estacionamento),
          alimentacao: parseBRLToCents(costs.alimentacao),
          outrosCustos: parseBRLToCents(costs.outrosCustos),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast({
          title: "Erro ao salvar despesas",
          description: body?.message || "Verifique os dados e tente novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Despesas salvas",
          description: "As alterações foram registradas com sucesso.",
        });
      }
    } finally {
      setSavingCosts(false);
    }
  }

  const typeLabel = (t: string) =>
    t === "airport" ? "Aeroporto" :
    t === "corporate" ? "Corporativo" :
    t === "city_tour" ? "Passeio na cidade" :
    t === "hourly" ? "Por hora" : t;

  const statusLabel = (s: string) =>
    s === "scheduled" ? "Agendado" :
    s === "driving_pickup" ? "Direção embarque" :
    s === "pickup_location" ? "Local embarque" :
    s === "driving_destination" ? "Direção destino" :
    s === "in_progress" ? "Direção destino" :
    s === "finished" ? "Finalizado" :
    s === "canceled" ? "Cancelado" : s;

  const driverActionStatus = (status: string, nextStatus: string | null) =>
    status === "scheduled" && nextStatus === "driving_pickup" ? "Aguardando inicio da viagem." :
    status === "driving_pickup" && nextStatus === "pickup_location" ? "Dirigindo até o local de embarque." :
    status === "pickup_location" && nextStatus === "driving_destination" ? "Motorista chegou ao local de embarque." :
    (status === "driving_destination" || status === "in_progress") && nextStatus === "finished" ? "Motorista chegou ao local de embarque." :
    status === "finished" && !nextStatus ? "Motorista finalizou a viagem." :
    "Aguardando atualização do status.";

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-display font-bold text-primary">{t("agenda.title")}</h2>
        <p className="text-muted-foreground">{t("agenda.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addMonths(selectedDate, -1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium">{format(selectedDate, 'MMMM yyyy', { locale: dateLocale })}</span>
                <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addMonths(selectedDate, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {['D','S','T','Q','Q','S','S'].map(d => <div key={d} className="text-muted-foreground py-2">{d}</div>)}
                {gridDays.map((day) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const hasEvents = agendaServices.some((s: AgendaServiceItem) => isSameDay(new Date(s.dateTime), day));
                  const inMonth = isSameMonth(day, monthStart);
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        py-2 rounded-full relative hover:bg-secondary transition-colors
                        ${!inMonth ? "text-muted-foreground/50" : ""}
                        ${isSelected ? "bg-primary text-primary-foreground hover:bg-primary" : ""}
                      `}
                    >
                      {format(day, 'd')}
                      {hasEvents && !isSelected && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
            <h3 className="font-semibold text-primary mb-2">{t("agenda.summary")}</h3>
            <p className="text-sm text-muted-foreground">
              Você tem <span className="font-bold text-primary">{todaysServices.length}</span> serviços para {format(selectedDate, 'dd MMM', { locale: dateLocale })}.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h3 className="text-xl font-semibold mb-4">{format(selectedDate, 'EEEE, dd MMMM', { locale: dateLocale })}</h3>
          
          <div className="space-y-4">
            {isLoading ? (
              <p>{t("agenda.loading")}</p>
            ) : todaysServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-card rounded-xl border border-dashed border-border text-muted-foreground">
                <Clock className="w-12 h-12 mb-4 opacity-20" />
                <p>{t("agenda.empty")}</p>
              </div>
            ) : (
              todaysServices.map((service: AgendaServiceItem) => (
                <div 
                  key={service.key}
                  className="bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow flex gap-4 cursor-pointer"
                  onClick={() => setOpenServiceId(service.key)}
                >
                  <div className="flex flex-col items-center justify-center w-16 bg-secondary rounded-lg">
                    <span className="text-sm font-bold text-primary">{format(new Date(service.dateTime), 'HH:mm', { locale: dateLocale })}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-primary">{service.clientName}</h4>
                        <p className="text-xs text-muted-foreground">
                          {typeLabel(service.type)}{service.kind === "return" ? " • Retorno" : ""}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        service.kind === "return"
                          ? "bg-cyan-100 text-cyan-700"
                          : service.status === 'finished' ? 'bg-green-100 text-green-700' :
                            service.status === 'driving_pickup' ? 'bg-yellow-100 text-yellow-700' :
                            service.status === 'pickup_location' ? 'bg-orange-100 text-orange-700' :
                            service.status === 'driving_destination' || String(service.status) === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-purple-100 text-purple-700'
                      }`}>
                        {service.kind === "return" ? "Retorno" : statusLabel(service.status)}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-2" />
                        <span className="truncate">{service.origin} → {service.destination}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <span className="font-medium mr-1">Motorista:</span>
                        {service.driverName || "Não atribuído"}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <Dialog
        open={openServiceId != null}
        onOpenChange={(v) => {
          if (!v) {
            setOpenServiceId(null);
            setCompletionFxServiceId(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-background text-foreground border border-border">
          {(() => {
            const selectedItem = todaysServices.find((x: AgendaServiceItem) => x.key === openServiceId);
            const s = (services || []).find((x: any) => x.id === selectedItem?.serviceId);
            const isReturnItem = selectedItem?.kind === "return";
            if (!s) return <div className="text-muted-foreground">Selecione um serviço</div>;
            // Inicializa os custos quando o serviço abrir
            if (!isReturnItem && savingCosts === false && openServiceId === `service-${s.id}` && costs?.__initFrom !== s.id) {
              initCostsFromService(s);
              // marcação simples no objeto para evitar reinit loops
              setCosts((prev: any) => ({ ...prev, __initFrom: s.id }));
            }
            const serviceId = s.id;
            const tripStops = [
              s.stop1,
              s.stop2,
              s.stop3,
              s.stop4,
              s.stop5,
            ]
              .map((v: any) => String(v || "").trim())
              .filter(Boolean);
            const canAdvance = ["scheduled", "driving_pickup", "pickup_location", "driving_destination", "in_progress"].includes(String(s.status));
            const destinationPhase = s.status === "driving_destination" || String(s.status) === "in_progress";
            const rawStopProgress = stopProgressByService[serviceId] ?? 0;
            const stopProgress = Math.max(0, Math.min(tripStops.length, rawStopProgress));
            const hasPendingStops = destinationPhase && stopProgress < tripStops.length;
            const activeStopNumber = destinationPhase && stopProgress > 0 && stopProgress <= tripStops.length ? stopProgress : null;
            const nextStopNumber = hasPendingStops ? stopProgress + 1 : null;
            const nextStatus = s.status === "scheduled"
              ? "driving_pickup"
              : s.status === "driving_pickup"
              ? "pickup_location"
              : s.status === "pickup_location"
              ? "driving_destination"
              : destinationPhase && hasPendingStops
              ? "driving_destination"
              : destinationPhase
              ? "finished"
              : null;
            const isFinished = s.status === "finished";
            const canFinish = !isFinished;
            const canCancel = !isFinished;
            const hasIncompleteFlow =
              !isFinished &&
              (String(s.status) === "scheduled" ||
                String(s.status) === "driving_pickup" ||
                String(s.status) === "pickup_location" ||
                hasPendingStops);
            const showCompletionFx = completionFxServiceId === serviceId;
            const statusClass =
              s.status === "finished" ? "bg-green-100 text-green-700" :
              s.status === "driving_pickup" ? "bg-yellow-100 text-yellow-700" :
              s.status === "pickup_location" ? "bg-orange-100 text-orange-700" :
              s.status === "driving_destination" || String(s.status) === "in_progress" ? "bg-blue-100 text-blue-700" :
              "bg-purple-100 text-purple-700";
            const tripOrigin = isReturnItem ? (selectedItem?.origin || s.returnOrigin || s.destination) : s.origin;
            const tripDestination = isReturnItem ? (selectedItem?.destination || s.returnDestination || s.origin) : s.destination;
            const tripDateTime = isReturnItem ? (selectedItem?.dateTime || s.returnDateTime || s.dateTime) : s.dateTime;
            const tripDriver = isReturnItem ? (selectedItem?.driverName || s.driver?.name || "Não atribuído") : (s.driver?.name || "Não atribuído");
            const tripFlight = String((isReturnItem ? (s.flight || s.returnFlight) : s.flight) || "").trim();
            const tripKmPrevisto = s.kmPrevisto != null && String(s.kmPrevisto).trim() !== ""
              ? String(s.kmPrevisto).replace(".", ",")
              : "";
            const tripTempoEstimado = String(s.tempoEstimado || "").trim();
            const navigationSteps = [
              { title: "Dirigir até o embarque", address: tripOrigin, pinClassName: "text-primary" },
              ...tripStops.map((stop: string, idx: number) => ({
                title: `Dirigir até a parada ${idx + 1}`,
                address: stop,
                pinClassName: "text-amber-500",
              })),
              { title: "Dirigir até o destino", address: tripDestination, pinClassName: "text-blue-400" },
            ];
            const whatsappUrl = buildWhatsappUrl(s.clientPhone);
            const vehicleId = isReturnItem ? (s.returnVehicleId || s.vehicleId) : s.vehicleId;
            const flightSearchUrl = buildFlightSearchUrl(tripFlight);
            const paxTotal = Number(s.passengers || 0) > 0
              ? Number(s.passengers || 0)
              : Number(s.paxAdt || 0) +
                Number(s.paxChd || 0) +
                Number(s.paxInf || 0) +
                Number(s.paxSen || 0) +
                Number(s.paxFree || 0);
            const bagsCount = Number(s.bags || 0);
            const serviceObservation = String(s.notes || "").trim();
            const totalChargedCents = Number(s.valorCobrado || 0) > 0
              ? Number(s.valorCobrado || 0)
              : Math.round(Number(s.value || 0) * 100);
            const paidPartialCents = Number(s.valorPagoParcial || 0);
            const payDriverAmountCents = Math.max(0, totalChargedCents - paidPartialCents);
            const showPayDriverReminder =
              !isReturnItem &&
              String(s.statusPagamento || "") === "partial" &&
              String(s.restanteMetodo || "") === "pay_driver" &&
              payDriverAmountCents > 0;
            return (
              <>
                <div className="flex items-center justify-between mb-2">
                  <button className="inline-flex items-center gap-1 text-primary" onClick={() => setOpenServiceId(null)}>
                    <BackIcon className="w-4 h-4" />
                    <span>Serviço #{String(s.id).padStart(6, "0")}{isReturnItem ? " • Retorno" : ""}</span>
                  </button>
                </div>
                <div className="relative rounded-xl border border-border bg-card p-4 shadow-sm overflow-hidden">
                  {showCompletionFx && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-emerald-500/15 backdrop-blur-[1px] animate-in fade-in duration-200">
                      <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-6 py-4 text-center shadow-lg animate-in zoom-in-95 duration-300">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-400 animate-bounce" />
                        <div className="text-lg font-bold text-emerald-200">Viagem concluída</div>
                        <div className="text-sm text-emerald-100/90">Status finalizado com sucesso.</div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2 text-sm">
                    <div><span className="font-semibold text-primary">Cliente:</span> {s.clientName}</div>
                    <div><span className="font-semibold text-primary">Motorista:</span> {tripDriver}</div>
                    <div><span className="font-semibold text-primary">Data/Hora:</span> {format(new Date(tripDateTime), 'dd/MM/yyyy HH:mm', { locale: dateLocale })}</div>
                    <div><span className="font-semibold text-primary">Voo:</span> {tripFlight || "-"}</div>
                    <div className="grid grid-cols-1 gap-2">
                      {flightSearchUrl ? (
                        <Button type="button" variant="outline" asChild className="w-full">
                          <a href={flightSearchUrl} target="_blank" rel="noreferrer">Consultar voo</a>
                        </Button>
                      ) : (
                        <Button type="button" variant="outline" disabled className="w-full">
                          Consultar voo
                        </Button>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">Ajustar hora de partida:</div>
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          disabled={updateMutation.isPending}
                          onClick={() => adjustTripDateTime(serviceId, tripDateTime)}
                        >
                          Definir horário manual
                        </Button>
                        <div className="grid grid-cols-3 gap-2">
                          <Button type="button" variant="outline" disabled={updateMutation.isPending} onClick={() => adjustTripDateTime(serviceId, tripDateTime, 15)}>
                            +15 min
                          </Button>
                          <Button type="button" variant="outline" disabled={updateMutation.isPending} onClick={() => adjustTripDateTime(serviceId, tripDateTime, 30)}>
                            +30 min
                          </Button>
                          <Button type="button" variant="outline" disabled={updateMutation.isPending} onClick={() => adjustTripDateTime(serviceId, tripDateTime, 60)}>
                            +60 min
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div><span className="font-semibold text-primary">Qtde pax:</span> {paxTotal}</div>
                      <div><span className="font-semibold text-primary">Malas:</span> {bagsCount}</div>
                    </div>
                    {(tripKmPrevisto || tripTempoEstimado) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div><span className="font-semibold text-primary">KM da rota:</span> {tripKmPrevisto || "-"}</div>
                        <div><span className="font-semibold text-primary">Tempo estimado:</span> {tripTempoEstimado || "-"}</div>
                      </div>
                    )}
                    {serviceObservation && (
                      <div>
                        <span className="font-semibold text-primary">Observação:</span>{" "}
                        <span>{serviceObservation}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-0.5" />
                      <div>
                        <div className="text-xs text-muted-foreground">Origem</div>
                        <div>{tripOrigin}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground">Destino</div>
                        <div className="flex items-center justify-between gap-2">
                          <span>{tripDestination}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusClass}`}>{statusLabel(s.status)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {showPayDriverReminder && (
                    <div className="mt-3 rounded-lg border border-amber-300/70 bg-amber-100/80 px-3 py-2 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                      <div className="flex items-start gap-2 text-sm">
                        <CircleAlert className="w-4 h-4 mt-0.5" />
                        <div>
                          <span className="font-semibold">Cobrar do Passageiro:</span>{" "}
                          {(payDriverAmountCents / 100).toLocaleString(numberLocale, { style: "currency", currency: "BRL" })}{" "}
                          no {paymentMethodLabel(s.paymentMethod)}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-3">
                    <a
                      href={whatsappUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => {
                        if (!whatsappUrl) {
                          e.preventDefault();
                          toast({
                            title: "Sem telefone do cliente",
                            description: "Cadastre o número do cliente para abrir o WhatsApp.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md w-full ${whatsappUrl ? "bg-[#25D366] text-black hover:bg-[#1fc15a]" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                    >
                      <SiWhatsapp className="w-5 h-5" />
                      <span>Falar com cliente no WhatsApp</span>
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button 
                      disabled={!canAdvance || !nextStatus || updateMutation.isPending || showCompletionFx}
                      onClick={async () => {
                        if (destinationPhase && nextStopNumber) {
                          const ok = window.confirm(`Deseja avançar para a parada ${nextStopNumber}?`);
                          if (!ok) return;
                          if (String(s.status) === "in_progress") {
                            await updateMutation.mutateAsync({ id: serviceId, status: "driving_destination" as any });
                          }
                          setServiceStopProgress(serviceId, nextStopNumber);
                          return;
                        }
                        if (!nextStatus) return;
                        const ok = window.confirm(`Deseja avançar o status para "${statusLabel(nextStatus)}"?`);
                        if (!ok) return;
                        await updateMutation.mutateAsync({ id: serviceId, status: nextStatus as any });
                        if (nextStatus === "finished") {
                          clearServiceStopProgress(serviceId);
                        }
                      }}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      style={{ width: "100%" }}
                    >
                      {nextStopNumber
                        ? `Avançar: parada ${nextStopNumber}`
                        : nextStatus
                        ? `Avançar: ${statusLabel(nextStatus)}`
                        : "Sem próximo status"}
                    </Button>
                    <Button 
                      disabled={!canFinish || updateMutation.isPending || showCompletionFx}
                      onClick={async () => {
                        const confirmMsg = hasIncompleteFlow
                          ? "Atenção: a viagem ainda não passou por todas as etapas. Deseja realmente concluir agora?"
                          : "Deseja concluir a viagem? Confirme custos e KM real antes.";
                        const ok = window.confirm(confirmMsg);
                        if (!ok) return;
                        await saveCosts(serviceId);
                        // Registrar KM no log (se informado)
                        if (vehicleId && costs.kmReal && Number(costs.kmReal) > 0) {
                          try {
                            await fetch(`/api/financial/vehicle-km-logs`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({
                                vehicleId,
                                serviceId,
                                odometroFinal: Math.round(Number(costs.kmReal) * 1000), // registro simples (km→metros)
                                logAt: new Date(),
                                observacao: "Registro ao concluir viagem",
                              }),
                            });
                          } catch {}
                        }
                        await updateMutation.mutateAsync({ id: serviceId, status: "finished" });
                        clearServiceStopProgress(serviceId);
                        setCompletionFxServiceId(serviceId);
                        window.setTimeout(() => {
                          setCompletionFxServiceId(null);
                        }, 1400);
                      }}
                      variant="secondary"
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      style={{ width: "100%" }}
                    >
                      Concluir viagem
                    </Button>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <div>
                      {`Status: ${
                        activeStopNumber
                          ? `Dirigindo até a parada ${activeStopNumber}.`
                          : driverActionStatus(String(s.status), nextStatus)
                      }`}
                    </div>
                    {isReturnItem && <div>Item de retorno vinculado ao mesmo serviço.</div>}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-primary font-semibold mb-2">Navegação</div>
                  <div className="space-y-3">
                    {navigationSteps.map((step) => (
                      <div key={`${serviceId}-${step.title}-${step.address}`} className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <MapPin className={`w-4 h-4 ${step.pinClassName}`} />
                          <div className="font-medium">{step.title}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <button type="button" onClick={() => openWaze(step.address)} className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/80 w-full">
                            <SiWaze className="w-5 h-5 text-[#86d1ff]" />
                            <span>Waze</span>
                          </button>
                          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(step.address)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/80 w-full">
                            <SiGooglemaps className="w-5 h-5 text-[#47b66e]" />
                            <span>Google Maps</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {!isReturnItem && (
                <div className="mt-4">
                  <Accordion type="single" collapsible defaultValue="">
                    <AccordionItem value="expenses" className="border border-border rounded-xl bg-card">
                      <AccordionTrigger className="px-4 py-3 text-primary">
                        Despesas da viagem
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <label className="block mb-1 text-muted-foreground">KM Real (ex.: 25,5)</label>
                            <input className="w-full px-3 py-2 rounded bg-background border border-border"
                              value={costs.kmReal}
                              onChange={(e) => setCosts((c: any) => ({ ...c, kmReal: e.target.value }))}
                              placeholder="Ex.: 23,7"
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-muted-foreground">Combustível (R$)</label>
                            <input className="w-full px-3 py-2 rounded bg-background border border-border"
                              value={costs.combustivel}
                              onChange={(e) => setCosts((c: any) => ({ ...c, combustivel: formatInputBRL(e.target.value) }))}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-muted-foreground">Pedágio (R$)</label>
                            <input className="w-full px-3 py-2 rounded bg-background border border-border"
                              value={costs.pedagio}
                              onChange={(e) => setCosts((c: any) => ({ ...c, pedagio: formatInputBRL(e.target.value) }))}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-muted-foreground">Estacionamento (R$)</label>
                            <input className="w-full px-3 py-2 rounded bg-background border border-border"
                              value={costs.estacionamento}
                              onChange={(e) => setCosts((c: any) => ({ ...c, estacionamento: formatInputBRL(e.target.value) }))}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-muted-foreground">Alimentação (R$)</label>
                            <input className="w-full px-3 py-2 rounded bg-background border border-border"
                              value={costs.alimentacao}
                              onChange={(e) => setCosts((c: any) => ({ ...c, alimentacao: formatInputBRL(e.target.value) }))}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 text-muted-foreground">Outros (R$)</label>
                            <input className="w-full px-3 py-2 rounded bg-background border border-border"
                              value={costs.outrosCustos}
                              onChange={(e) => setCosts((c: any) => ({ ...c, outrosCustos: formatInputBRL(e.target.value) }))}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block mb-1 text-muted-foreground">Observação</label>
                            <textarea className="w-full px-3 py-2 rounded bg-background border border-border"
                              value={costs.observacaoCustos}
                              onChange={(e) => setCosts((c: any) => ({ ...c, observacaoCustos: e.target.value }))}
                            />
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <Button onClick={() => saveCosts(serviceId)} disabled={savingCosts} className="bg-primary text-primary-foreground hover:bg-primary/90">
                              {savingCosts ? "Salvando..." : "Salvar despesas"}
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                )}
                {!isReturnItem && canCancel && (
                  <div className="mt-4">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={async () => {
                        const ok = window.confirm("Confirmar cancelamento da corrida?");
                        if (!ok) return;
                        await updateMutation.mutateAsync({ id: serviceId, status: "canceled" });
                        clearServiceStopProgress(serviceId);
                        setOpenServiceId(null);
                      }}
                    >
                      Cancelar corrida
                    </Button>
                  </div>
                )}
                </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
