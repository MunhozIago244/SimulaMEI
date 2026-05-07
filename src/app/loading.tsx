export default function Loading() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    }}>
      <div style={{
        width: 36, height: 36,
        border: '3px solid var(--border2)',
        borderTopColor: 'var(--lime)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <span style={{
        fontSize: 13,
        color: 'var(--text3)',
        fontWeight: 600,
      }}>
        Carregando…
      </span>
    </div>
  )
}
