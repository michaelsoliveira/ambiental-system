import Link from 'next/link'

import { SignUpForm } from '@/features/auth/sign-up/sign-up-form'

export default function SignUpPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/bg_sidebar.jpeg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-blue-950/80" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl shadow-black/30 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative hidden min-h-[640px] overflow-hidden bg-blue-700 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-700 to-slate-950" />
            <div className="absolute -right-24 top-16 size-72 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 size-80 rounded-full bg-indigo-950/60 blur-3xl" />

            <div className="relative">
              <Link href="/" className="text-xl font-semibold tracking-tight">
                AmbientalSystem
              </Link>
              <p className="mt-1 text-sm text-blue-100">
                Gestão ambiental simplificada.
              </p>
            </div>

            <div className="relative max-w-sm">
              <span className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-blue-50">
                BEM-VINDO
              </span>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight">
                Organize sua operação em um único lugar.
              </h1>
              <p className="mt-5 text-base leading-7 text-blue-100">
                Crie sua conta para acompanhar processos, documentos e
                informações da sua empresa com mais clareza.
              </p>
            </div>

            <p className="relative text-sm text-blue-100">
              Seguro, simples e pronto para sua equipe.
            </p>
          </section>

          <section className="flex min-h-[640px] items-center bg-white px-6 py-10 sm:px-12 lg:px-16">
            <div className="w-full">
              <div className="mb-8 lg:hidden">
                <Link
                  href="/"
                  className="text-xl font-semibold tracking-tight text-slate-900"
                >
                  AmbientalSystem
                </Link>
                <p className="mt-1 text-sm text-slate-500">
                  Gestão ambiental simplificada.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Crie sua conta
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Preencha seus dados para começar a usar a plataforma.
                </p>
              </div>

              <SignUpForm />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
