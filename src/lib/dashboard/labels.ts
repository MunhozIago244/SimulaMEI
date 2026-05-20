export type RegimeAtual = 'mei' | 'simples' | null | undefined

/**
 * Rotula o anexo do Simples Nacional conforme o regime atual do usuário.
 * MEI (SIMEI) não tem anexo — DAS fixo. Mostrar "Anexo X atual" pra MEI é
 * erro de categoria. Pra esses casos rotulamos como projeção se migrar para ME.
 */
export function labelAnexoPorRegime(
  regime: RegimeAtual,
  anexo: 'I' | 'II' | 'III' | 'IV' | 'V',
): string {
  if (regime === 'mei') return `Anexo ${anexo} (se migrar para ME)`
  if (regime === 'simples') return `Anexo ${anexo} (atual)`
  return `Anexo ${anexo}`
}
