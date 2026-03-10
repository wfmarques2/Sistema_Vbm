import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDays, endOfDay, endOfMonth, endOfYear, startOfDay, startOfMonth, startOfYear, subDays, subMonths } from "date-fns";
import React from "react";

type Props = {
  start: string;
  end: string;
  onChange: (range: { start: string; end: string }) => void;
  className?: string;
};

function toLocalDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Server usa lt(end), então definimos end exclusivo (+1 dia quando usar atalhos)
function makeRange(kind: "today"|"yesterday"|"last7"|"last30"|"thisMonth"|"lastMonth"|"thisYear"|"last90") {
  const now = new Date();
  switch (kind) {
    case "today": {
      const s = startOfDay(now);
      const e = addDays(endOfDay(now), 1);
      return { start: toLocalDateStr(s), end: toLocalDateStr(e) };
    }
    case "yesterday": {
      const y = subDays(now, 1);
      const s = startOfDay(y);
      const e = addDays(endOfDay(y), 1);
      return { start: toLocalDateStr(s), end: toLocalDateStr(e) };
    }
    case "last7": {
      const s = startOfDay(subDays(now, 6));
      const e = addDays(endOfDay(now), 1);
      return { start: toLocalDateStr(s), end: toLocalDateStr(e) };
    }
    case "last30": {
      const s = startOfDay(subDays(now, 29));
      const e = addDays(endOfDay(now), 1);
      return { start: toLocalDateStr(s), end: toLocalDateStr(e) };
    }
    case "thisMonth": {
      const s = startOfMonth(now);
      const e = addDays(endOfMonth(now), 1);
      return { start: toLocalDateStr(s), end: toLocalDateStr(e) };
    }
    case "lastMonth": {
      const lastM = subMonths(now, 1);
      const s = startOfMonth(lastM);
      const e = addDays(endOfMonth(lastM), 1);
      return { start: toLocalDateStr(s), end: toLocalDateStr(e) };
    }
    case "thisYear": {
      const s = startOfYear(now);
      const e = addDays(endOfYear(now), 1);
      return { start: toLocalDateStr(s), end: toLocalDateStr(e) };
    }
    case "last90": {
      const s = startOfDay(subDays(now, 89));
      const e = addDays(endOfDay(now), 1);
      return { start: toLocalDateStr(s), end: toLocalDateStr(e) };
    }
  }
}

export function DateQuickFilters({ start, end, onChange, className }: Props) {
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 mb-3">
        <Button variant="outline" size="sm" onClick={() => onChange(makeRange("today"))}>Hoje</Button>
        <Button variant="outline" size="sm" onClick={() => onChange(makeRange("yesterday"))}>Ontem</Button>
        <Button variant="outline" size="sm" onClick={() => onChange(makeRange("last7"))}>Últimos 7 dias</Button>
        <Button variant="outline" size="sm" onClick={() => onChange(makeRange("last30"))}>Últimos 30 dias</Button>
        <Button variant="outline" size="sm" onClick={() => onChange(makeRange("last90"))}>Últimos 90 dias</Button>
        <Button variant="outline" size="sm" onClick={() => onChange(makeRange("thisMonth"))}>Este mês</Button>
        <Button variant="outline" size="sm" onClick={() => onChange(makeRange("lastMonth"))}>Mês passado</Button>
        <Button variant="outline" size="sm" onClick={() => onChange(makeRange("thisYear"))}>Este ano</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          type="date"
          value={start}
          onChange={(e) => onChange({ start: e.target.value, end })}
          placeholder="Data inicial"
        />
        <Input
          type="date"
          value={end}
          onChange={(e) => onChange({ start, end: e.target.value })}
          placeholder="Data final"
        />
      </div>
    </div>
  );
}

export default DateQuickFilters;
