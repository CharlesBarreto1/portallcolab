export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white p-12">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur grid place-items-center font-black text-xl">
            Z
          </div>
          <span className="text-xl font-bold tracking-tight">Zux Portal</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Tudo da sua jornada<br />em um só lugar.
          </h1>
          <p className="text-brand-50/90 max-w-md">
            Ponto eletrônico, RH, faculdade corporativa, novidades e seus
            documentos — organizados para o seu dia a dia.
          </p>
        </div>
        <p className="text-sm text-brand-100/80">
          © {new Date().getFullYear()} Zux. Todos os direitos reservados.
        </p>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
