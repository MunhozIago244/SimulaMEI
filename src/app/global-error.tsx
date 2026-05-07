'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <body style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'oklch(8% 0.012 255)',
        color: 'oklch(94% 0.012 115)',
        fontFamily: "'Space Grotesk', sans-serif",
        padding: 28,
        textAlign: 'center',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(255,59,59,0.1)',
          border: '2px solid oklch(66% 0.21 28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, marginBottom: 20,
        }}>
          ✕
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          Algo deu errado
        </h1>
        <p style={{
          fontSize: 14, color: 'oklch(70% 0.018 255)',
          maxWidth: 420, lineHeight: 1.6, marginBottom: 24,
        }}>
          Ocorreu um erro inesperado. Se o problema persistir, entre em contato com o suporte.
          {error.digest && (
            <span style={{ display: 'block', marginTop: 8, fontFamily: 'monospace', fontSize: 11, color: 'oklch(56% 0.018 255)' }}>
              Código: {error.digest}
            </span>
          )}
        </p>
        <button
          onClick={reset}
          style={{
            padding: '12px 28px',
            background: 'oklch(88% 0.19 126)',
            color: 'oklch(10% 0.018 130)',
            border: 'none',
            borderRadius: 7,
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  )
}
