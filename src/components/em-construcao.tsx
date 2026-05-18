import { Construction } from "lucide-react";

export function EmConstrucao({
  module,
  description,
  features,
}: {
  module: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="card max-w-3xl">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-amber-50 grid place-items-center">
          <Construction className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{module}</h3>
          <p className="text-sm text-amber-700 font-medium">Módulo em construção</p>
        </div>
      </div>

      <p className="mt-6 text-gray-700 leading-relaxed">{description}</p>

      <div className="mt-6">
        <p className="text-sm font-semibold text-gray-900 mb-3">O que vem por aí:</p>
        <ul className="space-y-2">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 rounded-lg bg-gray-50 border border-gray-100 p-4 text-xs text-gray-600">
        <p>
          <strong className="text-gray-900">Para desenvolvedores:</strong> o
          schema deste módulo já existe em <code className="font-mono">prisma/schema.prisma</code>.
          A página, rotas e server actions devem ser implementadas a partir do esqueleto atual.
        </p>
      </div>
    </div>
  );
}
