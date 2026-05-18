import { Topbar } from "@/components/layout/topbar";
import { EmConstrucao } from "@/components/em-construcao";

export default function NovidadesPage() {
  return (
    <>
      <Topbar title="Novidades" subtitle="Notícias e comunicados internos." />
      <div className="p-8">
        <EmConstrucao
          module="Novidades"
          description="Blog interno com notícias, comunicados, conquistas da empresa e cultura organizacional. Pensado para manter o time engajado e alinhado."
          features={[
            "Editor de posts com imagem de capa, formatação rica e tags",
            "Categorias (Cultura, Resultados, RH, Tecnologia, etc.)",
            "Comentários e reações dos colaboradores",
            "Posts fixados na home",
            "Agendamento de publicação",
          ]}
        />
      </div>
    </>
  );
}
