export function Pill({
  children,
  color = 'var(--text3)',
}: {
  children: React.ReactNode
  color?: string
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 28,
        padding: '6px 9px',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        color,
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}
