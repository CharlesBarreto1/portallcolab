import { Topbar } from "@/components/layout/topbar";
import { EmConstrucao } from "@/components/em-construcao";

export default function DocumentosPage() {
  return (
    <>
      <Topbar title="Meus documentos" subtitle="Seus arquivos pessoais e da empresa." />
      <div className="p-8">
        <EmConstrucao
          module="Gestão de Documentos"
          description="Repositório de documentos dos colaboradores organizado em pastas com permissões granulares. Cada colaborador acessa apenas o que lhe foi atribuído; o RH/admin enxerga tudo conforme regra."
          features={[
            "Estrutura de pastas (admissão, periódicos, ASO, certificados, etc.)",
            "Upload com versionamento e tags",
            "Permissões por pasta, cargo ou colaborador individual",
            "Visualização inline de PDFs e imagens",
            "Logs de acesso (quem visualizou e quando)",
          ]}
        />
      </div>
    </>
  );
}
