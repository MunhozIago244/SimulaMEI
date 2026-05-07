import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Criar conta — SimulaMEI',
  description: 'Crie sua conta no SimulaMEI para salvar simulações, monitorar CNAEs e destravar o dashboard fiscal.',
  alternates: { canonical: '/auth/registro' },
  robots: { index: false, follow: false },
}

export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  return children
}
