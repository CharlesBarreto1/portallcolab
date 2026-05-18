/**
 * Cálculo de ponto eletrônico conforme normas da CLT.
 *
 * Regras simplificadas implementadas:
 * - Jornada padrão: configurável por usuário (default 8h/dia = 480min).
 * - Horas extras: tudo acima da jornada diária é HE.
 * - Adicional padrão de HE: 50% (dias úteis), 100% (domingo/feriado).
 * - Intervalo (almoço): descontado automaticamente entre SAIDA_INTERVALO e RETORNO_INTERVALO.
 *   Se trabalhar > 6h sem registrar intervalo, descontamos 60min conforme CLT art. 71.
 * - Banco de horas / DSR / adicional noturno: NÃO implementados nesta versão (TODO).
 *
 * As batidas chegam ordenadas por timestamp ASC.
 */

import { TimeEntryType } from "@prisma/client";

export type Entry = {
  id: string;
  timestamp: Date;
  type: TimeEntryType;
};

export type DaySummary = {
  date: string; // YYYY-MM-DD
  isHoliday: boolean;
  isWeekend: boolean;
  entries: Entry[];
  workedMinutes: number;        // tempo efetivamente trabalhado (descontado intervalo)
  expectedMinutes: number;      // jornada esperada do dia
  overtimeMinutes: number;      // minutos acima da jornada
  overtimeRate: number;         // 0.5 (50%) ou 1.0 (100%)
  shortageMinutes: number;      // minutos a menos que a jornada
  inconsistencies: string[];    // ex: "ponto ímpar", "saída antes da entrada"
};

const HOUR = 60;
const MIN_INTERVAL_AFTER = 6 * HOUR; // CLT art. 71: acima de 6h trabalhadas, intervalo de 1h obrigatório

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function diffMinutes(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

/**
 * Agrupa batidas por dia.
 */
export function groupByDay(entries: Entry[]): Map<string, Entry[]> {
  const groups = new Map<string, Entry[]>();
  for (const e of entries) {
    const key = ymd(e.timestamp);
    const list = groups.get(key) ?? [];
    list.push(e);
    groups.set(key, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  return groups;
}

/**
 * Calcula resumo de um único dia.
 */
export function summarizeDay(
  date: Date,
  entries: Entry[],
  options: {
    expectedMinutes: number;
    holidays?: Set<string>; // YYYY-MM-DD
  }
): DaySummary {
  const dateStr = ymd(date);
  const isHoliday = options.holidays?.has(dateStr) ?? false;
  const day = date.getDay();
  const isWeekend = day === 0; // só domingo conta para adicional 100% por padrão

  const inconsistencies: string[] = [];

  // Espera-se que as batidas sigam o padrão:
  // ENTRADA, [SAIDA_INTERVALO, RETORNO_INTERVALO]*, SAIDA
  let workedMinutes = 0;
  let openStart: Date | null = null;
  let hadExplicitBreak = false;

  for (const e of entries) {
    switch (e.type) {
      case "ENTRADA":
      case "RETORNO_INTERVALO":
        if (openStart) inconsistencies.push("Entrada sem saída anterior fechada");
        openStart = e.timestamp;
        break;
      case "SAIDA_INTERVALO":
      case "SAIDA":
        if (!openStart) {
          inconsistencies.push("Saída sem entrada correspondente");
          break;
        }
        const delta = diffMinutes(openStart, e.timestamp);
        if (delta < 0) inconsistencies.push("Saída anterior à entrada");
        else workedMinutes += delta;
        if (e.type === "SAIDA_INTERVALO") hadExplicitBreak = true;
        openStart = null;
        break;
    }
  }

  if (openStart) inconsistencies.push("Última entrada sem saída registrada");

  // Aplica desconto de intervalo se trabalhou > 6h sem intervalo registrado (CLT art. 71)
  if (!hadExplicitBreak && workedMinutes > MIN_INTERVAL_AFTER) {
    workedMinutes -= 60;
  }

  const expected = isHoliday || isWeekend ? 0 : options.expectedMinutes;
  const overtimeMinutes = Math.max(0, workedMinutes - expected);
  const shortageMinutes = expected > 0 ? Math.max(0, expected - workedMinutes) : 0;
  const overtimeRate = isHoliday || isWeekend ? 1.0 : 0.5;

  return {
    date: dateStr,
    isHoliday,
    isWeekend,
    entries,
    workedMinutes: Math.max(0, workedMinutes),
    expectedMinutes: expected,
    overtimeMinutes,
    overtimeRate,
    shortageMinutes,
    inconsistencies,
  };
}

/**
 * Agrega um período (mês) inteiro.
 */
export function summarizePeriod(
  entries: Entry[],
  options: {
    from: Date;
    to: Date;
    expectedMinutes: number;
    holidays?: Set<string>;
  }
): {
  days: DaySummary[];
  totals: {
    workedMinutes: number;
    overtimeMinutes: number;
    overtime50Minutes: number;
    overtime100Minutes: number;
    shortageMinutes: number;
    inconsistencies: number;
  };
} {
  const groups = groupByDay(entries);
  const days: DaySummary[] = [];

  const cursor = new Date(options.from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(options.to);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    const key = ymd(cursor);
    const dayEntries = groups.get(key) ?? [];
    if (dayEntries.length > 0 || true) {
      days.push(
        summarizeDay(new Date(cursor), dayEntries, {
          expectedMinutes: options.expectedMinutes,
          holidays: options.holidays,
        })
      );
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  const totals = days.reduce(
    (acc, d) => {
      acc.workedMinutes += d.workedMinutes;
      acc.overtimeMinutes += d.overtimeMinutes;
      acc.shortageMinutes += d.shortageMinutes;
      if (d.overtimeRate >= 1) acc.overtime100Minutes += d.overtimeMinutes;
      else acc.overtime50Minutes += d.overtimeMinutes;
      acc.inconsistencies += d.inconsistencies.length;
      return acc;
    },
    {
      workedMinutes: 0,
      overtimeMinutes: 0,
      overtime50Minutes: 0,
      overtime100Minutes: 0,
      shortageMinutes: 0,
      inconsistencies: 0,
    }
  );

  return { days, totals };
}

/**
 * Dado o conjunto atual de batidas do dia, sugere qual é o próximo tipo.
 * Ex: nenhuma batida -> ENTRADA; tem entrada -> SAIDA_INTERVALO ou SAIDA; etc.
 */
export function nextEntryType(todayEntries: Entry[]): TimeEntryType {
  const sorted = [...todayEntries].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  const last = sorted[sorted.length - 1];
  if (!last) return "ENTRADA";
  switch (last.type) {
    case "ENTRADA":
      return "SAIDA_INTERVALO";
    case "SAIDA_INTERVALO":
      return "RETORNO_INTERVALO";
    case "RETORNO_INTERVALO":
      return "SAIDA";
    case "SAIDA":
      return "ENTRADA"; // novo turno
  }
}

export function typeLabel(t: TimeEntryType): string {
  return {
    ENTRADA: "Entrada",
    SAIDA_INTERVALO: "Saída para intervalo",
    RETORNO_INTERVALO: "Retorno do intervalo",
    SAIDA: "Saída",
  }[t];
}
