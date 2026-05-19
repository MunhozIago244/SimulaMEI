# Relatório PDF Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Padronizar o preço do relatório em R$ 9,90, enriquecer o conteúdo/template do PDF, e adicionar preview com dados reais + marca d'água que libera o PDF limpo ao pagar.

**Architecture:** Fonte única de preço (`pricing.ts`) e de acesso (`report-access.ts`), ambas TDD-puras. Um único `SimulationReportDocument` dirigido por `variant: 'full' | 'preview'` (marca d'água server-side); as 3 rotas de PDF passam a usá-lo. Reusa helpers já entregues (`resultadoVisibilidade`, `buildRegimePreview`, `getLegalIdentity`, `usoTetoPercent`, `FONTES_FISCAIS`).

**Tech Stack:** Next.js App Router, TypeScript, @react-pdf/renderer, vitest (co-located `.test.ts`), Stripe.

---

## File Structure

- `src/constants/pricing.ts` (novo) — fonte única de preço do relatório + `formatBRL`.
- `src/lib/auth/report-access.ts` (novo) — `hasReportAccess` puro (substitui 4 cópias).
- `src/lib/reports/SimulationReportDocument.tsx` (reescrito) — template único, `variant`, helpers `resolveHeadingFont`/`reportWatermark`.
- `src/lib/stripe.ts`, `src/app/relatorio/page.tsx`, `src/app/dashboard/relatorio/page.tsx` — consomem `pricing.ts`.
- `src/app/api/relatorio-premium/route.ts`, `src/app/api/relatorio/gerar/route.ts` — usam o componente + `hasReportAccess`.
- `.env.example` — nota da pendência do Stripe Price.
- Testes co-locados `.test.ts` por unidade pura.

---

## Task 1: Fonte única de preço

**Files:**
- Create: `src/constants/pricing.ts`
- Create: `src/constants/pricing.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/constants/pricing.test.ts
import { describe, expect, it } from 'vitest'
import { REPORT_PRICE_CENTAVOS, REPORT_PRICE_BRL, REPORT_PRICE_LABEL, formatBRL } from './pricing'

describe('pricing', () => {
  it('fixa o preço do relatório em R$ 9,90', () => {
    expect(REPORT_PRICE_CENTAVOS).toBe(990)
    expect(REPORT_PRICE_BRL).toBe(9.9)
    expect(REPORT_PRICE_LABEL).toBe('R$ 9,90')
  })

  it('formata centavos como BRL pt-BR', () => {
    expect(formatBRL(990)).toBe('R$ 9,90')
    expect(formatBRL(2900)).toBe('R$ 29,00')
    expect(formatBRL(0)).toBe('R$ 0,00')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/constants/pricing.test.ts`
Expected: FAIL — `Cannot find module './pricing'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/constants/pricing.ts
export const REPORT_PRICE_CENTAVOS = 990
export const REPORT_PRICE_BRL = 9.9
export const REPORT_PRICE_LABEL = 'R$ 9,90'

/** Formata centavos como moeda BRL (ex.: 990 -> "R$ 9,90"). */
export function formatBRL(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/constants/pricing.test.ts`
Expected: PASS (2)

- [ ] **Step 5: Commit**

```bash
git add src/constants/pricing.ts src/constants/pricing.test.ts
git commit -m "feat(pricing): fonte única do preço do relatório (R$ 9,90)"
```

---

## Task 2: Consumir pricing.ts (stripe + UI) e reconciliar testes

**Files:**
- Modify: `src/lib/stripe.ts:10`
- Modify: `src/app/relatorio/page.tsx:59`
- Modify: `src/app/dashboard/relatorio/page.tsx:14` (e a narrativa do ValueComparisonCard)
- Modify: `src/app/api/checkout/report/route.test.ts:19`

- [ ] **Step 1: Atualizar stripe.ts**

Em `src/lib/stripe.ts`, adicionar import no topo e trocar o literal:

```typescript
import { REPORT_PRICE_CENTAVOS } from '@/constants/pricing'
```

Trocar `valorCentavos: 2900,` (linha do bloco `relatorio:`) por:

```typescript
    valorCentavos: REPORT_PRICE_CENTAVOS,
```

- [ ] **Step 2: Atualizar relatorio/page.tsx**

Em `src/app/relatorio/page.tsx`, importar e trocar o "R$ 29" hardcoded:

```typescript
import { REPORT_PRICE_LABEL } from '@/constants/pricing'
```

Trocar `<strong style={{ color: 'var(--text1)' }}>R$ 29</strong>` por:

```tsx
<strong style={{ color: 'var(--text1)' }}>{REPORT_PRICE_LABEL}</strong>
```

- [ ] **Step 3: Atualizar dashboard/relatorio/page.tsx + framing**

Em `src/app/dashboard/relatorio/page.tsx`:

```typescript
import { REPORT_PRICE_BRL } from '@/constants/pricing'
```

Trocar `const REPORT_PRICE = 29` por:

```typescript
const REPORT_PRICE = REPORT_PRICE_BRL
```

Na linha ~220, a narrativa `Ilimitado · {Math.round(((REPORT_PRICE - PRO_PRICE) / REPORT_PRICE) * 100)}% mais barato/mês` produz número sem sentido a R$ 9,90 avulso vs Pro mensal. Substituir o texto por comparação volume-based honesta:

```tsx
Ilimitado no Pro · avulso sai {REPORT_PRICE_LABEL}/relatório
```

(importar `REPORT_PRICE_LABEL` junto). Se `ValueComparisonCard` (linha ~240) renderizar a mesma `%`, ajustar para exibir "avulso {label}/relatório vs Pro ilimitado/mês" sem cálculo de porcentagem.

- [ ] **Step 4: Reconciliar o teste do checkout**

Em `src/app/api/checkout/report/route.test.ts`, a expectativa `valorCentavos: 4900` (linha ~19) está divergente. Trocar para:

```typescript
      valorCentavos: 990,
```

- [ ] **Step 5: Run typecheck + suíte afetada**

Run: `npx tsc --noEmit 2>&1 | grep -E "stripe|relatorio|checkout/report" ; npx vitest run src/app/api/checkout/report/route.test.ts`
Expected: sem erros de tipo nos arquivos tocados; teste do checkout PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/stripe.ts src/app/relatorio/page.tsx src/app/dashboard/relatorio/page.tsx src/app/api/checkout/report/route.test.ts
git commit -m "feat(pricing): consome fonte única R$ 9,90 + corrige framing comparativo"
```

---

## Task 3: hasReportAccess centralizado

**Files:**
- Create: `src/lib/auth/report-access.ts`
- Create: `src/lib/auth/report-access.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/auth/report-access.test.ts
import { describe, expect, it } from 'vitest'
import { hasReportAccess } from './report-access'

describe('hasReportAccess', () => {
  it('libera para plano pro', () => {
    expect(hasReportAccess('pro', 0)).toBe(true)
  })
  it('libera quando há ao menos uma compra', () => {
    expect(hasReportAccess('free', 1)).toBe(true)
    expect(hasReportAccess(null, 2)).toBe(true)
  })
  it('bloqueia free/null sem compra', () => {
    expect(hasReportAccess('free', 0)).toBe(false)
    expect(hasReportAccess(null, 0)).toBe(false)
    expect(hasReportAccess(undefined, 0)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/auth/report-access.test.ts`
Expected: FAIL — `Cannot find module './report-access'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/auth/report-access.ts
/** Acesso ao relatório completo: plano pro OU ao menos 1 compra paga. */
export function hasReportAccess(
  plan: string | null | undefined,
  purchasesCount: number,
): boolean {
  return plan === 'pro' || purchasesCount > 0
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/auth/report-access.test.ts`
Expected: PASS (3)

- [ ] **Step 5: Substituir as 4 cópias**

Em cada arquivo, importar `import { hasReportAccess } from '@/lib/auth/report-access'` e trocar a expressão inline:

- `src/app/api/relatorio/gerar/route.ts:39` — `const hasAccess = profile?.plano === 'pro' || (purchases?.length ?? 0) > 0` → `const hasAccess = hasReportAccess(profile?.plano, purchases?.length ?? 0)`
- `src/app/api/relatorio-premium/route.ts:231` — idem.
- `src/app/relatorio/page.tsx:31` — idem.
- `src/app/dashboard/relatorio/page.tsx:54` — `const hasAccess = ctx.plan === 'pro' || (purchases?.length ?? 0) > 0` → `const hasAccess = hasReportAccess(ctx.plan, purchases?.length ?? 0)`

- [ ] **Step 6: Run typecheck + suíte**

Run: `npx tsc --noEmit 2>&1 | grep -E "report-access|relatorio|relatorio-premium" ; npx vitest run`
Expected: sem erro de tipo nos tocados; suíte sem novas falhas (1 falha pré-existente `/api/simular` aceitável).

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth/report-access.ts src/lib/auth/report-access.test.ts src/app/api/relatorio/gerar/route.ts src/app/api/relatorio-premium/route.ts src/app/relatorio/page.tsx src/app/dashboard/relatorio/page.tsx
git commit -m "refactor(auth): hasReportAccess centralizado (dedup das 4 cópias)"
```

---

## Task 4: Helpers do template (variant + fonte) — TDD

**Files:**
- Create: `src/lib/reports/reportTemplate.ts`
- Create: `src/lib/reports/reportTemplate.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/reports/reportTemplate.test.ts
import { describe, expect, it } from 'vitest'
import { reportWatermark, resolveHeadingFont } from './reportTemplate'

describe('reportWatermark', () => {
  it('marca AMOSTRA só no preview', () => {
    expect(reportWatermark('preview')).toBe('AMOSTRA')
    expect(reportWatermark('full')).toBeNull()
  })
})

describe('resolveHeadingFont', () => {
  it('usa a fonte de marca quando o registro deu certo, senão Helvetica', () => {
    expect(resolveHeadingFont(true)).toBe('SpaceGrotesk')
    expect(resolveHeadingFont(false)).toBe('Helvetica')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/reports/reportTemplate.test.ts`
Expected: FAIL — `Cannot find module './reportTemplate'`

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/reports/reportTemplate.ts
export type ReportVariant = 'full' | 'preview'

/** Texto da marca d'água: só no preview. */
export function reportWatermark(variant: ReportVariant): string | null {
  return variant === 'preview' ? 'AMOSTRA' : null
}

/** Fonte de título: marca se o Font.register funcionou, senão Helvetica. */
export function resolveHeadingFont(registerOk: boolean): string {
  return registerOk ? 'SpaceGrotesk' : 'Helvetica'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/reports/reportTemplate.test.ts`
Expected: PASS (2)

- [ ] **Step 5: Commit**

```bash
git add src/lib/reports/reportTemplate.ts src/lib/reports/reportTemplate.test.ts
git commit -m "feat(reports): helpers de variant/fonte do template (TDD)"
```

---

## Task 5: Reescrever SimulationReportDocument (template único + variant + conteúdo)

**Files:**
- Modify (rewrite): `src/lib/reports/SimulationReportDocument.tsx`

Decisões de implementação (locked):
- Gráfico de barras = barras com `<View>` (largura em %) — robusto no react-pdf (sem Svg).
- `Font.register` Space Grotesk via URL gstatic, em try/catch no módulo; `REGISTER_OK` decide `resolveHeadingFont`.
- Marca d'água: `<View fixed>` rotacionado, baixa opacidade, em todas as páginas quando `variant='preview'`.
- Seções tributárias suprimidas se CNAE pendente via `resultadoVisibilidade` (reuso TASK-4).

- [ ] **Step 1: Reescrever o componente (código completo)**

```tsx
// src/lib/reports/SimulationReportDocument.tsx
import React from 'react'
import { Document, Page, StyleSheet, Text, View, Font } from '@react-pdf/renderer'
import type { ResultadoSimulacao } from '@/types/tributario'
import type { OportunidadeFiscal } from '@/lib/tributario'
import { getCnae, TAX_RULE_VERSION } from '@/lib/tributario'
import { FONTES_FISCAIS } from '@/lib/tributario/oportunidades/fontes'
import { resultadoVisibilidade } from '@/components/resultado/CnaePendenteNotice'
import { buildRegimePreview } from '@/components/resultado/RegimePreviewLocked'
import { usoTetoPercent } from '@/components/simulador/usoTeto'
import { getLegalIdentity } from '@/constants/site'
import { formatBRL } from '@/constants/pricing'
import { reportWatermark, resolveHeadingFont, type ReportVariant } from './reportTemplate'

let REGISTER_OK = false
try {
  Font.register({
    family: 'SpaceGrotesk',
    src: 'https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj62UXskPMBBSSJLm2E.ttf',
  })
  REGISTER_OK = true
} catch {
  REGISTER_OK = false
}

const HEAD = resolveHeadingFont(REGISTER_OK)
const INK = '#0F1B14'
const LIME = '#5B7F1F'
const MUTED = '#6B7280'
const BORDER = '#E5E7EB'

const styles = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 56, paddingHorizontal: 0, fontSize: 10, fontFamily: 'Helvetica', color: INK },
  headerBand: { backgroundColor: INK, color: '#FFFFFF', padding: 28, marginBottom: 18 },
  brand: { fontSize: 18, fontFamily: HEAD, fontWeight: 700 },
  brandLime: { color: '#C8F135' },
  headSub: { fontSize: 9, color: '#C9D2CC', marginTop: 6 },
  body: { paddingHorizontal: 28 },
  h2: { fontSize: 13, fontFamily: HEAD, fontWeight: 700, marginBottom: 8, color: INK },
  block: { marginBottom: 16, padding: 14, border: `1 solid ${BORDER}`, borderRadius: 6 },
  row: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowK: { color: MUTED },
  rowV: { fontWeight: 700 },
  barRow: { display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  barLabel: { width: 110, fontSize: 9 },
  barTrack: { flexGrow: 1, height: 10, backgroundColor: '#F1F3F0', borderRadius: 3 },
  barFill: { height: 10, borderRadius: 3, backgroundColor: '#9CB4C0' },
  barBest: { backgroundColor: LIME },
  oppTitle: { fontWeight: 700, marginBottom: 2 },
  opp: { marginBottom: 8 },
  footer: { position: 'absolute', bottom: 20, left: 28, right: 28, fontSize: 8, color: MUTED, display: 'flex', flexDirection: 'row', justifyContent: 'space-between' },
  wm: { position: 'absolute', top: '42%', left: '8%', fontSize: 64, color: '#000000', opacity: 0.07, transform: 'rotate(-28deg)' },
})

export function SimulationReportDocument({
  email,
  resultado,
  oportunidades,
  variant = 'full',
}: {
  email: string
  resultado: ResultadoSimulacao
  oportunidades: OportunidadeFiscal[]
  variant?: ReportVariant
}) {
  const legal = getLegalIdentity()
  const wm = reportWatermark(variant)
  const classificacao = getCnae(resultado.entrada.cnae)?.classificacaoTributaria
  const vis = resultadoVisibilidade(classificacao)
  const pctTeto = usoTetoPercent(resultado.alertaTeto.projecaoAnual, resultado.alertaTeto.tetoAnual)
  const bars = vis.mostrarTributacao ? buildRegimePreview(resultado.comparativo) : []

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {wm && <Text style={styles.wm} fixed>{wm}</Text>}

        <View style={styles.headerBand}>
          <Text style={styles.brand}>Simula<Text style={styles.brandLime}>MEI</Text> — Relatório fiscal</Text>
          <Text style={styles.headSub}>
            {email} · Gerado em {new Date(resultado.geradoEm).toLocaleString('pt-BR')} · Motor {TAX_RULE_VERSION.replace('BR-MEI-SN-', 'v')}
          </Text>
          <Text style={styles.headSub}>{legal.line}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.block}>
            <Text style={styles.h2}>Resumo do cenário</Text>
            <View style={styles.row}><Text style={styles.rowK}>CNAE</Text><Text style={styles.rowV}>{resultado.entrada.cnae}</Text></View>
            <View style={styles.row}><Text style={styles.rowK}>Faturamento acumulado</Text><Text style={styles.rowV}>R$ {resultado.entrada.faturamentoAcumulado.toLocaleString('pt-BR')}</Text></View>
            <View style={styles.row}><Text style={styles.rowK}>Projeção anual</Text><Text style={styles.rowV}>R$ {resultado.alertaTeto.projecaoAnual.toLocaleString('pt-BR')}</Text></View>
            <View style={styles.row}><Text style={styles.rowK}>Uso do teto</Text><Text style={styles.rowV}>{pctTeto.toFixed(0)}%</Text></View>
            {vis.mostrarTributacao && (
              <View style={styles.row}><Text style={styles.rowK}>Anexo atual</Text><Text style={styles.rowV}>{resultado.anexoAtual}</Text></View>
            )}
          </View>

          {vis.mostrarTributacao ? (
            <View style={styles.block}>
              <Text style={styles.h2}>Comparativo de regimes</Text>
              {bars.map(b => (
                <View key={b.label} style={styles.barRow}>
                  <Text style={styles.barLabel}>{b.label}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, b.melhor ? styles.barBest : {}, { width: `${Math.max(b.pct, 4)}%` }]} />
                  </View>
                </View>
              ))}
              <Text style={{ fontSize: 8, color: MUTED, marginTop: 4 }}>Barra menor = menor custo. Verde = regime mais barato.</Text>
            </View>
          ) : (
            <View style={styles.block}>
              <Text style={styles.h2}>Anexo e Fator R indisponíveis</Text>
              <Text>Teto e projeção acima são exatos. Este CNAE é oficial mas ainda sem curadoria tributária — Anexo, alíquota e Fator R não são exibidos para não apresentar estimativa não verificada como confiável.</Text>
            </View>
          )}

          <View style={styles.block}>
            <Text style={styles.h2}>Oportunidades identificadas</Text>
            {oportunidades.length > 0 ? oportunidades.slice(0, 4).map(item => (
              <View key={item.id} style={styles.opp}>
                <Text style={styles.oppTitle}>{item.titulo}</Text>
                <Text>{item.resumo}</Text>
              </View>
            )) : <Text>Nenhuma oportunidade relevante para o cenário atual.</Text>}
          </View>

          <View style={styles.block}>
            <Text style={styles.h2}>Fontes & metodologia</Text>
            <Text>Fonte: {FONTES_FISCAIS.resolucaoCgsn140.titulo} · {FONTES_FISCAIS.simplesNacionalLegislacao.titulo}</Text>
            <Text style={{ marginTop: 4 }}>Motor {TAX_RULE_VERSION.replace('BR-MEI-SN-', 'v')} · Metodologia completa em /metodologia</Text>
            <Text style={{ marginTop: 6, color: MUTED }}>Estimativa educacional — não substitui análise de contador habilitado pelo CRC. {legal.line}.</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>{legal.line}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E "SimulationReportDocument|reportTemplate"`
Expected: sem linhas (sem erro de tipo).

- [ ] **Step 3: Run suíte (sem regressão)**

Run: `npx vitest run`
Expected: nenhuma falha nova além da `/api/simular` pré-existente.

- [ ] **Step 4: Commit**

```bash
git add src/lib/reports/SimulationReportDocument.tsx
git commit -m "feat(reports): template único fru-fru + variant + CNAE pendente"
```

---

## Task 6: Consolidar geradores nas rotas (variant)

**Files:**
- Modify: `src/app/api/relatorio-premium/route.ts` (remover doc inline ~200-255; usar componente)
- Modify: `src/app/api/relatorio/gerar/route.ts` (usar componente)

- [ ] **Step 1: relatorio/gerar/route.ts usa o componente**

Garantir import `import { SimulationReportDocument } from '@/lib/reports/SimulationReportDocument'` e que o `pdfElement` seja:

```tsx
const pdfElement = React.createElement(SimulationReportDocument, {
  email,
  resultado,
  oportunidades,
  variant: 'full',
}) as unknown as React.ReactElement<DocumentProps>
```

(usa `hasReportAccess` já trocado na Task 3; `email`/`resultado`/`oportunidades` já existem no escopo da rota.)

- [ ] **Step 2: relatorio-premium/route.ts — remover doc inline, usar componente**

Substituir a construção inline do `<Document>` (bloco ~linhas 200-255) por:

```tsx
const pdfElement = React.createElement(SimulationReportDocument, {
  email,
  resultado,
  oportunidades,
  variant: 'full',
}) as unknown as React.ReactElement<DocumentProps>
const buffer = await renderToBuffer(pdfElement)
```

Remover imports agora órfãos (`Document, Page, StyleSheet, Text, View`) mantendo `renderToBuffer` e `DocumentProps`. Adicionar `import { SimulationReportDocument } from '@/lib/reports/SimulationReportDocument'`.

- [ ] **Step 3: Run typecheck + suíte do route**

Run: `npx tsc --noEmit 2>&1 | grep -E "relatorio-premium|relatorio/gerar" ; npx vitest run src/app/api/relatorio-premium/route.test.ts`
Expected: sem erro de tipo; teste do route premium PASS (renderToBuffer mockado já existe).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/relatorio-premium/route.ts src/app/api/relatorio/gerar/route.ts
git commit -m "refactor(reports): rotas usam o componente único (remove doc inline divergente)"
```

---

## Task 7: Preview travado + CTA no fluxo + nota .env

**Files:**
- Modify: `src/app/api/relatorio/gerar/route.ts` (aceitar `?preview=1` → variant preview, sem exigir compra; full exige `hasReportAccess`)
- Modify: `src/app/relatorio/page.tsx` (CTA "Liberar PDF — R$ 9,90" + embed do preview)
- Modify: `.env.example`

- [ ] **Step 1: Rota suporta preview**

Em `src/app/api/relatorio/gerar/route.ts`, ler o query param e decidir variant/acesso:

```tsx
const isPreview = new URL(req.url).searchParams.get('preview') === '1'
// preview: exige apenas usuário autenticado (já há checagem de auth na rota)
// full: exige hasReportAccess
if (!isPreview && !hasAccess) {
  return NextResponse.json({ error: 'Compra necessária para o PDF completo.' }, { status: 402 })
}
const variant = isPreview && !hasAccess ? 'preview' : 'full'
```

Passar `variant` ao `React.createElement(SimulationReportDocument, { ..., variant })`.

- [ ] **Step 2: UI — preview embed + CTA**

Em `src/app/relatorio/page.tsx`, quando `!hasAccess`, renderizar um `<iframe src="/api/relatorio/gerar?preview=1" />` (preview marca d'água) e um botão que faz `POST /api/checkout/report` (fluxo existente) com label `Liberar PDF — {REPORT_PRICE_LABEL}`. Quando `hasAccess`, manter o download atual (full).

- [ ] **Step 3: Nota no .env.example**

Adicionar sob a seção Billing de `.env.example`:

```
# IMPORTANTE: o Stripe cobra o valor do Price object, não o código.
# Para R$ 9,90: criar Price de 990 BRL no Stripe e apontar aqui.
STRIPE_PRICE_REPORT_ID=price_relatorio
```

(substituindo a linha existente `STRIPE_PRICE_REPORT_ID=price_relatorio`.)

- [ ] **Step 4: Run typecheck + suíte completa**

Run: `npx tsc --noEmit 2>&1 | grep -E "relatorio" ; npx vitest run`
Expected: sem erro de tipo nos tocados; suíte sem regressão (1 falha pré-existente aceitável).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/relatorio/gerar/route.ts src/app/relatorio/page.tsx .env.example
git commit -m "feat(relatorio): preview travado com dados reais + CTA R$ 9,90"
```

---

## Task 8: Amostra de PDF para validação visual do dono

**Files:**
- Create: `scripts/gen-sample-report.mjs` (script local; não entra no bundle)

- [ ] **Step 1: Script que gera amostra**

```javascript
// scripts/gen-sample-report.mjs
// Uso: node scripts/gen-sample-report.mjs  → escreve sample-preview.pdf e sample-full.pdf
import { renderToFile } from '@react-pdf/renderer'
import React from 'react'
import { SimulationReportDocument } from '../src/lib/reports/SimulationReportDocument.tsx'

const resultado = {
  entrada: { cnae: '9602-5/01', faturamentoAcumulado: 54000, mesAtual: 5, folhaMensal: 0, tipoMei: 'geral' },
  alertaTeto: { projecaoAnual: 129600, tetoAnual: 81000, cenario: 'excesso_grave' },
  anexoAtual: 'III',
  fatorR: null,
  comparativo: {
    simplesAnexoAtual: { dasAnual: 8000, anexo: 'III' },
    presumido: { custoTotal: 12000 },
    real: { custoTotal: 16000 },
    melhorRegime: 'simplesAtual',
  },
  taxRuleVersion: 'BR-MEI-SN-2026-04-28',
  geradoEm: new Date().toISOString(),
}

for (const variant of ['preview', 'full']) {
  await renderToFile(
    React.createElement(SimulationReportDocument, { email: 'amostra@simulamei.com.br', resultado, oportunidades: [], variant }),
    `sample-${variant}.pdf`,
  )
  console.log(`sample-${variant}.pdf gerado`)
}
```

- [ ] **Step 2: Gerar e sinalizar para validação visual**

Run: `node --experimental-strip-types scripts/gen-sample-report.mjs` (ou via tsx se disponível)
Expected: `sample-preview.pdf` e `sample-full.pdf` gerados na raiz.

Sinalizar ao dono: abrir os 2 PDFs e validar visualmente (fonte, marca d'água, layout). **Não commitar os .pdf** (adicionar `sample-*.pdf` ao `.gitignore` se necessário).

- [ ] **Step 3: Commit do script**

```bash
git add scripts/gen-sample-report.mjs
git commit -m "chore(reports): script de amostra de PDF para validação visual"
```

---

## Self-Review

**1. Spec coverage:**
- Preço fonte-única R$ 9,90 → Task 1+2 ✓
- Framing "% mais barato" → Task 2 Step 3 ✓
- Conteúdo do relatório (7 seções) → Task 5 ✓ (cabeçalho/identidade, resumo, comparativo, CNAE-pendente, oportunidades, fontes/metodologia, disclaimer)
- Template fru-fru (fonte, cor, header band, barras, rodapé paginado) → Task 4+5 ✓
- Preview variant + marca d'água server-side → Task 4+5+7 ✓
- Consolidação geradores → Task 6 ✓
- hasReportAccess dedup (4 cópias) → Task 3 ✓
- Pendência Stripe Price no .env.example → Task 7 Step 3 ✓
- Validação visual (amostra) → Task 8 ✓
- Fronteira fiscal CNAE pendente no PDF → Task 5 (vis.mostrarTributacao) ✓

**2. Placeholder scan:** sem TBD/TODO; todo passo com código/comando reais.

**3. Type consistency:** `ReportVariant` definido na Task 4 e usado nas Tasks 5-7. `hasReportAccess(plan, count)` assinatura consistente Task 3 ↔ uso. `SimulationReportDocument` props (`email, resultado, oportunidades, variant`) consistentes Task 5 ↔ 6 ↔ 8. `formatBRL`/`REPORT_PRICE_*` consistentes Task 1 ↔ 2.

Gaps: nenhum. Ajuste inline aplicado: Task 7 usa `402` para "compra necessária" (semântica de pagamento) — consistente com o gate.

---

## Notas de risco

- `Font.register` por URL gstatic pode falhar em serverless sem rede de saída → fallback Helvetica já coberto (`REGISTER_OK`). Se o ambiente bloquear, o PDF sai em Helvetica (aceitável, decidido no spec).
- Amostra (Task 8) usa um `resultado` mínimo tipado como objeto literal; se o tipo `ResultadoSimulacao` exigir campos extras em runtime, completar conforme o erro do render (não afeta o bundle).

---

## RESUME STATE (2026-05-19 — 8/8 TASKS CONCLUÍDAS)

Todas as 8 tasks do plano feitas e verificadas (spec + qualidade independentes). Falta só: **review final do conjunto** (em curso) → `superpowers:finishing-a-development-branch`.

**Onde:** worktree isolado `.claude/worktrees/relatorio-pdf-redesign`, branch `claude/relatorio-pdf-redesign`. Tip `1f24143`, compila standalone, suíte `npx vitest run` = **202 pass / 0 fail** (baseline correto — ver gotcha 8).

**Concluídas e verificadas:**
- Task 1 — `src/constants/pricing.ts` (+test). `df126a7`→`2a5193b`→`f7fc8f9`.
- Task 2 — fonte única + framing honesto + helper `reportSpendSummary`. `cb84256`+`e42ba10`.
- Task 3 — `src/lib/auth/report-access.ts` `hasReportAccess` (+test), 4 cópias. `0fb0bb6`.
- Task 4 — `src/lib/reports/reportTemplate.ts` (+test). `8d29692`.
- Task 5 — reescrita `SimulationReportDocument.tsx` (fru-fru + variant + CNAE pendente; fonte bundlada). `30f160d`+`530d534`.
- Task 6 — rotas no componente único; **IA do premium APOSENTADA (decisão de produto)** — premium == PDF padrão; `generateAiAnalysis`/Anthropic removidos. `ac86a1b`+`11c634c`+`9956aa3`.
- Task 7 — preview travado `?preview=1` (auth+ownership preservados, só gate de compra relaxa) + CTA `Liberar PDF — R$ 9,90` (reusa CheckoutButton) + nota `.env`. `e855857`.
- Task 8 — `scripts/gen-sample-report.mjs` + `sample-*.pdf` gitignored. `1f24143`. Samples gerados em `sample-{preview,full}.pdf` na raiz do worktree.

**Pendências (documentadas, NÃO bloqueiam o código; decisão/ação do dono):**
1. **Stripe Price**: criar Price de 990 BRL e setar `STRIPE_PRICE_REPORT_ID` (sem isso o Stripe cobra o valor antigo, apesar de código/UI R$ 9,90). `.env.example` documenta.
2. **Validação visual** dos PDFs `sample-preview.pdf` / `sample-full.pdf` (raiz do worktree) — fonte/marca d'água/layout. Só o humano valida; agentes só confirmaram que são PDFs reais.
3. **Follow-up de teste (Minor, recomendado pelo code-review da Task 7, não-bloqueante):** criar `src/app/api/relatorio/gerar/route.test.ts` cobrindo a matriz de acesso (401 / 402 sem compra / preview / full p/ pro mesmo com `?preview=1` / 404) — copiar o harness de `src/app/api/relatorio-premium/route.test.ts` (mock `createClient`/`@react-pdf/renderer`, sem render real). Plano não definiu teste p/ Task 7; capturado como dívida de alto valor em código de controle de acesso pago.

**Gotchas aprendidas (registro):**
1. Subagentes filaram **4 relatórios imprecisos/FALSOS** neste run → SEMPRE verificar spec+qualidade independentes lendo código/git e re-rodando; nunca confiar no report. Checar `git status --porcelain` após cada commit.
2. Nº de linha do plano DESATUALIZADOS → localizar alvos por CONTEÚDO.
3. Ler via `git show <sha>:<arquivo>` ou caminho ABSOLUTO do worktree.
4. `dashboard/relatorio/page.tsx` importa `reportSpendSummary` de `@/constants/pricing` (Task 2). Task 7 mexe em `src/app/relatorio/page.tsx` (não a do dashboard).
5. Cada commit deve compilar standalone e ser atômico.
6. **Fonte:** URL gstatic do plano (Task 5) MORTA → TTF bundlada `src/lib/reports/fonts/SpaceGrotesk.ttf`, data-URL lida por `fs` no load. `SimulationReportDocument.tsx` é **server-only** (`node:fs`) — NÃO importar de componente client. Não reintroduzir URL remota.
7. Task 6 FEITA: `relatorio-premium/route.ts` já usa o componente; seu teste mocka `@react-pdf/renderer` E `@/lib/reports/SimulationReportDocument`.
8. **Baseline suíte = 202, não 203.** Task 6 removeu de propósito o teste obsoleto "503 quando Anthropic não configurado" (IA aposentada). 202/0 É o estado limpo; não tratar a queda de 1 como regressão.
9. Task 7: verificar o MÉTODO HTTP de `relatorio/gerar/route.ts` antes do `<iframe src=...preview=1>` — iframe faz GET; se a rota for POST-only o preview-embed não funciona como está e precisa adaptação (reportar, não chutar).

**Próximo passo:** review final do conjunto (`8dad2df..1f24143`, todas as 8 tasks como uma unidade) em curso → depois `superpowers:finishing-a-development-branch` (merge/PR/cleanup). As 3 pendências acima são do dono e não bloqueiam o merge do código.
