# Billing do Relatório por Conteúdo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o relatório avulso pago por conteúdo (fingerprint dos inputs) em vez de acesso vitalício, com re-download ilimitado do que foi pago e uma lista "Meus relatórios pagos".

**Architecture:** Coluna `purchases.report_fingerprint` (chave de conteúdo) + `purchases.simulation_id` (alvo de regeneração). Checkout calcula o fingerprint da simulação atual e o injeta no `metadata` da sessão Stripe; o webhook persiste. O gate de acesso passa de "tem ≥1 compra" para "fingerprint da sim atual ∈ fingerprints pagos OU plano pro".

**Tech Stack:** Next.js 16 App Router, TypeScript, vitest, Supabase (Postgres), Stripe (live), @react-pdf/renderer. Worktree: `.claude/worktrees/relatorio-pdf-redesign`, branch `claude/relatorio-pdf-redesign` **== `main` == produção** (push = deploy Vercel).

**Spec:** `docs/superpowers/specs/2026-05-19-relatorio-billing-por-conteudo-design.md`

## Restrições globais (valem para TODAS as tasks)

- **Ordem de segurança (push = deploy prod):** migração → helper → checkout escreve fingerprint → webhook persiste → SÓ ENTÃO o gate passa a exigir fingerprint → re-download → UI. Nunca deployar o gate exigindo fingerprint antes do checkout escrevê-lo.
- **TDD:** todo passo de código tem teste RED antes da implementação.
- **Verificação obrigatória antes de cada push:** `npx vitest run` (209/0 atual + novos, 0 falhas), `npx tsc --noEmit` (limpo), `npm run build` (exit 0), e fonte ainda no trace: `node -e "const fs=require('fs');const r='.next/server/app/api/relatorio/gerar/route.js.nft.json';console.log(fs.existsSync(r)&&JSON.parse(fs.readFileSync(r,'utf8')).files.some(f=>/SpaceGrotesk\.ttf/i.test(f)))"` → `true`.
- **Commits:** Conventional, PT-BR, com trailer `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`. Atômicos (cada task = 1 commit deployável; prod fica verde a cada commit).
- **Push:** `git push origin HEAD:main` + `git push origin claude/relatorio-pdf-redesign` (fast-forward). Depois monitorar: `gh api repos/munhoz-iago/SimulaMEI/commits/<sha>/status --jq .state` em loop até `success`.
- **Supabase MCP:** `project_id = fepnwaepjlostashckfj`.
- Diretório de trabalho: `C:/Users/iagom/Downloads/📁 Organizado/Projetos e Código/SimulaMEI/simulamei/.claude/worktrees/relatorio-pdf-redesign` (prefixar `cd` em cada comando shell; o shell reseta entre comandos).

---

### Task 1: Migração aditiva (Supabase MCP, antes de qualquer código)

**Files:** nenhum arquivo no repo (DDL aplicado no Postgres de produção via MCP).

- [ ] **Step 1: Aplicar a migração**

Chamar a tool `mcp__148d30b8-67e5-4970-8962-d560afbcc9b8__apply_migration` com:
- `project_id`: `fepnwaepjlostashckfj`
- `name`: `purchases_report_fingerprint_e_simulation_id`
- `query`:

```sql
ALTER TABLE purchases
  ADD COLUMN report_fingerprint text NULL,
  ADD COLUMN simulation_id uuid NULL REFERENCES simulations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS purchases_paid_fingerprint_idx
  ON purchases (user_id, report_fingerprint)
  WHERE status = 'paid';
```

- [ ] **Step 2: Verificar colunas e índice**

Chamar `mcp__148d30b8-67e5-4970-8962-d560afbcc9b8__execute_sql` (project_id `fepnwaepjlostashckfj`):

```sql
select column_name, data_type, is_nullable from information_schema.columns
where table_schema='public' and table_name='purchases'
  and column_name in ('report_fingerprint','simulation_id');
select indexname from pg_indexes where tablename='purchases' and indexname='purchases_paid_fingerprint_idx';
```

Expected: `report_fingerprint text YES`, `simulation_id uuid YES`, e o índice listado. **Sem backfill** (decisão D3 — não há compra paga real, apenas o teste do dono).

- [ ] **Step 3: Sem commit**

DDL é estado de banco, não código. Não há push/deploy nesta task.

---

### Task 2: Helper `reportFingerprint` (puro, server-only, TDD)

**Files:**
- Create: `src/lib/reports/reportFingerprint.ts`
- Test: `src/lib/reports/reportFingerprint.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `src/lib/reports/reportFingerprint.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { reportFingerprint } from './reportFingerprint'

const base = { cnae: '6201-5/01', tipoMei: 'geral', mesAtual: 5, faturamentoAcumulado: 68000, folhaMensal: 4000 }

describe('reportFingerprint', () => {
  it('é determinístico (mesmos inputs → mesmo hash)', () => {
    expect(reportFingerprint(base)).toBe(reportFingerprint({ ...base }))
  })

  it('independe da ordem das chaves', () => {
    const reordered = { folhaMensal: 4000, faturamentoAcumulado: 68000, mesAtual: 5, tipoMei: 'geral', cnae: '6201-5/01' }
    expect(reportFingerprint(reordered)).toBe(reportFingerprint(base))
  })

  it('muda quando um input muda', () => {
    expect(reportFingerprint({ ...base, cnae: '6204-0/00' })).not.toBe(reportFingerprint(base))
    expect(reportFingerprint({ ...base, faturamentoAcumulado: 70000 })).not.toBe(reportFingerprint(base))
  })

  it('coerção numérica: "4000" e 4000 são o mesmo', () => {
    expect(reportFingerprint({ ...base, folhaMensal: '4000' as unknown as number }))
      .toBe(reportFingerprint(base))
  })

  it('ignora campos fora do conjunto (taxRuleVersion/geradoEm não afetam)', () => {
    expect(reportFingerprint({ ...base, taxRuleVersion: 'X', geradoEm: '2026-01-01' } as never))
      .toBe(reportFingerprint(base))
  })

  it('null/undefined → hash estável (entrada vazia)', () => {
    expect(reportFingerprint(null)).toBe(reportFingerprint(undefined))
  })
})
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `cd "<worktree>" && npx vitest run src/lib/reports/reportFingerprint.test.ts 2>&1 | grep -E "PASS \(|FAIL \(|Error"`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar**

Create `src/lib/reports/reportFingerprint.ts`:

```ts
import { createHash } from 'node:crypto'

export type ReportFingerprintEntrada =
  | {
      cnae?: unknown
      tipoMei?: unknown
      mesAtual?: unknown
      faturamentoAcumulado?: unknown
      folhaMensal?: unknown
      folhaDetalhada?: unknown
    }
  | null
  | undefined

const NUMERIC = new Set(['mesAtual', 'faturamentoAcumulado', 'folhaMensal'])
const FIELDS = ['cnae', 'tipoMei', 'mesAtual', 'faturamentoAcumulado', 'folhaMensal', 'folhaDetalhada'] as const

function canonical(value: unknown): unknown {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map(canonical)
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      const c = canonical((value as Record<string, unknown>)[k])
      if (c !== undefined) out[k] = c
    }
    return out
  }
  return undefined
}

/**
 * Hash estável dos INPUTS da simulação. Exclui timestamps e taxRuleVersion
 * (motor melhora de graça; "mesmos dados = mesmo relatório"). Determinístico.
 */
export function reportFingerprint(entrada: ReportFingerprintEntrada): string {
  const src = (entrada ?? {}) as Record<string, unknown>
  const picked: Record<string, unknown> = {}
  for (const f of FIELDS) {
    const v = src[f]
    if (v === undefined || v === null) continue
    picked[f] = NUMERIC.has(f) ? Number(v) : v
  }
  return createHash('sha256').update(JSON.stringify(canonical(picked))).digest('hex')
}
```

- [ ] **Step 4: Rodar — deve passar**

Run: `cd "<worktree>" && npx vitest run src/lib/reports/reportFingerprint.test.ts 2>&1 | grep -E "PASS \(|FAIL \("`
Expected: `PASS (6) FAIL (0)`.

- [ ] **Step 5: Verificação + commit + push + monitorar**

Run a verificação obrigatória global (vitest total, tsc, build, trace). Esperado: vitest `PASS (215) FAIL (0)` (209 + 6), tsc limpo, build exit 0, trace `true`.

```bash
cd "<worktree>" && git add src/lib/reports/reportFingerprint.ts src/lib/reports/reportFingerprint.test.ts && git commit -m "$(cat <<'EOF'
feat(relatorio): helper reportFingerprint (hash estável dos inputs)

Base do billing por conteúdo: mesmos inputs → mesmo hash; exclui
taxRuleVersion/timestamps. Puro, server-only, TDD (6 testes).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```
Depois `git push origin HEAD:main && git push origin claude/relatorio-pdf-redesign` e monitorar o deploy até `success` (helper inerte — nenhum consumidor ainda; deploy seguro).

---

### Task 3: Checkout escreve fingerprint + simulation_id (additive; gate antigo ainda ignora)

**Files:**
- Modify: `src/app/api/checkout/report/route.ts`
- Test: `src/app/api/checkout/report/route.test.ts`

Estado atual de `route.ts` (referência exata): após `if (!isStripeConfigured() || !STRIPE_PRODUCTS.relatorio.priceId)` (503), há `try { const session = await createBrandedCheckoutSession({ product:'relatorio', userId:user.id, userEmail:user.email, mode:'payment' }); await supabase.from('purchases').insert({ user_id:user.id, produto:STRIPE_PRODUCTS.relatorio.product, status:'pending', valor_centavos:STRIPE_PRODUCTS.relatorio.valorCentavos, stripe_session_id:session.id }); return NextResponse.json({ url: session.url }) } catch (err) { ... 502 }`.

- [ ] **Step 1: Escrever o teste que falha**

No `src/app/api/checkout/report/route.test.ts` existente (harness com `createClientMock`, `createBrandedCheckoutSessionMock`, `isStripeConfiguredMock`, `insertMock`, `makeServerClient`): o `makeServerClient` atual só mocka `auth` e `from('purchases')`. Adicione suporte a `from('simulations')` no helper (retornando `{ data: [{ resultado: { entrada: {...} } }] }`) e adicione este teste no `describe`:

```ts
it('calcula fingerprint da simulação atual e injeta no checkout + insert', async () => {
  const entrada = { cnae: '6201-5/01', tipoMei: 'geral', mesAtual: 5, faturamentoAcumulado: 68000, folhaMensal: 4000 }
  createClientMock.mockResolvedValue(makeServerClient(
    { id: 'user-1', email: 'u@e.com' },
    { simulations: [{ resultado: { entrada, alertaTeto: { projecaoAnual: 163200 } } }] },
  ))

  const response = await POST()

  expect(response.status).toBe(200)
  const fpArg = createBrandedCheckoutSessionMock.mock.calls[0][0].extraMetadata
  expect(fpArg.report_fingerprint).toMatch(/^[a-f0-9]{64}$/)
  expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
    report_fingerprint: fpArg.report_fingerprint,
  }))
})

it('bloqueia checkout (422) quando não há simulação ou está vazia', async () => {
  createClientMock.mockResolvedValue(makeServerClient(
    { id: 'user-1', email: 'u@e.com' },
    { simulations: [] },
  ))
  const response = await POST()
  expect(response.status).toBe(422)
  expect(createBrandedCheckoutSessionMock).not.toHaveBeenCalled()
})
```

Ajuste `makeServerClient` para aceitar um 2º arg `opts?: { simulations?: unknown[] }` e, no `from`, retornar para `'simulations'` um objeto query encadeável (`select/eq/order/limit`) resolvendo `{ data: opts?.simulations ?? [] }` (siga o padrão de `makeQuery` que já existe no teste do `relatorio-premium`).

- [ ] **Step 2: Rodar — deve falhar**

Run: `cd "<worktree>" && npx vitest run src/app/api/checkout/report/route.test.ts 2>&1 | grep -E "PASS \(|FAIL \("`
Expected: FAIL (rota ainda não busca simulação nem injeta extraMetadata).

- [ ] **Step 3: Implementar a modificação**

Em `src/app/api/checkout/report/route.ts`:

1. Adicionar imports no topo (após os imports existentes):
```ts
import { reportFingerprint } from '@/lib/reports/reportFingerprint'
import { isResultadoVazio } from '@/lib/reports/reportEligibility'
```

2. Logo após o guard 503 (`if (!isStripeConfigured() || !STRIPE_PRODUCTS.relatorio.priceId) {...}`), antes do `try`:
```ts
  const { data: sims } = await supabase
    .from('simulations')
    .select('id, resultado')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
  const sim = sims?.[0] as { id: string; resultado: { entrada?: unknown } } | undefined
  if (!sim || isResultadoVazio(sim.resultado as never)) {
    return NextResponse.json({ error: 'Refaça a simulação com seus dados antes de pagar o relatório.' }, { status: 422 })
  }
  const fingerprint = reportFingerprint((sim.resultado as { entrada?: never }).entrada)
```

3. No `createBrandedCheckoutSession({...})`, adicionar a propriedade:
```ts
    extraMetadata: { report_fingerprint: fingerprint, simulation_id: sim.id },
```

4. No `supabase.from('purchases').insert({...})`, adicionar:
```ts
      report_fingerprint: fingerprint,
      simulation_id: sim.id,
```

- [ ] **Step 4: Rodar — deve passar**

Run: `cd "<worktree>" && npx vitest run src/app/api/checkout/report/route.test.ts 2>&1 | grep -E "PASS \(|FAIL \("`
Expected: PASS (todos, incl. os 2 novos).

- [ ] **Step 5: Verificação global + commit + push + monitorar**

vitest total verde, tsc, build, trace `true`. Commit:
```
fix(checkout): grava report_fingerprint + simulation_id na compra

Checkout passa a calcular o fingerprint do conteúdo da simulação atual
e injeta no metadata Stripe + no insert da purchase. Bloqueia 422 se
não há simulação/está vazia (reusa isResultadoVazio). Aditivo — gate
ainda ignora; sem mudança de comportamento de acesso. TDD.
```
Push + monitorar até `success`.

---

### Task 4: Webhook persiste fingerprint + simulation_id (defensivo/idempotente)

**Files:**
- Modify: `src/app/api/stripe/webhook/route.ts` (função `handleConsumerCheckoutCompleted`, ~linhas 31-61)
- Test: `src/app/api/stripe/webhook/route.test.ts`

Estado atual de `handleConsumerCheckoutCompleted`: faz `purchasesTable.update({ status:'paid', stripe_payment_id: ... }).eq('stripe_session_id', session.id)` e, se `produto==='monitor_mensal'`, atualiza `user_profiles`.

- [ ] **Step 1: Escrever o teste que falha**

No `src/app/api/stripe/webhook/route.test.ts` (siga o harness de mocks existente — leia o arquivo para casar o setup de `vi.mock`/admin client). Adicione um teste: evento `checkout.session.completed` com `session.metadata = { user_id:'u1', produto:'relatorio', report_fingerprint:'abc123', simulation_id:'sim-1' }` deve resultar em `update` da `purchases` contendo `status:'paid'`, `report_fingerprint:'abc123'`, `simulation_id:'sim-1'`. Assertar via o mock de `.update(...)` capturado.

- [ ] **Step 2: Rodar — deve falhar**

Run: `cd "<worktree>" && npx vitest run src/app/api/stripe/webhook/route.test.ts 2>&1 | grep -E "PASS \(|FAIL \("`
Expected: FAIL (update não inclui os novos campos).

- [ ] **Step 3: Implementar**

Em `handleConsumerCheckoutCompleted`, no `.update({...})` da tabela `purchases`, adicionar (lendo do metadata):
```ts
  const fp = session.metadata?.report_fingerprint
  const simId = session.metadata?.simulation_id
  await purchasesTable
    .update({
      status: 'paid',
      stripe_payment_id: getStripeObjectId(session.payment_intent) ?? getStripeObjectId(session.subscription),
      ...(fp ? { report_fingerprint: fp } : {}),
      ...(simId ? { simulation_id: simId } : {}),
    })
    .eq('stripe_session_id', session.id)
```
(Substituir o `.update({...})` atual por este; manter o resto da função igual. Se metadata vier sem fingerprint — compra antiga em voo — não quebra: só não escreve, e a row já tem o fingerprint do insert do checkout da Task 3.)

- [ ] **Step 4: Rodar — deve passar**

Run igual ao Step 2. Expected: PASS.

- [ ] **Step 5: Verificação global + commit + push + monitorar**

Commit:
```
fix(webhook): persiste report_fingerprint + simulation_id ao pagar

handleConsumerCheckoutCompleted grava os campos do metadata na purchase
ao marcar paid (defensivo/idempotente — o checkout já insere; webhook
garante). Sem metadata → não quebra fulfillment. TDD.
```
Push + monitorar até `success`.

---

### Task 5: Rework `hasReportAccess` (novo contrato) + migrar os 4 consumidores — ATÔMICO

**Files:**
- Modify: `src/lib/auth/report-access.ts`
- Modify: `src/lib/auth/report-access.test.ts`
- Modify: `src/app/api/relatorio/gerar/route.ts`
- Modify: `src/app/api/relatorio-premium/route.ts`
- Modify: `src/app/dashboard/relatorio/page.tsx`
- Modify: `src/app/relatorio/page.tsx`

**Por que atômico:** mudar a assinatura e deployar antes de migrar todos os call sites quebra prod (push = deploy). Tudo num commit. A esta altura (Tasks 3-4 já em prod) novas compras já carregam fingerprint, então apertar o gate é seguro. Não há cliente pagante real (D3); o gate aperta imediatamente — comportamento desejado.

- [ ] **Step 1: Reescrever o teste do helper (RED)**

Substituir todo o conteúdo de `src/lib/auth/report-access.test.ts` por:

```ts
import { describe, expect, it } from 'vitest'
import { hasReportAccess } from './report-access'

describe('hasReportAccess', () => {
  it('libera plano pro independentemente de fingerprint', () => {
    expect(hasReportAccess({ plan: 'pro', paidFingerprints: [], currentFingerprint: 'x' })).toBe(true)
    expect(hasReportAccess({ plan: 'pro', paidFingerprints: [], currentFingerprint: null })).toBe(true)
  })
  it('libera quando o fingerprint atual está entre os pagos', () => {
    expect(hasReportAccess({ plan: 'free', paidFingerprints: ['a', 'b'], currentFingerprint: 'b' })).toBe(true)
  })
  it('bloqueia quando o fingerprint atual não foi pago', () => {
    expect(hasReportAccess({ plan: 'free', paidFingerprints: ['a'], currentFingerprint: 'z' })).toBe(false)
    expect(hasReportAccess({ plan: null, paidFingerprints: [], currentFingerprint: 'z' })).toBe(false)
  })
  it('bloqueia quando não há fingerprint atual (simulação ausente)', () => {
    expect(hasReportAccess({ plan: 'free', paidFingerprints: ['a'], currentFingerprint: null })).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar — deve falhar**

Run: `cd "<worktree>" && npx vitest run src/lib/auth/report-access.test.ts 2>&1 | grep -E "PASS \(|FAIL \("`
Expected: FAIL (assinatura antiga).

- [ ] **Step 3: Implementar o novo contrato**

Substituir todo `src/lib/auth/report-access.ts` por:

```ts
/** Acesso ao relatório: plano pro OU fingerprint da simulação atual já pago. */
export function hasReportAccess(params: {
  plan: string | null | undefined
  paidFingerprints: string[]
  currentFingerprint: string | null | undefined
}): boolean {
  if (params.plan === 'pro') return true
  const fp = params.currentFingerprint
  return Boolean(fp) && params.paidFingerprints.includes(fp as string)
}
```

- [ ] **Step 4: Migrar `src/app/api/relatorio/gerar/route.ts`**

A query atual de `purchases` seleciona `id`. Trocar para selecionar `report_fingerprint`. Adicionar import `reportFingerprint`. Substituir o cálculo de `hasAccess`:

```ts
// imports
import { reportFingerprint } from '@/lib/reports/reportFingerprint'

// na Promise.all, trocar a query de purchases por:
supabase.from('purchases').select('report_fingerprint')
  .eq('user_id', user.id).eq('produto', 'relatorio').eq('status', 'paid'),

// após obter `latest` (já existe) e ANTES do uso de hasAccess:
const currentFp = reportFingerprint((latest as { entrada?: never }).entrada)
const paidFps = (purchases ?? []).map(p => (p as { report_fingerprint: string | null }).report_fingerprint).filter(Boolean) as string[]
const hasAccess = hasReportAccess({ plan: profile?.plano, paidFingerprints: paidFps, currentFingerprint: currentFp })
```
(Manter o guard `isResultadoVazio` e o resto. `latest` continua a sim mais recente.)

- [ ] **Step 5: Migrar `src/app/api/relatorio-premium/route.ts`**

Mesmo padrão: import `reportFingerprint`; query `purchases` seleciona `report_fingerprint`; após `latest` (e após o guard `isResultadoVazio` existente), computar `currentFp`/`paidFps` e chamar `hasReportAccess({ plan: profile?.plano, paidFingerprints: paidFps, currentFingerprint: currentFp })`. (Hoje a ordem é: fetch → `hasAccess` → 403 → `latest` → vazio 422. Reordenar para: fetch (incl. simulations) → `latest` → vazio 422 → computar fp → `hasAccess` → 403. A simulação já é buscada na Promise.all atual; o `latest` já existe logo após.)

- [ ] **Step 6: Migrar `src/app/relatorio/page.tsx`**

Estado atual (linhas 22-33): busca `profile.plano` e `purchases(id)`, e `hasAccess = hasReportAccess(profile?.plano, purchases?.length ?? 0)`. Substituir por:

```ts
import { reportFingerprint } from '@/lib/reports/reportFingerprint'

const [{ data: profile }, { data: purchases }, { data: sims }] = await Promise.all([
  supabase.from('user_profiles').select('plano').eq('id', user.id).maybeSingle(),
  supabase.from('purchases').select('report_fingerprint')
    .eq('user_id', user.id).eq('produto', 'relatorio').eq('status', 'paid'),
  supabase.from('simulations').select('resultado')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
])
const latest = (sims?.[0] as { resultado?: { entrada?: never } } | undefined)?.resultado
const currentFp = latest ? reportFingerprint(latest.entrada) : null
const paidFps = (purchases ?? []).map(p => (p as { report_fingerprint: string | null }).report_fingerprint).filter(Boolean) as string[]
const hasAccess = hasReportAccess({ plan: profile?.plano, paidFingerprints: paidFps, currentFingerprint: currentFp })
```
Trocar a copy `Seu acesso já está liberado.` por `Este relatório já está liberado.` e `Compra avulsa do relatório:` por `Liberar este relatório:`.

- [ ] **Step 7: Migrar `src/app/dashboard/relatorio/page.tsx`**

Estado atual: `const hasAccess = hasReportAccess(ctx.plan, purchases?.length ?? 0)` (purchases vem de `supabase.from('purchases').select('id')...limit(1)`; há também `reportPurchasesCount`). Mudar:
- a query `purchases` `.select('id')` (a do `hasAccess`, com `.limit(1)`) para `.select('report_fingerprint, simulation_id, created_at')` **sem** `.limit(1)`.
- buscar a simulação mais recente do user (a página usa `getDashboardContext`; adicionar uma query `supabase.from('simulations').select('resultado').eq('user_id', ctx.user.id).order('created_at',{ascending:false}).limit(1)`).
- `import { reportFingerprint } from '@/lib/reports/reportFingerprint'`.
- computar `currentFp`/`paidFps` e `const hasAccess = hasReportAccess({ plan: ctx.plan, paidFingerprints: paidFps, currentFingerprint: currentFp })`.
- na mensagem do bloco `hasAccess`, trocar a frase do avulso para: `Você pagou por este relatório — pode baixá-lo quantas vezes precisar.` (mantém a do pro).

(Não adicionar a seção "Meus relatórios pagos" aqui — é a Task 7. Aqui só o gate por fingerprint, mantendo a página verde.)

- [ ] **Step 8: Atualizar testes de rota afetados**

`src/app/api/relatorio-premium/route.test.ts`: o `makeServerClient`/`makeQuery` já mocka `purchases` e `simulations`. Ajustar os mocks de `purchases` para devolver linhas com `report_fingerprint` e os testes existentes para o novo contrato:
- "requires a paid report or pro plan" (hoje espera 403 com `profile:{plano:'free'}, purchases:[], simulations:[{resultado:{}}]`): com novo gate, `currentFp` de `{}` ≠ qualquer pago e plano free → ainda 403. Manter, mas garantir que a ordem nova (vazio 422 antes do gate) não muda: `{resultado:{}}` é vazio → agora retorna **422**, não 403. Atualizar o expected desse teste para `422` (a simulação vazia é barrada antes do gate — comportamento correto e já introduzido na Task 8 anterior do projeto).
- "returns a PDF for pro users" (`plano:'pro'`, `makeResultado()`): pro → 200. Manter.
- Adicionar: free + `purchases:[{report_fingerprint:'<fp de makeResultado>'}]` + `makeResultado()` → 200 (fingerprint casa). Para obter o fp, importe `reportFingerprint` no teste e calcule de `makeResultado().entrada`.

- [ ] **Step 9: Rodar toda a suíte — verde**

Run: `cd "<worktree>" && npx vitest run 2>&1 | grep -E "PASS \(|FAIL \(" | tail -1` → `FAIL (0)`. `npx tsc --noEmit` limpo.

- [ ] **Step 10: Verificação global + commit + push + monitorar**

build exit 0, trace `true`. Commit:
```
feat(relatorio): gate de acesso por fingerprint (fim do vitalício)

hasReportAccess novo contrato {plan,paidFingerprints,currentFingerprint}.
Migra os 4 consumidores (rotas gerar+premium, páginas /dashboard/relatorio
e /relatorio): acesso = pro OU fingerprint da sim atual ∈ pagos. Copy
"este relatório". Atômico (1 deploy consistente). Sem cliente pago real.
```
Push + monitorar até `success`. **Validação objetiva pós-deploy:** `execute_sql` (project fepnwaepjlostashckfj): confirmar que `select count(*) from purchases where status='paid' and report_fingerprint is not null` ≥ 0 e que a lógica está coerente (descrever no relato).

---

### Task 6: Re-download pinado `?purchase=` em `/api/relatorio/gerar`

**Files:**
- Modify: `src/app/api/relatorio/gerar/route.ts`
- Create: `src/app/api/relatorio/gerar/route.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `src/app/api/relatorio/gerar/route.test.ts` (espelhe o harness de `relatorio-premium/route.test.ts`: `vi.mock` de `@/lib/supabase/server`, `@react-pdf/renderer` (renderToBuffer mock), `@/lib/tributario`, `@/lib/reports/SimulationReportDocument`; `makeServerClient` com `from('user_profiles'|'purchases'|'simulations')`). Para `?purchase=`, também mockar `from('purchases')` numa busca por `id`. Casos:
- `?purchase=p1` de purchase paga do user com `simulation_id='s1'` → 200, gerou da sim `s1` (não da latest).
- `?purchase=p1` de purchase de OUTRO user → 403.
- `?purchase=p1` não paga → 402.
- `?purchase=p1` paga mas `simulation_id` nulo e existe sim do user com fingerprint == `purchase.report_fingerprint` → 200 (fallback).
- `?purchase=p1` paga, sem sim resolvível → 422.

Construir `Request` com URL `http://localhost/api/relatorio/gerar?purchase=p1` e chamar `GET(req)`.

- [ ] **Step 2: Rodar — deve falhar**

Run: `cd "<worktree>" && npx vitest run src/app/api/relatorio/gerar/route.test.ts 2>&1 | grep -E "PASS \(|FAIL \("`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Em `src/app/api/relatorio/gerar/route.ts` `GET`, após resolver `user` (401) e ler `const url = new URL(req.url)`:

```ts
const purchaseId = url.searchParams.get('purchase')
if (purchaseId) {
  const { data: pur } = await supabase
    .from('purchases')
    .select('user_id, status, produto, report_fingerprint, simulation_id')
    .eq('id', purchaseId)
    .maybeSingle()
  if (!pur) return NextResponse.json({ error: 'Compra não encontrada.' }, { status: 404 })
  if ((pur as { user_id: string }).user_id !== user.id) return NextResponse.json({ error: 'Compra de outro usuário.' }, { status: 403 })
  if ((pur as { status: string }).status !== 'paid' || (pur as { produto: string }).produto !== 'relatorio')
    return NextResponse.json({ error: 'Compra não habilita relatório.' }, { status: 402 })

  let simRow: { resultado: { entrada?: never } } | undefined
  const simId = (pur as { simulation_id: string | null }).simulation_id
  if (simId) {
    const { data } = await supabase.from('simulations').select('resultado').eq('id', simId).eq('user_id', user.id).maybeSingle()
    if (data) simRow = data as never
  }
  if (!simRow) {
    const fp = (pur as { report_fingerprint: string | null }).report_fingerprint
    if (fp) {
      const { data: cands } = await supabase.from('simulations').select('resultado')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      simRow = (cands as Array<{ resultado: { entrada?: never } }> | null)
        ?.find(s => reportFingerprint(s.resultado.entrada) === fp)
    }
  }
  if (!simRow) return NextResponse.json({ error: 'Relatório indisponível — refaça a simulação com os mesmos dados.' }, { status: 422 })

  const r = simRow.resultado as never
  const buffer = await renderToBuffer(React.createElement(SimulationReportDocument, {
    email: user.email ?? 'cliente@simulamei.com.br',
    resultado: r,
    oportunidades: gerarOportunidadesFiscais(r),
    variant: 'full',
  }) as unknown as React.ReactElement<DocumentProps>)
  return new NextResponse(new Uint8Array(buffer), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="simulamei-relatorio.pdf"' },
  })
}
```
(Adicionar `import { reportFingerprint } from '@/lib/reports/reportFingerprint'` se ainda não importado pela Task 5. O fluxo normal — sem `?purchase=` — permanece intacto abaixo deste bloco.)

- [ ] **Step 4: Rodar — deve passar**

Run igual Step 2. Expected: PASS (todos os 5 casos).

- [ ] **Step 5: Verificação global + render real (descartável)**

Além da verificação global: teste descartável `src/app/api/relatorio/gerar/__pin_render.test.ts` que monta um `resultado` real via `simular(...)` e chama o caminho de render do `?purchase=` (ou diretamente `SimulationReportDocument`) e assere `%PDF-` + tamanho > 7000; rodar, depois `rm` o arquivo. Confirmar `git status` limpo dos descartáveis.

- [ ] **Step 6: Commit + push + monitorar**

```
feat(relatorio): re-download pinado via ?purchase= (ownership + fallback)

GET ?purchase=<id>: valida dono/paga/produto → regenera da simulation_id
pinada; fallback por fingerprint; senão 422. Fluxo normal intacto. TDD
(5 casos) + render real validado.
```
Push + monitorar até `success`.

---

### Task 7: UI "Meus relatórios pagos" em `/dashboard/relatorio`

**Files:**
- Modify: `src/app/dashboard/relatorio/page.tsx`

- [ ] **Step 1: Buscar dados da lista**

A Task 5 já fez `purchases` selecionar `report_fingerprint, simulation_id, created_at` (sem limit). Para rótulos legíveis, buscar as simulações pinadas: `const simIds = paidPurchases.map(p=>p.simulation_id).filter(Boolean)` e `supabase.from('simulations').select('id, resultado').in('id', simIds)` (se `simIds.length`); montar um map `simId -> { cnae, faturamento, createdAt }` a partir de `resultado.entrada`.

- [ ] **Step 2: Renderizar a seção (não-pro com ≥1 compra paga)**

Adicionar, dentro do bloco `hasAccess ? (...)` logo após o `<DownloadReportButton />` (ou como seção irmã quando `ctx.plan !== 'pro' && paidPurchases.length > 0`), um `Panel` "Meus relatórios pagos" listando cada compra paga: rótulo `CNAE {cnae} · R$ {faturamento.toLocaleString('pt-BR')} · {DD/MM/AAAA}` + link/botão "Baixar PDF" para `/api/relatorio/gerar?purchase=${p.id}` (usar um `<a href>` simples com `download`, ou o padrão de botões do arquivo). Itens cuja sim não resolve (sem `simulation_id` e sem match) mostram "indisponível — refaça com os mesmos dados". Pro: não renderizar a lista (mostrar só o aviso "Pro inclui relatórios ilimitados", que já existe). Sem compras pagas e não-pro: não renderizar a seção.

- [ ] **Step 3: Verificação global**

Sem teste unitário novo (página server-side de composição; coberta por tsc+build). Rodar vitest total (sem regressão), tsc limpo, build exit 0, trace `true`. Validar visualmente que compila e a rota `?purchase=` responde (já testada na Task 6).

- [ ] **Step 4: Commit + push + monitorar**

```
feat(relatorio): seção "Meus relatórios pagos" no dashboard

Lista compras pagas (rótulo CNAE·faturamento·data da sim pinada) com
re-download 1-clique via ?purchase=. Só não-pro com compra paga; Pro vê
aviso ilimitado. Fallback de item indisponível.
```
Push + monitorar até `success`.

---

### Task 8: Validação objetiva fim-a-fim + relatório final

**Files:** nenhum (verificação).

- [ ] **Step 1: Suíte + build final**

`npx vitest run` (0 falhas, total = 209 + novos), `npx tsc --noEmit` limpo, `npm run build` exit 0, trace `true`.

- [ ] **Step 2: Validação objetiva no banco (Supabase MCP, project fepnwaepjlostashckfj)**

`execute_sql`:
```sql
select id, status, report_fingerprint is not null as has_fp, simulation_id is not null as has_sim, created_at
from purchases where produto='relatorio' order by created_at desc limit 5;
```
Confirmar que QUALQUER nova compra (após Task 3 em prod) tem `has_fp=true`. Compras antigas (teste do dono) `has_fp=false` — esperado (não casam o gate; sem cliente real).

- [ ] **Step 3: Relato final**

Resumir: migração aplicada, fingerprint escrito no checkout+webhook, gate por conteúdo ativo, re-download pinado + lista no ar, suíte verde, deploys `success`. Reafirmar pendência não-relacionada (config Stripe webhook prod para clientes reais) — fora deste escopo.

---

## Self-Review (preenchido pelo autor do plano)

- **Cobertura do spec:** §1→T1; §2→T2; §3→T3(checkout)+T4(webhook); §4→T5; §5→T5(gate)+T6(?purchase=); §6→T5(copy)+T7(lista)+T6(rota); §7→todas (TDD/verificação) + T8 (validação objetiva). Sem lacunas.
- **Placeholders:** nenhum "TBD/TODO"; código completo nos passos de criação; modificações com âncoras exatas do código atual lido.
- **Consistência de tipos:** `reportFingerprint(entrada)` e `hasReportAccess({plan,paidFingerprints,currentFingerprint})` usados de forma idêntica em T3/T5/T6/consumidores; `purchases.report_fingerprint`/`simulation_id` (T1) usados igual em T3/T4/T5/T6/T7.
- **Ordem segura (push=deploy):** T1(DB)→T2(inerte)→T3(checkout escreve, gate antigo ignora)→T4(webhook persiste)→T5(aperta gate, já há fingerprint)→T6→T7. Nenhum deploy intermediário quebra prod.
