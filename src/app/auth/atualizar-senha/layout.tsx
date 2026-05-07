import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Definir nova senha — SimulaMEI',
  description: 'Defina uma nova senha para voltar ao seu painel fiscal no SimulaMEI.',
  alternates: { canonical: '/auth/atualizar-senha' },
  robots: { index: false, follow: false },
}

export default function AtualizarSenhaLayout({ children }: { children: React.ReactNode }) {
  return children
}
