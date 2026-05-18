"use client";

import { useRouter } from "next/navigation";
import { formatMinutes } from "@/lib/utils";
import { typeLabel, type DaySummary } from "@/lib/ponto";
import { AlertTriangle, ChevronLeft, ChevronRight, Download } from "lucide-react";

type Props = {
  summary: {
    days: DaySummary[];
    totals: {
      workedMinutes: number;
      overtimeMinutes: number;
      shortageMinutes: number;
    };
  };
  year: number;
  month: number; // 1-12
};

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function PontoHistorico({ summary, year, month }: Props) {
  const router = useRouter();
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  function navigate(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    router.push(`/ponto?mes=${y}-${m}`);
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Histórico do mês</h3>
          <p className="text-sm text-gray-500">{MONTHS[month - 1]} de {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="btn-ghost h-9 w-9 p-0">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => navigate(1)} className="btn-ghost h-9 w-9 p-0">
            <ChevronRight className="h-4 w-4" />
          </button>
          <a
            href={`/api/relatorios/ponto?mes=${monthStr}`}
            className="btn-secondary"
          >
            <Download className="h-4 w-4" /> Exportar CSV
          </a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <th className="py-2 pr-3 font-medium">Dia</th>
              <th className="py-2 px-3 font-medium">Batidas</th>
              <th className="py-2 px-3 font-medium text-right">Trabalhado</th>
              <th className="py-2 px-3 font-medium text-right">Esperado</th>
              <th className="py-2 px-3 font-medium text-right">Extra</th>
              <th className="py-2 pl-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {summary.days.map((day) => {
              const d = new Date(day.date + "T00:00:00");
              const weekday = d.toLocaleDateString("pt-BR", { weekday: "short" });
              return (
                <tr key={day.date} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 pr-3">
                    <div className="font-medium">{d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</div>
                    <div className="text-xs text-gray-500 capitalize">{weekday}</div>
                  </td>
                  <td className="py-3 px-3">
                    {day.entries.length === 0 ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {day.entries.map((e) => (
                          <span
                            key={e.id}
                            title={typeLabel(e.type)}
                            className="inline-flex items-center gap-1 rounded bg-gray-50 px-2 py-0.5 text-xs tabular-nums"
                          >
                            {new Date(e.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums">{formatMinutes(day.workedMinutes)}</td>
                  <td className="py-3 px-3 text-right tabular-nums text-gray-500">{formatMinutes(day.expectedMinutes)}</td>
                  <td className="py-3 px-3 text-right tabular-nums">
                    {day.overtimeMinutes > 0 ? (
                      <span className={day.overtimeRate >= 1 ? "text-purple-700 font-medium" : "text-emerald-700 font-medium"}>
                        +{formatMinutes(day.overtimeMinutes)}
                        <span className="ml-1 text-xs">({day.overtimeRate >= 1 ? "100%" : "50%"})</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 pl-3">
                    {day.isHoliday ? (
                      <span className="badge-blue">Feriado</span>
                    ) : day.isWeekend ? (
                      <span className="badge-gray">Folga</span>
                    ) : day.inconsistencies.length > 0 ? (
                      <span className="badge-yellow inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {day.inconsistencies.length} alerta(s)
                      </span>
                    ) : day.shortageMinutes > 0 && day.workedMinutes > 0 ? (
                      <span className="badge-yellow">Falta {formatMinutes(day.shortageMinutes)}</span>
                    ) : day.workedMinutes === 0 ? (
                      <span className="badge-gray">Sem batidas</span>
                    ) : (
                      <span className="badge-green">OK</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
