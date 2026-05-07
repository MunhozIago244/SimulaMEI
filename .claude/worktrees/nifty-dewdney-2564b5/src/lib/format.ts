// Formatters de apresentação — sem lógica de negócio
// Todos usam Intl para respeitar locale pt-BR

export const MESES_ABREVIADOS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

export const MESES_COMPLETOS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const num = new Intl.NumberFormat('pt-BR')

export function fmt(n: number): string {
  return brl.format(n)
}

export function fmtPct(n: number): string {
  return (n * 100).toFixed(1) + '%'
}

export function fmtNum(n: number): string {
  return num.format(Math.round(n))
}

export function fmtK(n: number): string {
  if (n >= 1000) return `R$ ${(n / 1000).toFixed(0)}k`
  return fmt(n)
}
