import { Topbar } from "@/components/layout/topbar";
import { EmConstrucao } from "@/components/em-construcao";

export default function FaculdadePage() {
  return (
    <>
      <Topbar title="Faculdade Corporativa" subtitle="Treinamentos e capacitação interna." />
      <div className="p-8">
        <EmConstrucao
          module="Faculdade Corporativa"
          description="Plataforma de ensino interno onde colaboradores acessam trilhas, cursos e conteúdos de treinamento. Foco em onboarding, capacitação técnica e desenvolvimento comportamental."
          features={[
            "Catálogo de cursos com vídeo, texto e quizzes",
            "Trilhas de aprendizado por cargo/departamento",
            "Progresso individual e certificados de conclusão",
            "Atribuição obrigatória de cursos por gestores/RH",
            "Relatórios de engajamento e tempo de estudo",
          ]}
        />
      </div>
    </>
  );
}
