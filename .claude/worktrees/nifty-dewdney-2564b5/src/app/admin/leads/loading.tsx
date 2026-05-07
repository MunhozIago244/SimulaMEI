export default function LeadsLoading() {
  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ height: 28, width: 200, background: 'var(--bg2)', borderRadius: 6, marginBottom: 24 }} />
      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              height: 52,
              background: i % 2 === 0 ? 'var(--bg1)' : 'var(--bg2)',
              borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    </div>
  )
}
