import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Entrar — SimulaMEI',
  description: 'Acesse seu dashboard fiscal, histórico de simulações e relatórios do SimulaMEI.',
  alternates: { canonical: '/auth/login' },
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
