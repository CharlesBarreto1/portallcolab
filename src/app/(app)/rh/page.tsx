import { Topbar } from "@/components/layout/topbar";
import { EmConstrucao } from "@/components/em-construcao";

export default function RHPage() {
  return (
    <>
      <Topbar title="Área de RH" subtitle="Avisos, holerites, documentos e mais." />
      <div className="p-8">
        <EmConstrucao
          module="Área de RH"
          description="Espaço unificado para comunicação entre RH e colaboradores: mensagens, avisos importantes, holerites mensais, documentos com solicitação de leitura/assinatura e registro de hash de visualização."
          features={[
            "Mural de avisos e mensagens com indicação de leitura",
            "Holerites em PDF distribuídos para cada colaborador",
            "Solicitação de assinatura digital de documentos",
            "Registro de hash + timestamp ao visualizar/assinar (trilha de auditoria)",
            "Notificações por e-mail quando houver novo conteúdo",
          ]}
        />
      </div>
    </>
  );
}
