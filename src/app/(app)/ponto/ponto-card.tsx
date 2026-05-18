"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogIn, LogOut, Coffee, Undo2, Loader2, CheckCircle2 } from "lucide-react";
import { nextEntryType, typeLabel, type Entry } from "@/lib/ponto";
import { TimeEntryType } from "@prisma/client";
import { registrarPonto } from "./actions";

type Props = {
  todayEntries: Array<{ id: string; type: TimeEntryType; timestamp: string }>;
};

export function PontoCard({ todayEntries: initial }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState(initial);
  const [now, setNow] = useState<Date>(new Date());
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const parsed: Entry[] = entries.map((e) => ({
    id: e.id,
    type: e.type,
    timestamp: new Date(e.timestamp),
  }));
  const nextType = nextEntryType(parsed);

  function handleRegister(type: TimeEntryType) {
    setError(null);
    setConfirmation(null);
    startTransition(async () => {
      const result = await registrarPonto({ type });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.entry) {
        setEntries((prev) => [...prev, result.entry]);
        setConfirmation(`${typeLabel(result.entry.type)} registrada às ${new Date(result.entry.timestamp).toLocaleTimeString("pt-BR")}`);
        router.refresh();
      }
    });
  }

  const icon: Record<TimeEntryType, React.ReactNode> = {
    ENTRADA: <LogIn className="h-5 w-5" />,
    SAIDA_INTERVALO: <Coffee className="h-5 w-5" />,
    RETORNO_INTERVALO: <Undo2 className="h-5 w-5" />,
    SAIDA: <LogOut className="h-5 w-5" />,
  };

  return (
    <div className="card relative overflow-hidden">
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-50 opacity-60" />
      <div className="relative grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-sm text-gray-500">Hora atual</p>
          <p className="text-5xl font-bold tracking-tight tabular-nums mt-1">
            {now.toLocaleTimeString("pt-BR")}
          </p>
          <p className="text-sm text-gray-500 mt-1 capitalize">
            {now.toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          <button
            onClick={() => handleRegister(nextType)}
            disabled={isPending}
            className="btn-primary mt-6 px-6 py-3 text-base"
          >
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : icon[nextType]}
            Registrar {typeLabel(nextType).toLowerCase()}
          </button>

          {confirmation && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              {confirmation}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Batidas de hoje</p>
          {parsed.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma batida registrada hoje.</p>
          ) : (
            <ul className="space-y-2">
              {parsed.map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{typeLabel(e.type)}</span>
                  </div>
                  <span className="tabular-nums text-gray-700">
                    {e.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
