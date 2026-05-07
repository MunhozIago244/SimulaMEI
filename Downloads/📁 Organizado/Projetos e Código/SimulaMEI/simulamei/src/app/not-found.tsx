import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg0)',
      color: 'var(--text1)',
      fontFamily: 'var(--sans)',
      padding: 28,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: 'var(--mono)',
        fontSize: 72,
        fontWeight: 900,
        color: 'var(--lime)',
        lineHeight: 1,
        marginBottom: 12,
      }}>
        404
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        Página não encontrada
      </h1>
      <p style={{
        fontSize: 14, color: 'var(--text2)',
        maxWidth: 420, lineHeight: 1.6, marginBottom: 28,
      }}>
        O endereço que você acessou não existe ou foi movido.
        Verifique a URL ou volte ao simulador.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link
          href="/"
          className="pressable"
          style={{
            padding: '12px 28px',
            background: 'var(--lime)',
            color: 'var(--ink-on-accent)',
            borderRadius: 'var(--radius)',
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          Ir para o simulador
        </Link>
        <Link
          href="/dashboard"
          className="pressable"
          style={{
            padding: '12px 28px',
            background: 'var(--bg2)',
            color: 'var(--text2)',
            border: '1px solid var(--border2)',
            borderRadius: 'var(--radius)',
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          Meu painel
        </Link>
      </div>
    </div>
  )
}
