import { fmt } from '@/lib/format'
import type { OfficeSimulationRecord } from '@/lib/accountant/server'

interface OfficeClientSimulationHistoryProps {
  simulations: OfficeSimulationRecord[]
}

export function OfficeClientSimulationHistory({ simulations }: OfficeClientSimulationHistoryProps) {
  if (simulations.length === 0) return null

  return (
    <section style={{ border: '1px solid var(--border)', background: 'var(--bg1)', borderRadius: 'var(--radius-lg)', padding: 22, marginTop: 16 }}>
      <h2 style={{ fontSize: 22, marginBottom: 14 }}>Histórico fiscal</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text3)', fontSize: 12, textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>Data</th>
              <th style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>Faturamento</th>
              <th style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>Projeção</th>
              <th style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>Anexo</th>
              <th style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>Economia</th>
            </tr>
          </thead>
          <tbody>
            {simulations.map(simulation => (
              <tr key={simulation.id}>
                <td style={{ padding: '13px 0', borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>
                  {new Intl.DateTimeFormat('pt-BR').format(new Date(simulation.created_at))}
                </td>
                <td style={{ padding: '13px 0', borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>
                  {fmt(simulation.entrada.faturamentoAcumulado)}
                </td>
                <td style={{ padding: '13px 0', borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>
                  {fmt(simulation.resultado.alertaTeto.projecaoAnual)}
                </td>
                <td style={{ padding: '13px 0', borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>
                  {simulation.resultado.anexoAtual}
                </td>
                <td style={{ padding: '13px 0', borderBottom: '1px solid var(--border)', color: 'var(--text2)' }}>
                  {fmt(simulation.resultado.comparativo.economiaVsMelhor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
