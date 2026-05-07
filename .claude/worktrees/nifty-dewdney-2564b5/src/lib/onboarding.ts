export interface UserProfileOnboarding {
  id: string
  email: string
  nome: string | null
  nome_negocio: string | null
  telefone: string | null
  cnae_principal: string | null
  tipo_mei: 'geral' | 'caminhoneiro' | null
  municipio: string | null
  uf: string | null
  faturamento_mensal_estimado: number | null
  faturamento_acumulado_atual: number | null
  folha_mensal: number | null
  mes_atual: number | null
  objetivo_principal: string | null
  onboarding_completed_at: string | null
  plano: 'free' | 'pro' | null
}

export function isOnboardingComplete(profile: Partial<UserProfileOnboarding> | null | undefined) {
  return Boolean(
    profile?.onboarding_completed_at &&
    profile.nome &&
    profile.nome_negocio &&
    profile.telefone &&
    profile.cnae_principal &&
    profile.tipo_mei &&
    profile.municipio &&
    profile.uf &&
    typeof profile.faturamento_acumulado_atual === 'number' &&
    typeof profile.folha_mensal === 'number' &&
    typeof profile.mes_atual === 'number' &&
    profile.objetivo_principal,
  )
}
