export function Panel({
  children,
  style,
  className,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}) {
  return (
    <section
      className={`dashboard-panel${className ? ` ${className}` : ''}`}
      style={{
        background: 'var(--bg1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        ...style,
      }}
    >
      {children}
    </section>
  )
}
