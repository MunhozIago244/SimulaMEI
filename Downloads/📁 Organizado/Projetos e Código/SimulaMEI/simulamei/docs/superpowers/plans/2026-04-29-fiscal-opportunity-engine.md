# Fiscal Opportunity Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first complete vertical slice of the SimulaMEI fiscal opportunity engine and surface it on the main site.

**Architecture:** Keep the current tax engine intact and add a new `oportunidades` module that generates audit-ready opportunity cards from `ResultadoSimulacao`. The UI consumes those cards in the unlocked full result and in a new CNAE detail route. Official CNAE data remains separate from curated tax rules.

**Tech Stack:** Next.js 16.2.4, React 19.2.4, TypeScript strict, Vitest, local JSON official CNAE catalog, existing inline-style component pattern.

---

## Scope Check

The phrase "motor completo fiscal, tudo" includes multiple subsystems: tax rules, evidence, CNAE pages, paid reports, persistence, monthly monitor, payments, and accountant marketplace. This plan intentionally implements the first production-quality vertical slice:

- opportunity schema;
- Fator R opportunity;
- MEI ceiling opportunity;
- regime comparison opportunity;
- CNAE detail lookup;
- main-site opportunity panel;
- tests and documentation.

Supabase persistence, Stripe checkout, PDF generation, AI CNAE diagnosis, NFS-e integration, and accountant marketplace must be separate plans after this slice is stable.

---

## File Structure

Create:

- `src/lib/tributario/oportunidades/types.ts` — shared opportunity/evidence types.
- `src/lib/tributario/oportunidades/fontes.ts` — versioned source references used in opportunity cards.
- `src/lib/tributario/oportunidades/fatorR.ts` — Fator R opportunity rule.
- `src/lib/tributario/oportunidades/tetoMei.ts` — MEI ceiling risk rule.
- `src/lib/tributario/oportunidades/regimes.ts` — regime comparison opportunity rule.
- `src/lib/tributario/oportunidades/index.ts` — public aggregator.
- `src/lib/tributario/cnaeDetalhe.ts` — official CNAE detail helper.
- `src/components/resultado/OportunidadesFiscais.tsx` — result-page opportunity panel.
- `src/app/cnae/[codigo]/page.tsx` — CNAE detail page.
- `src/lib/tributario/oportunidades/__tests__/oportunidades.test.ts` — rule tests.

Modify:

- `src/lib/tributario/index.ts` — export opportunity engine.
- `src/components/resultado/FullResults.tsx` — render opportunity panel.
- `src/components/simulador/CnaeAutocomplete.tsx` — add link affordance in later UI polish task.
- `src/types/tributario.ts` — add small shared status types if needed.
- `docs/superpowers/specs/2026-04-29-cnae-opportunity-engine-design.md` — mark implemented slice.

---

### Task 1: Opportunity Types

**Files:**
- Create: `src/lib/tributario/oportunidades/types.ts`
- Test: `src/lib/tributario/oportunidades/__tests__/oportunidades.test.ts`

- [ ] **Step 1: Create the failing test for stable opportunity shape**

```ts
import { describe, expect, it } from 'vitest'
import type { OportunidadeFiscal } from '../types'

describe('oportunidades fiscais', () => {
  it('supports audit-ready opportunity cards', () => {
    const oportunidade: OportunidadeFiscal = {
      id: 'fator-r-minimo',
      tipo: 'fator_r',
      prioridade: 'alta',
      titulo: 'Ajuste de pró-labore pode ativar o Anexo III',
      resumo: 'A atividade é elegível ao Fator R e ainda está abaixo de 28%.',
      impactoEstimadoAnual: 8400,
      risco: 'medio',
      confianca: 'estimada',
      regraVersao: 'BR-MEI-SN-2026-04-28',
      acoes: ['Validar pró-labore com contador'],
      bloqueios: [],
      evidencias: [
        {
          fonteId: 'resolucao-cgsn-140-2018',
          titulo: 'Resolução CGSN nº 140/2018',
          url: 'https://www8.receita.fazenda.gov.br/SimplesNacional/',
          tipo: 'norma',
        },
      ],
    }

    expect(oportunidade.tipo).toBe('fator_r')
    expect(oportunidade.evidencias[0].tipo).toBe('norma')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm run test -- oportunidades.test.ts
```

Expected: TypeScript fails because `../types` does not exist.

- [ ] **Step 3: Add the opportunity types**

```ts
import type { Anexo } from '@/types/tributario'

export type TipoOportunidadeFiscal =
  | 'fator_r'
  | 'teto_mei'
  | 'comparativo_regime'
  | 'mei_caminhoneiro'
  | 'curadoria_pendente'

export type PrioridadeOportunidade = 'alta' | 'media' | 'baixa'
export type RiscoOportunidade = 'baixo' | 'medio' | 'alto' | 'critico'
export type ConfiancaOportunidade = 'oficial' | 'curada' | 'estimada' | 'pendente'

export interface EvidenciaFiscal {
  fonteId: string
  titulo: string
  url: string
  tipo: 'norma' | 'catalogo_oficial' | 'calculo' | 'curadoria'
  hashSha256?: string
  acessadoEm?: string
  observacao?: string
}

export interface OportunidadeFiscal {
  id: string
  tipo: TipoOportunidadeFiscal
  prioridade: PrioridadeOportunidade
  titulo: string
  resumo: string
  impactoEstimadoAnual: number
  risco: RiscoOportunidade
  confianca: ConfiancaOportunidade
  regraVersao: string
  anexoOrigem?: Anexo
  anexoDestino?: Anexo
  acoes: string[]
  bloqueios: string[]
  evidencias: EvidenciaFiscal[]
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npm run test -- oportunidades.test.ts
```

Expected: test file passes.

---

### Task 2: Evidence Sources

**Files:**
- Create: `src/lib/tributario/oportunidades/fontes.ts`
- Test: `src/lib/tributario/oportunidades/__tests__/oportunidades.test.ts`

- [ ] **Step 1: Add a failing test for source references**

Append:

```ts
import { FONTES_FISCAIS } from '../fontes'

it('keeps source references available for opportunity evidence', () => {
  expect(FONTES_FISCAIS.conclaCnae23.tipo).toBe('catalogo_oficial')
  expect(FONTES_FISCAIS.simplesNacionalLegislacao.tipo).toBe('norma')
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm run test -- oportunidades.test.ts
```

Expected: fails because `../fontes` does not exist.

- [ ] **Step 3: Add versioned source constants**

```ts
import catalogoOficial from '../../../../data/cnae/latest.json'
import type { EvidenciaFiscal } from './types'

export const FONTES_FISCAIS = {
  conclaCnae23: {
    fonteId: 'concla-ibge-cnae-2-3-subclasses',
    titulo: 'IBGE/CONCLA — CNAE 2.3 Subclasses',
    url: catalogoOficial.source.pageUrl,
    tipo: 'catalogo_oficial',
    hashSha256: catalogoOficial.source.hashSha256,
    acessadoEm: catalogoOficial.source.fetchedAt,
  },
  simplesNacionalLegislacao: {
    fonteId: 'simples-nacional-legislacao',
    titulo: 'Portal do Simples Nacional — legislação',
    url: 'https://www8.receita.fazenda.gov.br/SimplesNacional/ConteudoApoio/Legislacao/TelaLegislacao.aspx',
    tipo: 'norma',
  },
  resolucaoCgsn140: {
    fonteId: 'resolucao-cgsn-140-2018',
    titulo: 'Resolução CGSN nº 140/2018',
    url: 'https://www8.receita.fazenda.gov.br/SimplesNacional/',
    tipo: 'norma',
    observacao: 'Fonte normativa usada para tabelas e regras do Simples Nacional; manter monitoramento por ato oficial.',
  },
} satisfies Record<string, EvidenciaFiscal>
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npm run test -- oportunidades.test.ts
```

Expected: tests pass.

---

### Task 3: Fator R Opportunity Rule

**Files:**
- Create: `src/lib/tributario/oportunidades/fatorR.ts`
- Modify: `src/lib/tributario/oportunidades/__tests__/oportunidades.test.ts`

- [ ] **Step 1: Add failing test for Fator R opportunity**

Append:

```ts
import { gerarOportunidadeFatorR } from '../fatorR'
import { simular } from '../../index'

it('generates a Fator R opportunity when eligible CNAE is below 28 percent', () => {
  const resultado = simular({
    faturamentoAcumulado: 75_000,
    mesAtual: 6,
    cnae: '6201-5/01',
    folhaMensal: 2_000,
    tipoMei: 'geral',
  })

  const oportunidade = gerarOportunidadeFatorR(resultado)

  expect(oportunidade?.tipo).toBe('fator_r')
  expect(oportunidade?.impactoEstimadoAnual).toBeGreaterThan(0)
  expect(oportunidade?.acoes[0]).toContain('pró-labore')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- oportunidades.test.ts
```

Expected: fails because `../fatorR` does not exist.

- [ ] **Step 3: Implement Fator R rule**

```ts
import type { ResultadoSimulacao } from '@/types/tributario'
import { TAX_RULE_VERSION } from '../limitesMei'
import { calcularSimples } from '../simples'
import { FATOR_R_MINIMO } from '../fatorR'
import { FONTES_FISCAIS } from './fontes'
import type { OportunidadeFiscal } from './types'

export function gerarOportunidadeFatorR(
  resultado: ResultadoSimulacao,
): OportunidadeFiscal | null {
  const { fatorR, alertaTeto, entrada } = resultado
  if (!fatorR || fatorR.atingeMinimo) return null

  const rbt12 = alertaTeto.projecaoAnual
  const economia = Math.max(
    0,
    calcularSimples(rbt12, 'V').dasAnual - calcularSimples(rbt12, 'III').dasAnual,
  )
  if (economia <= 0) return null

  const faltaMensal = Math.max(0, fatorR.proLaboreMinimo - entrada.folhaMensal)

  return {
    id: 'fator-r-minimo',
    tipo: 'fator_r',
    prioridade: 'alta',
    titulo: 'Fator R pode reduzir a tributação para Anexo III',
    resumo: `Com Fator R abaixo de ${(FATOR_R_MINIMO * 100).toFixed(0)}%, este cenário permanece no Anexo V. Ajustar folha/pró-labore pode criar economia estimada.`,
    impactoEstimadoAnual: economia,
    risco: 'medio',
    confianca: 'estimada',
    regraVersao: TAX_RULE_VERSION,
    anexoOrigem: 'V',
    anexoDestino: 'III',
    acoes: [
      `Validar com contador se é possível aumentar pró-labore/folha em aproximadamente ${faltaMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} por mês.`,
      'Confirmar se a atividade exercida e o CNAE continuam elegíveis ao Fator R.',
      'Guardar memória de cálculo e documentos de folha/pró-labore.',
    ],
    bloqueios: faltaMensal > 0 ? [] : ['Faltam dados de folha/pró-labore para estimar o ajuste mensal.'],
    evidencias: [
      FONTES_FISCAIS.resolucaoCgsn140,
      {
        fonteId: 'calculo-fator-r',
        titulo: 'Cálculo interno do Fator R',
        url: 'internal:src/lib/tributario/fatorR.ts',
        tipo: 'calculo',
        observacao: 'Fator R = folha 12 meses / receita bruta 12 meses.',
      },
    ],
  }
}
```

- [ ] **Step 4: Run the test**

Run:

```bash
npm run test -- oportunidades.test.ts
```

Expected: tests pass.

---

### Task 4: MEI Ceiling Opportunity Rule

**Files:**
- Create: `src/lib/tributario/oportunidades/tetoMei.ts`
- Modify: `src/lib/tributario/oportunidades/__tests__/oportunidades.test.ts`

- [ ] **Step 1: Add failing tests for ceiling risk**

Append:

```ts
import { gerarOportunidadeTetoMei } from '../tetoMei'

it('generates a critical ceiling opportunity when projected revenue exceeds MEI ceiling by more than 20 percent', () => {
  const resultado = simular({
    faturamentoAcumulado: 54_000,
    mesAtual: 4,
    cnae: '6201-5/01',
    folhaMensal: 0,
    tipoMei: 'geral',
  })

  const oportunidade = gerarOportunidadeTetoMei(resultado)

  expect(oportunidade?.tipo).toBe('teto_mei')
  expect(oportunidade?.risco).toBe('critico')
  expect(oportunidade?.prioridade).toBe('alta')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- oportunidades.test.ts
```

Expected: fails because `../tetoMei` does not exist.

- [ ] **Step 3: Implement ceiling rule**

```ts
import type { ResultadoSimulacao } from '@/types/tributario'
import { TAX_RULE_VERSION } from '../limitesMei'
import { FONTES_FISCAIS } from './fontes'
import type { OportunidadeFiscal } from './types'

export function gerarOportunidadeTetoMei(
  resultado: ResultadoSimulacao,
): OportunidadeFiscal | null {
  const { alertaTeto } = resultado
  const uso = alertaTeto.percentualUtilizado
  const excesso = alertaTeto.percentualExcesso

  if (uso < 0.85 && excesso <= 0) return null

  const critico = excesso > 0.20
  const acimaDoTeto = excesso > 0

  return {
    id: critico ? 'teto-mei-excesso-grave' : acimaDoTeto ? 'teto-mei-excesso-leve' : 'teto-mei-alerta',
    tipo: 'teto_mei',
    prioridade: critico || acimaDoTeto ? 'alta' : 'media',
    titulo: critico
      ? 'Projeção indica excesso grave do teto MEI'
      : acimaDoTeto
        ? 'Projeção indica excesso dentro da faixa de atenção'
        : 'Projeção próxima ao teto MEI',
    resumo: `A projeção anual está em ${alertaTeto.projecaoAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} para teto de ${alertaTeto.tetoAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}.`,
    impactoEstimadoAnual: 0,
    risco: critico ? 'critico' : acimaDoTeto ? 'alto' : 'medio',
    confianca: 'estimada',
    regraVersao: TAX_RULE_VERSION,
    acoes: [
      'Revisar faturamento acumulado e notas emitidas no ano.',
      'Simular cenário de desenquadramento de MEI para ME.',
      'Validar prazo e forma de comunicação com contador.',
    ],
    bloqueios: [],
    evidencias: [
      FONTES_FISCAIS.simplesNacionalLegislacao,
      {
        fonteId: 'calculo-alerta-teto',
        titulo: 'Cálculo interno de projeção de teto MEI',
        url: 'internal:src/lib/tributario/alertas.ts',
        tipo: 'calculo',
      },
    ],
  }
}
```

- [ ] **Step 4: Run test**

Run:

```bash
npm run test -- oportunidades.test.ts
```

Expected: tests pass.

---

### Task 5: Regime Comparison Opportunity Rule

**Files:**
- Create: `src/lib/tributario/oportunidades/regimes.ts`
- Modify: `src/lib/tributario/oportunidades/__tests__/oportunidades.test.ts`

- [ ] **Step 1: Add failing test for regime savings**

Append:

```ts
import { gerarOportunidadeRegime } from '../regimes'

it('generates a regime comparison opportunity when another regime is cheaper', () => {
  const resultado = simular({
    faturamentoAcumulado: 150_000,
    mesAtual: 6,
    cnae: '6201-5/01',
    folhaMensal: 0,
    tipoMei: 'geral',
  })

  const oportunidade = gerarOportunidadeRegime(resultado)

  expect(oportunidade?.tipo).toBe('comparativo_regime')
  expect(oportunidade?.evidencias.length).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- oportunidades.test.ts
```

Expected: fails because `../regimes` does not exist.

- [ ] **Step 3: Implement regime comparison rule**

```ts
import type { ResultadoSimulacao } from '@/types/tributario'
import { TAX_RULE_VERSION } from '../limitesMei'
import { FONTES_FISCAIS } from './fontes'
import type { OportunidadeFiscal } from './types'

const REGIME_LABEL: Record<ResultadoSimulacao['comparativo']['melhorRegime'], string> = {
  simplesAtual: 'Simples Nacional atual',
  simplexOtimo: 'Simples Nacional otimizado',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
}

export function gerarOportunidadeRegime(
  resultado: ResultadoSimulacao,
): OportunidadeFiscal | null {
  const economia = resultado.comparativo.economiaVsMelhor
  if (economia <= 0) return null

  const melhor = resultado.comparativo.melhorRegime

  return {
    id: 'comparativo-regime-economia',
    tipo: 'comparativo_regime',
    prioridade: economia >= 5000 ? 'alta' : 'media',
    titulo: `${REGIME_LABEL[melhor]} pode ser mais econômico neste cenário`,
    resumo: `O comparativo estimou economia anual de ${economia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} em relação ao custo atual simulado.`,
    impactoEstimadoAnual: economia,
    risco: 'medio',
    confianca: 'estimada',
    regraVersao: TAX_RULE_VERSION,
    acoes: [
      'Validar premissas de margem, folha e tipo de serviço antes de decidir.',
      'Conferir efeitos de ISS, retenções e obrigações acessórias.',
      'Usar o resultado como triagem para conversa com contador.',
    ],
    bloqueios: [],
    evidencias: [
      FONTES_FISCAIS.resolucaoCgsn140,
      {
        fonteId: 'calculo-comparativo-regimes',
        titulo: 'Comparativo interno entre Simples, Presumido e Real',
        url: 'internal:src/lib/tributario/index.ts',
        tipo: 'calculo',
      },
    ],
  }
}
```

- [ ] **Step 4: Run test**

Run:

```bash
npm run test -- oportunidades.test.ts
```

Expected: tests pass.

---

### Task 6: Opportunity Aggregator

**Files:**
- Create: `src/lib/tributario/oportunidades/index.ts`
- Modify: `src/lib/tributario/index.ts`
- Modify: `src/lib/tributario/oportunidades/__tests__/oportunidades.test.ts`

- [ ] **Step 1: Add failing aggregator test**

Append:

```ts
import { gerarOportunidadesFiscais } from '../index'

it('aggregates opportunities ordered by priority and impact', () => {
  const resultado = simular({
    faturamentoAcumulado: 75_000,
    mesAtual: 6,
    cnae: '6201-5/01',
    folhaMensal: 2_000,
    tipoMei: 'geral',
  })

  const oportunidades = gerarOportunidadesFiscais(resultado)

  expect(oportunidades.length).toBeGreaterThan(0)
  expect(oportunidades[0].prioridade).toBe('alta')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test -- oportunidades.test.ts
```

Expected: fails because aggregator is not implemented or exported.

- [ ] **Step 3: Implement aggregator**

```ts
import type { ResultadoSimulacao } from '@/types/tributario'
import { gerarOportunidadeFatorR } from './fatorR'
import { gerarOportunidadeRegime } from './regimes'
import { gerarOportunidadeTetoMei } from './tetoMei'
import type { OportunidadeFiscal } from './types'

const PESO_PRIORIDADE: Record<OportunidadeFiscal['prioridade'], number> = {
  alta: 3,
  media: 2,
  baixa: 1,
}

export function gerarOportunidadesFiscais(
  resultado: ResultadoSimulacao,
): OportunidadeFiscal[] {
  return [
    gerarOportunidadeTetoMei(resultado),
    gerarOportunidadeFatorR(resultado),
    gerarOportunidadeRegime(resultado),
  ]
    .filter((item): item is OportunidadeFiscal => Boolean(item))
    .sort((a, b) => {
      const prioridade = PESO_PRIORIDADE[b.prioridade] - PESO_PRIORIDADE[a.prioridade]
      if (prioridade !== 0) return prioridade
      return b.impactoEstimadoAnual - a.impactoEstimadoAnual
    })
}

export type { EvidenciaFiscal, OportunidadeFiscal } from './types'
```

- [ ] **Step 4: Export from tax engine index**

Add to `src/lib/tributario/index.ts`:

```ts
export { gerarOportunidadesFiscais } from './oportunidades'
export type { EvidenciaFiscal, OportunidadeFiscal } from './oportunidades'
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test
```

Expected: all tests pass.

---

### Task 7: CNAE Detail Helper

**Files:**
- Create: `src/lib/tributario/cnaeDetalhe.ts`
- Create or modify test: `src/lib/tributario/__tests__/tributario.test.ts`

- [ ] **Step 1: Add failing test**

Append to `src/lib/tributario/__tests__/tributario.test.ts`:

```ts
import { getCnaeDetalhe } from '../cnaeDetalhe'

it('returns official CNAE detail with tax curation status', () => {
  const detalhe = getCnaeDetalhe('0111-3/01')

  expect(detalhe?.descricao).toBe('Cultivo de arroz')
  expect(detalhe?.classificacaoTributaria).toBe('pendente')
  expect(detalhe?.hierarquia.secao).toBe('A')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test
```

Expected: fails because `cnaeDetalhe.ts` does not exist.

- [ ] **Step 3: Implement detail helper**

```ts
import catalogoOficial from '../../../data/cnae/latest.json'
import { getCnae } from './cnae'

interface CnaeOficialRecord {
  cnae: string
  descricao: string
  secao: string
  divisao: string
  grupo: string
  classe: string
}

export interface CnaeDetalhe {
  cnae: string
  descricao: string
  classificacaoTributaria: 'curada' | 'pendente'
  hierarquia: {
    secao: string
    divisao: string
    grupo: string
    classe: string
  }
  fonte: {
    nome: string
    url: string
    hashSha256: string
    fetchedAt: string
  }
  perfilTributario: ReturnType<typeof getCnae> | null
}

const CNAES_OFICIAIS = catalogoOficial.records as CnaeOficialRecord[]

export function getCnaeDetalhe(codigo: string): CnaeDetalhe | null {
  const normalizado = codigo.trim()
  const oficial = CNAES_OFICIAIS.find(item => item.cnae === normalizado)
  if (!oficial) return null

  const perfilTributario = getCnae(normalizado) ?? null

  return {
    cnae: oficial.cnae,
    descricao: oficial.descricao,
    classificacaoTributaria: perfilTributario ? 'curada' : 'pendente',
    hierarquia: {
      secao: oficial.secao,
      divisao: oficial.divisao,
      grupo: oficial.grupo,
      classe: oficial.classe,
    },
    fonte: {
      nome: catalogoOficial.source.name,
      url: catalogoOficial.source.pageUrl,
      hashSha256: catalogoOficial.source.hashSha256,
      fetchedAt: catalogoOficial.source.fetchedAt,
    },
    perfilTributario,
  }
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test
```

Expected: all tests pass.

---

### Task 8: Opportunity Panel UI

**Files:**
- Create: `src/components/resultado/OportunidadesFiscais.tsx`
- Modify: `src/components/resultado/FullResults.tsx`

- [ ] **Step 1: Create panel component**

```tsx
'use client'

import type { OportunidadeFiscal } from '@/lib/tributario'
import { fmt } from '@/lib/format'
import { Badge } from '@/components/ui'

interface OportunidadesFiscaisProps {
  oportunidades: OportunidadeFiscal[]
}

const PRIORIDADE_COLOR: Record<OportunidadeFiscal['prioridade'], string> = {
  alta: 'var(--lime)',
  media: 'var(--yellow)',
  baixa: 'var(--blue)',
}

export function OportunidadesFiscais({ oportunidades }: OportunidadesFiscaisProps) {
  if (oportunidades.length === 0) {
    return (
      <section style={{
        background: 'var(--bg1)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '28px 32px', marginBottom: 28,
      }}>
        <Badge color="var(--blue)">Diagnóstico fiscal</Badge>
        <h3 style={{ fontSize: 20, fontWeight: 800, margin: '12px 0 6px' }}>
          Nenhuma oportunidade relevante encontrada
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
          O cenário atual não gerou alerta relevante no motor. Continue monitorando faturamento, folha e mudanças oficiais.
        </p>
      </section>
    )
  }

  const impactoTotal = oportunidades.reduce((sum, item) => sum + item.impactoEstimadoAnual, 0)

  return (
    <section style={{
      background: 'var(--bg1)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '30px 34px', marginBottom: 28,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start', marginBottom: 24 }}>
        <div>
          <Badge color="var(--lime)">Motor de oportunidades</Badge>
          <h3 style={{ fontSize: 22, fontWeight: 800, margin: '12px 0 6px' }}>
            Oportunidades fiscais encontradas
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            Estimativas para triagem. Valide a execução com contador antes de alterar regime, folha ou enquadramento.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Impacto estimado</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 26, color: 'var(--lime)', fontWeight: 800 }}>
            {impactoTotal > 0 ? `${fmt(impactoTotal)}/ano` : 'Risco'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {oportunidades.map(oportunidade => (
          <article
            key={oportunidade.id}
            style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '18px 20px',
            }}
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              <Badge color={PRIORIDADE_COLOR[oportunidade.prioridade]}>
                {oportunidade.prioridade.toUpperCase()}
              </Badge>
              <Badge color="var(--blue)">{oportunidade.confianca}</Badge>
              <Badge color="var(--text3)">{oportunidade.regraVersao}</Badge>
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>
              {oportunidade.titulo}
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 14 }}>
              {oportunidade.resumo}
            </p>
            {oportunidade.impactoEstimadoAnual > 0 && (
              <div style={{ fontFamily: 'var(--mono)', color: 'var(--lime)', fontWeight: 800, marginBottom: 12 }}>
                {fmt(oportunidade.impactoEstimadoAnual)} por ano de impacto estimado
              </div>
            )}
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text2)', fontSize: 13, lineHeight: 1.7 }}>
              {oportunidade.acoes.map(acao => (
                <li key={acao}>{acao}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire into full results**

In `FullResults.tsx`, import:

```ts
import { gerarOportunidadesFiscais } from '@/lib/tributario'
import { OportunidadesFiscais } from './OportunidadesFiscais'
```

Inside component after `scoreEstado`, add:

```ts
const oportunidades = gerarOportunidadesFiscais(resultado)
```

Render before the regime comparison block:

```tsx
<OportunidadesFiscais oportunidades={oportunidades} />
```

- [ ] **Step 3: Run lint and build**

Run:

```bash
npm run lint
npm run build
```

Expected: both pass.

---

### Task 9: CNAE Detail Page

**Files:**
- Create: `src/app/cnae/[codigo]/page.tsx`

- [ ] **Step 1: Create CNAE detail route**

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCnaeDetalhe } from '@/lib/tributario/cnaeDetalhe'

interface PageProps {
  params: Promise<{ codigo: string }>
}

export default async function CnaePage({ params }: PageProps) {
  const { codigo } = await params
  const detalhe = getCnaeDetalhe(decodeURIComponent(codigo))
  if (!detalhe) notFound()

  const curado = detalhe.classificacaoTributaria === 'curada'

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg0)', color: 'var(--text1)', padding: '48px 24px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <Link href="/#simulador" style={{ color: 'var(--lime)', fontSize: 13, textDecoration: 'none' }}>
          Voltar ao simulador
        </Link>

        <section style={{ marginTop: 28, marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--mono)', color: 'var(--text3)', fontSize: 13 }}>{detalhe.cnae}</div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 64px)', lineHeight: 1, margin: '10px 0 16px' }}>
            {detalhe.descricao}
          </h1>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: curado ? 'var(--lime)' : 'var(--yellow)' }}>
              {curado ? 'Tributação curada' : 'Curadoria tributária pendente'}
            </span>
            <span style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text2)' }}>
              Fonte oficial IBGE/CONCLA
            </span>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {Object.entries(detalhe.hierarquia).map(([label, value]) => (
            <div key={label} style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 800 }}>{value}</div>
            </div>
          ))}
        </section>

        <section style={{ background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
          <h2 style={{ fontSize: 22, marginBottom: 10 }}>Status fiscal</h2>
          {curado && detalhe.perfilTributario ? (
            <p style={{ color: 'var(--text2)', lineHeight: 1.7 }}>
              Este CNAE possui curadoria no SimulaMEI. Anexo padrão: <b>Anexo {detalhe.perfilTributario.anexoPadrao}</b>.
              {detalhe.perfilTributario.elegivelFatorR ? ' Elegível ao Fator R.' : ' Fator R não marcado para este perfil.'}
            </p>
          ) : (
            <p style={{ color: 'var(--text2)', lineHeight: 1.7 }}>
              Este CNAE existe na base oficial, mas ainda não possui classificação tributária validada no SimulaMEI.
              A simulação completa fica bloqueada até haver curadoria de Anexo, MEI e Fator R.
            </p>
          )}
          <div style={{ marginTop: 18, fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
            Fonte: <a href={detalhe.fonte.url} style={{ color: 'var(--lime)' }}>{detalhe.fonte.nome}</a><br />
            Hash: <span style={{ fontFamily: 'var(--mono)' }}>{detalhe.fonte.hashSha256.slice(0, 16)}...</span>
          </div>
        </section>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: route `/cnae/[codigo]` appears in Next route output and build passes.

---

### Task 10: Documentation and Verification

**Files:**
- Modify: `docs/superpowers/specs/2026-04-29-cnae-opportunity-engine-design.md`
- Modify: `C:\Users\iagom\OneDrive\Documentos\Obsidian Vault\SimulaMEI\16 - Motor de Oportunidades Fiscais e Auditoria Atual.md`

- [ ] **Step 1: Add implementation note to spec**

Append:

```md
## Implementation Slice 1

The first implementation slice includes:

- typed fiscal opportunities;
- source/evidence references;
- Fator R opportunity rule;
- MEI ceiling opportunity rule;
- regime comparison opportunity rule;
- opportunity panel in the unlocked result page;
- CNAE detail helper and route.

Out of scope for this slice:

- payments;
- PDF generation;
- Supabase persistence;
- automated accountant review workflow;
- AI CNAE diagnosis;
- NFS-e integration.
```

- [ ] **Step 2: Add execution status to Obsidian note**

Append to the Obsidian note:

```md
## Status de Implementação

### Slice 1 — Motor de oportunidades no site principal

Status: em implementação.

Escopo:

- oportunidades de Fator R;
- oportunidades de teto MEI;
- oportunidades de comparativo de regimes;
- ficha de CNAE;
- painel de oportunidades no resultado completo.
```

- [ ] **Step 3: Run final verification**

Run:

```bash
npm run cnae:check
npm run test
npm run lint
npm run build
```

Expected:

- CNAE check reports `Diff: +0 / -0 / ~0`;
- all tests pass;
- lint exits with code 0;
- build exits with code 0.

---

## Self-Review

- Spec coverage: this plan covers the first vertical slice of the documented opportunity engine. Persistence, payments, reports, AI, and marketplace are intentionally separate follow-up plans.
- Placeholder scan: no `TBD`, `TODO`, or unspecified implementation steps remain.
- Type consistency: opportunity field names are consistent across `types.ts`, rule files, UI component, and tests.
- Known environment note: the project directory is not currently a git repository, so commit steps are omitted. If git is initialized later, commit after each task with a focused message.
