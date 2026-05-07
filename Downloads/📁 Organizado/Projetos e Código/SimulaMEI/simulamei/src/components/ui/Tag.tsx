interface TagProps {
  label: string
  icon?: string
}

export function Tag({ label, icon }: TagProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        padding: '3px 10px',
        fontSize: 11,
        color: 'var(--text2)',
        fontWeight: 500,
      }}
    >
      {icon && (
        <span style={{ color: 'var(--lime)', fontSize: 10 }}>{icon}</span>
      )}
      {label}
    </span>
  )
}
