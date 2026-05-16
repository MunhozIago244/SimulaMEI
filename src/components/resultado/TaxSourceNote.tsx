import type { CSSProperties } from 'react'

export interface TaxSource {
  titulo: string
  url?: string
}

/**
 * Builds the auditability line shown next to result numbers.
 *
 * Trust contract: every result must be able to point at its normative
 * source and the engine version that produced it. The engine version is
 * always shown — even with no sources — so a number can be re-audited later.
 */
export function formatTaxSourceLine(
  fontes: ReadonlyArray<{ titulo: string }>,
  taxRuleVersion: string,
): string {
  const motor = `Motor ${taxRuleVersion.replace('BR-MEI-SN-', 'v')}`
  if (fontes.length === 0) return motor
  return `Fonte: ${fontes.map(f => f.titulo).join(' · ')} · ${motor}`
}

/**
 * Inline source + engine-version note for result surfaces
 * (PartialResults / FullResults / TabelaDAS / disclaimer).
 */
export function TaxSourceNote({
  taxRuleVersion,
  fontes = [],
  style,
  className,
}: {
  taxRuleVersion: string
  fontes?: ReadonlyArray<TaxSource>
  style?: CSSProperties
  className?: string
}) {
  const line = formatTaxSourceLine(fontes, taxRuleVersion)
  const links = fontes.filter((f): f is Required<TaxSource> => Boolean(f.url))

  return (
    <div
      className={className}
      style={{
        fontSize: 11,
        color: 'var(--text3)',
        lineHeight: 1.5,
        ...style,
      }}
    >
      <span>{line}</span>
      {links.length > 0 && (
        <span>
          {' — '}
          {links.map((f, i) => (
            <span key={f.url}>
              {i > 0 && ' · '}
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--blue)' }}
              >
                {f.titulo}
              </a>
            </span>
          ))}
        </span>
      )}
    </div>
  )
}
