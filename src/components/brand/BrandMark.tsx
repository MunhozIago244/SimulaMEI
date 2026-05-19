import type { CSSProperties } from 'react'

/**
 * Marca canônica do SimulaMEI: quadrado lime arredondado com o diamante de 3
 * camadas. Único componente — substitui 5 renderizações inline divergentes
 * (Header, DashboardSidebar, Footer, StaticPageLayout, AuthScaffold) que vinham
 * com tamanhos/raios/strokes/paths diferentes do mesmo símbolo.
 *
 * Mudar a marca = mudar AQUI. Não inlinar SVG/cores em layouts novos.
 */
export interface BrandMarkProps {
  /** Lado do quadrado em px. SVG interno escala pra 50% do lado. */
  size?: number
  /** Permite estilo contextual (ex.: margem); não sobrescreva cor/raio/tamanho aqui. */
  style?: CSSProperties
  className?: string
}

export function BrandMark({ size = 24, style, className }: BrandMarkProps) {
  const inner = Math.round(size * 0.5)
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        width: size,
        height: size,
        background: 'var(--lime)',
        borderRadius: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      <svg width={inner} height={inner} viewBox="0 0 24 24" fill="none" stroke="var(--ink-on-accent)" strokeWidth="3">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
  )
}
