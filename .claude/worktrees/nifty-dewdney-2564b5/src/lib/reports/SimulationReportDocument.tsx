import React from 'react'
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ResultadoSimulacao } from '@/types/tributario'
import type { OportunidadeFiscal } from '@/lib/tributario'

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
  },
  muted: {
    color: '#6B7280',
    marginBottom: 12,
  },
  block: {
    marginBottom: 16,
    padding: 14,
    border: '1 solid #E5E7EB',
    borderRadius: 6,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  h2: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
  },
  listItem: {
    marginBottom: 6,
  },
})

export function SimulationReportDocument({
  email,
  resultado,
  oportunidades,
}: {
  email: string
  resultado: ResultadoSimulacao
  oportunidades: OportunidadeFiscal[]
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Relatório fiscal — SimulaMEI</Text>
        <Text style={styles.muted}>
          {email} · Gerado em {new Date(resultado.geradoEm).toLocaleString('pt-BR')}
        </Text>

        <View style={styles.block}>
          <Text style={styles.h2}>Resumo do cenário</Text>
          <View style={styles.row}>
            <Text>CNAE</Text>
            <Text>{resultado.entrada.cnae}</Text>
          </View>
          <View style={styles.row}>
            <Text>Faturamento acumulado</Text>
            <Text>R$ {resultado.entrada.faturamentoAcumulado.toLocaleString('pt-BR')}</Text>
          </View>
          <View style={styles.row}>
            <Text>Projeção anual</Text>
            <Text>R$ {resultado.alertaTeto.projecaoAnual.toLocaleString('pt-BR')}</Text>
          </View>
          <View style={styles.row}>
            <Text>Anexo atual</Text>
            <Text>{resultado.anexoAtual}</Text>
          </View>
          <View style={styles.row}>
            <Text>Melhor regime</Text>
            <Text>{resultado.comparativo.melhorRegime}</Text>
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.h2}>Oportunidades identificadas</Text>
          {oportunidades.length > 0 ? oportunidades.slice(0, 4).map(item => (
            <View key={item.id} style={{ marginBottom: 10 }}>
              <Text style={{ fontWeight: 700 }}>{item.titulo}</Text>
              <Text>{item.resumo}</Text>
            </View>
          )) : (
            <Text>Nenhuma oportunidade relevante calculada para o cenário atual.</Text>
          )}
        </View>

        <View style={styles.block}>
          <Text style={styles.h2}>Observação</Text>
          <Text style={styles.listItem}>
            Este relatório é uma estimativa técnica. Valide qualquer decisão tributária com contador habilitado.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
