function SkeletonBlock({
  height,
  width = '100%',
}: {
  height: number
  width?: number | string
}) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius: 'var(--radius)',
      }}
    />
  )
}

export default function DashboardLoading() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg0)',
      color: 'var(--text1)',
      padding: '32px 24px 56px',
    }}>
      <div style={{ maxWidth: 1220, margin: '0 auto' }}>
        <header className="dashboard-header" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 24,
          alignItems: 'start',
          marginBottom: 28,
        }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <SkeletonBlock height={16} width={140} />
            <SkeletonBlock height={64} width="min(760px, 100%)" />
            <SkeletonBlock height={18} width="min(700px, 100%)" />
          </div>
          <div style={{ display: 'grid', gap: 12, justifyItems: 'end' }}>
            <SkeletonBlock height={28} width={92} />
            <SkeletonBlock height={40} width={88} />
          </div>
        </header>

        <section className="dashboard-hero-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 0.75fr',
          gap: 16,
          marginBottom: 16,
        }}>
          <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
            <div style={{ display: 'grid', gap: 14 }}>
              <SkeletonBlock height={28} width={120} />
              <SkeletonBlock height={56} width="85%" />
              <SkeletonBlock height={18} width="90%" />
              <SkeletonBlock height={12} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                <SkeletonBlock height={88} />
                <SkeletonBlock height={88} />
                <SkeletonBlock height={88} />
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
            <div style={{ display: 'grid', gap: 14 }}>
              <SkeletonBlock height={28} width={110} />
              <SkeletonBlock height={24} width="75%" />
              <SkeletonBlock height={184} />
            </div>
          </div>
        </section>

        <section className="dashboard-kpi-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 16,
          marginBottom: 16,
        }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              style={{
                background: 'var(--bg1)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 20,
              }}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <SkeletonBlock height={12} width={90} />
                <SkeletonBlock height={34} width={120} />
                <SkeletonBlock height={14} width="70%" />
              </div>
            </div>
          ))}
        </section>

        <section className="dashboard-main-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginBottom: 16,
        }}>
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              style={{
                background: 'var(--bg1)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
              }}
            >
              <div style={{ display: 'grid', gap: 12 }}>
                <SkeletonBlock height={28} width={140} />
                <SkeletonBlock height={24} width="60%" />
                <SkeletonBlock height={120} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
