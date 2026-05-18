/**
 * Catálogo de permissões do sistema.
 * Permissões são strings com formato `modulo.acao`.
 * Cada cargo (JobRole) recebe um conjunto destas permissões.
 */

export const PERMISSIONS = {
  // Ponto eletrônico
  PONTO_REGISTRAR: "ponto.registrar",
  PONTO_VER_PROPRIO: "ponto.ver_proprio",
  PONTO_VER_TODOS: "ponto.ver_todos",
  PONTO_AJUSTAR: "ponto.ajustar",
  PONTO_EXPORTAR: "ponto.exportar",

  // RH
  RH_VER: "rh.ver",
  RH_UPLOAD: "rh.upload",
  RH_GERENCIAR: "rh.gerenciar",

  // Faculdade corporativa
  FACULDADE_VER: "faculdade.ver",
  FACULDADE_GERENCIAR: "faculdade.gerenciar",

  // Novidades
  NOVIDADES_VER: "novidades.ver",
  NOVIDADES_PUBLICAR: "novidades.publicar",

  // Documentos
  DOCUMENTOS_VER_PROPRIOS: "documentos.ver_proprios",
  DOCUMENTOS_VER_TODOS: "documentos.ver_todos",
  DOCUMENTOS_GERENCIAR: "documentos.gerenciar",

  // Admin
  ADMIN_USUARIOS: "admin.usuarios",
  ADMIN_CARGOS: "admin.cargos",
  ADMIN_DEPARTAMENTOS: "admin.departamentos",
  ADMIN_CONFIG: "admin.config",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_CATALOG: Array<{
  key: PermissionKey;
  label: string;
  description: string;
  module: string;
}> = [
  { key: PERMISSIONS.PONTO_REGISTRAR, label: "Registrar ponto", description: "Bater entrada/saída", module: "ponto" },
  { key: PERMISSIONS.PONTO_VER_PROPRIO, label: "Ver próprio ponto", description: "Visualizar histórico do próprio ponto", module: "ponto" },
  { key: PERMISSIONS.PONTO_VER_TODOS, label: "Ver ponto de todos", description: "Visualizar ponto de todos os colaboradores", module: "ponto" },
  { key: PERMISSIONS.PONTO_AJUSTAR, label: "Ajustar pontos", description: "Editar/incluir batidas manualmente", module: "ponto" },
  { key: PERMISSIONS.PONTO_EXPORTAR, label: "Exportar relatórios", description: "Exportar relatórios de ponto", module: "ponto" },

  { key: PERMISSIONS.RH_VER, label: "Ver área de RH", description: "Acessar avisos, holerites e documentos", module: "rh" },
  { key: PERMISSIONS.RH_UPLOAD, label: "Subir conteúdo de RH", description: "Postar mensagens, holerites, documentos", module: "rh" },
  { key: PERMISSIONS.RH_GERENCIAR, label: "Gerenciar RH", description: "Gestão total do módulo de RH", module: "rh" },

  { key: PERMISSIONS.FACULDADE_VER, label: "Ver faculdade", description: "Acessar cursos e treinamentos", module: "faculdade" },
  { key: PERMISSIONS.FACULDADE_GERENCIAR, label: "Gerenciar faculdade", description: "Criar/editar cursos", module: "faculdade" },

  { key: PERMISSIONS.NOVIDADES_VER, label: "Ver novidades", description: "Ler notícias internas", module: "novidades" },
  { key: PERMISSIONS.NOVIDADES_PUBLICAR, label: "Publicar novidades", description: "Postar/editar notícias internas", module: "novidades" },

  { key: PERMISSIONS.DOCUMENTOS_VER_PROPRIOS, label: "Ver próprios documentos", description: "Ver documentos pessoais", module: "documentos" },
  { key: PERMISSIONS.DOCUMENTOS_VER_TODOS, label: "Ver documentos de todos", description: "Ver documentos de qualquer colaborador", module: "documentos" },
  { key: PERMISSIONS.DOCUMENTOS_GERENCIAR, label: "Gerenciar documentos", description: "Subir, organizar e excluir documentos", module: "documentos" },

  { key: PERMISSIONS.ADMIN_USUARIOS, label: "Gerenciar usuários", description: "Aprovar cadastros e editar usuários", module: "admin" },
  { key: PERMISSIONS.ADMIN_CARGOS, label: "Gerenciar cargos", description: "Criar/editar cargos e permissões", module: "admin" },
  { key: PERMISSIONS.ADMIN_DEPARTAMENTOS, label: "Gerenciar departamentos", description: "Criar/editar departamentos", module: "admin" },
  { key: PERMISSIONS.ADMIN_CONFIG, label: "Configurações do sistema", description: "Alterar configurações globais", module: "admin" },
];

/**
 * SystemRole tem permissões "embutidas" — usadas quando o usuário não tem um JobRole atribuído
 * ou em adição às permissões do JobRole.
 */
export function permissionsForSystemRole(role: string): PermissionKey[] {
  switch (role) {
    case "ADMIN":
      return Object.values(PERMISSIONS);
    case "RH":
      return [
        PERMISSIONS.PONTO_REGISTRAR,
        PERMISSIONS.PONTO_VER_PROPRIO,
        PERMISSIONS.PONTO_VER_TODOS,
        PERMISSIONS.PONTO_EXPORTAR,
        PERMISSIONS.RH_VER,
        PERMISSIONS.RH_UPLOAD,
        PERMISSIONS.RH_GERENCIAR,
        PERMISSIONS.FACULDADE_VER,
        PERMISSIONS.NOVIDADES_VER,
        PERMISSIONS.NOVIDADES_PUBLICAR,
        PERMISSIONS.DOCUMENTOS_VER_TODOS,
        PERMISSIONS.DOCUMENTOS_GERENCIAR,
      ];
    case "GESTOR":
      return [
        PERMISSIONS.PONTO_REGISTRAR,
        PERMISSIONS.PONTO_VER_PROPRIO,
        PERMISSIONS.PONTO_VER_TODOS,
        PERMISSIONS.PONTO_EXPORTAR,
        PERMISSIONS.RH_VER,
        PERMISSIONS.FACULDADE_VER,
        PERMISSIONS.NOVIDADES_VER,
        PERMISSIONS.DOCUMENTOS_VER_PROPRIOS,
      ];
    case "COLABORADOR":
    default:
      return [
        PERMISSIONS.PONTO_REGISTRAR,
        PERMISSIONS.PONTO_VER_PROPRIO,
        PERMISSIONS.RH_VER,
        PERMISSIONS.FACULDADE_VER,
        PERMISSIONS.NOVIDADES_VER,
        PERMISSIONS.DOCUMENTOS_VER_PROPRIOS,
      ];
  }
}

export function hasPermission(
  userPermissions: string[] | undefined | null,
  required: PermissionKey
): boolean {
  if (!userPermissions) return false;
  return userPermissions.includes(required);
}

export function hasAny(
  userPermissions: string[] | undefined | null,
  required: PermissionKey[]
): boolean {
  if (!userPermissions) return false;
  return required.some((p) => userPermissions.includes(p));
}
