import { ArrowRight, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  footer: ReactNode;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />
        <div className="auth-orb auth-orb-three" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(248,250,252,0.45)_70%)]" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
        <div className="grid w-full max-w-[1100px] overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0">
              <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
              <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
            </div>

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <ArrowRight className="h-5 w-5" />
                </div>

                <span className="text-sm font-semibold tracking-wide">
                  Рабочее пространство
                </span>
              </div>

              <div className="mt-20 max-w-sm">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <ShieldCheck className="h-5 w-5 text-slate-200" />
                </div>

                <h2 className="text-4xl font-semibold leading-tight tracking-tight">
                  Всё необходимое
                  <br />
                  для работы над проектом.
                </h2>

                <p className="mt-5 text-sm leading-6 text-slate-300">
                  Запросы, материалы, согласования и коммуникация —
                  в одном рабочем пространстве.
                </p>
              </div>
            </div>

            <div className="relative text-xs text-slate-400">
              Безопасное рабочее пространство проекта
            </div>
          </section>

          <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
            <div className="w-full max-w-[420px] auth-form-enter">
              <div className="mb-8 lg:hidden">
                <div className="text-sm font-semibold text-slate-900">
                  Рабочее пространство
                </div>
              </div>

              <div className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {title}
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {subtitle}
                </p>
              </div>

              {children}

              <div className="mt-8 text-center text-sm text-slate-500">
                {footer}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
