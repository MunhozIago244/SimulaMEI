import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recuperar senha — SimulaMEI',
  description: 'Solicite um link seguro para redefinir a senha da sua conta SimulaMEI.',
  alternates: { canonical: '/auth/recuperar' },
  robots: { index: false, follow: false },
}

export default function RecuperarLayout({ children }: { children: React.ReactNode }) {
  return children
}
