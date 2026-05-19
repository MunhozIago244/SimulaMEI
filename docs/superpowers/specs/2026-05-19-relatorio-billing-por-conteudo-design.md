# Spec — Billing do relatório por conteúdo + "Meus relatórios pagos"

- **Data:** 2026-05-19
- **Status:** Aprovado (design) — aguardando revisão do spec antes do plano
- **Branch alvo:** `claude/relatorio-pdf-redesign` (== `main` == produção)

## Problema

`src/lib/auth/report-access.ts`:

```ts
hasReportAccess(plan, purchasesCount) => plan === 'pro' || purchasesCount > 0
```

As rotas `/api/relatorio/gerar` e `/api/relatorio-premium` geram sempre da
simulação mais recente (`order by created_at desc limit 1`). Consequência:
**1 pagamento de R$ 9,90 libera geração ilimitada e vitalícia de relatório
de qualquer simulação futura**, furando o modelo "avulso = 1 relatório".
Não há vínculo compra↔conteúdo no schema (`purchases`: id, user_id, lead_id,
produto, status, valor_centavos, moeda, stripe_session_id, stripe_payment_id,
created_at, updated_at — sem fingerprint nem simulation_id).

## Objetivo

1. Quem pagou por um relatório pode **re-baixar aquele relatório** quantas
   vezes quiser.
2. Gerar um relatório **de inputs diferentes** exige novo pagamento de R$ 9,90.
3. Plano **Pro** continua ilimitado.

## Decisões (do brainstorming)

- **D1 — Unidade do direito:** o pagamento é vinculado ao **conteúdo** da
  simulação paga, não ao plano nem ao id da linha.
- **D2 — "Relatório novo":** chave de **conteúdo dos inputs** (fingerprint da
  `entrada`). Re-rodar inputs idênticos = mesmo relatório, já pago, **sem nova
  cobrança**. Só inputs diferentes = relatório novo = novo pagamento.
- **D3 — Migração:** **sem grandfathering**. Verificado por query: a única
  compra `paid` de `relatorio` é o teste do dono do mesmo dia (sem fingerprint);
  as outras 2 são `pending` (nunca pagas). Nenhum cliente real a proteger.
- **D4 — Abordagem B:** gate por fingerprint **+ seção "Meus relatórios pagos"**
  com re-download de 1 clique (sem re-digitar inputs).
- **D5 — Composição do hash:** **exclui** `taxRuleVersion` e timestamps. Pagou
  pela análise dos *seus dados*; se o motor melhorar, o relatório atualiza de
  graça. "Mesmos dados = mesmo relatório".

## Não-objetivos (YAGNI)

Pacotes de créditos; armazenar o PDF gerado; painel de reembolso; expiração de
relatório; backfill de compras antigas.

## Design

### §1. Data model / migração (aditiva)

```sql
ALTER TABLE purchases
  ADD COLUMN report_fingerprint text NULL,
  ADD COLUMN simulation_id uuid NULL REFERENCES simulations(id) ON DELETE SET NULL;

CREATE INDEX purchases_paid_fingerprint_idx
  ON purchases (user_id, report_fingerprint)
  WHERE status = 'paid';
```

- Aditivo, não-breaking. Linhas antigas ficam `NULL`. A compra-teste paga
  existente (fingerprint `NULL`) não casa com nenhuma simulação → inócua.
- `report_fingerprint`: chave de conteúdo — usada pelo gate e pela regra
  "mesmos inputs não recobram".
- `simulation_id`: a simulação concreta paga — alvo rápido de regeneração na
  lista. `ON DELETE SET NULL` para a compra (registro financeiro) sobreviver
  caso a sim seja removida; nesse caso o re-download cai no fallback por
  fingerprint (ver §5).
- **Sem backfill** (D3).

### §2. Helper `reportFingerprint(entrada)` (puro, server-only)

`src/lib/reports/reportFingerprint.ts` → `reportFingerprint(entrada): string`.

- SHA-256 (hex) de JSON **canônico** (chaves ordenadas recursivamente) dos
  campos de input normalizados: `cnae`, `tipoMei`, `mesAtual`,
  `faturamentoAcumulado`, `folhaMensal`, e `folhaDetalhada` quando presente
  (objeto normalizado; ausência ≡ campo omitido, não `null`).
- **Exclui** `taxRuleVersion`, `geradoEm` e qualquer campo derivado/volátil.
- Números normalizados para evitar `4000` vs `4000.0` divergirem (coerção
  numérica antes do stringify).
- `node:crypto` (rotas e webhook são server). Determinístico: mesmos inputs →
  mesmo hash, sempre.
- **Testes (TDD):** idempotência; ordem de chave irrelevante; `cnae` diferente →
  hash diferente; `faturamentoAcumulado` diferente → hash diferente; presença
  de timestamp/`taxRuleVersion` não muda o hash; `folhaDetalhada` ausente vs
  presente-equivalente.

### §3. Checkout → webhook

**`/api/checkout/report` (POST):**
- Busca a simulação mais recente do user (mesmo padrão das rotas de relatório).
- Se não houver simulação **ou** for vazia (`isResultadoVazio`, já existe) →
  **422** (`RELATORIO_VAZIO_MSG`-equivalente): não permite pagar por relatório
  inexistente.
- Calcula `fp = reportFingerprint(sim.entrada)`.
- `createBrandedCheckoutSession({ ..., extraMetadata: { report_fingerprint: fp,
  simulation_id: sim.id } })` (a função já suporta `extraMetadata` → vai pro
  `metadata` da sessão Stripe).
- Insere `purchases` (status `pending`) já com `report_fingerprint` e
  `simulation_id` preenchidos.

**Webhook `handleConsumerCheckoutCompleted`:**
- Ao marcar `status='paid'` (já filtra por `stripe_session_id`), também grava
  `report_fingerprint` e `simulation_id` lidos de `session.metadata`
  (defensivo/idempotente — garante preenchimento mesmo se a row pending veio
  sem). Sem `report_fingerprint` no metadata → loga warning e mantém
  comportamento atual (não quebra fulfillment).
- Fingerprint **congelado no instante do checkout** — imune a o user alterar a
  simulação depois.

### §4. Acesso — rework `hasReportAccess`

Nova assinatura:

```ts
hasReportAccess({ plan, paidFingerprints, currentFingerprint }): boolean
// = plan === 'pro' || (!!currentFingerprint && paidFingerprints.includes(currentFingerprint))
```

- Os 4 consumidores (`/api/relatorio/gerar`, `/api/relatorio-premium`,
  `/dashboard/relatorio`, `/relatorio`) passam a:
  - 1 query: `select report_fingerprint, simulation_id, created_at from
    purchases where user_id=? and produto='relatorio' and status='paid'`.
  - computar `currentFingerprint = reportFingerprint(latest.entrada)`.
- Pro continua ilimitado (ignora fingerprint).
- **Testes:** pro→true; fingerprint atual ∈ pagos→true; ∉→false;
  `currentFingerprint` vazio→false.

### §5. Rotas de relatório (gate + re-download pinado + ownership)

- **Fluxo normal (sem param):** gera da sim mais recente; gate por
  `hasReportAccess` com o fingerprint dela. Mantém guards já em produção
  (vazio→422; try/catch Stripe→502 com motivo).
- **Re-download pinado:** param opcional `?purchase=<purchaseId>`.
  - Valida: purchase pertence ao `user.id`, `status='paid'`,
    `produto='relatorio'`. Senão → 403 (não-dono) / 402 (não paga) / 404
    (inexistente).
  - Resolve a simulação alvo nesta ordem (resiliência):
    1. `purchase.simulation_id` se existir e a sim existir;
    2. senão, a sim mais recente do user cujo `reportFingerprint(entrada)
       === purchase.report_fingerprint`;
    3. senão → 422 "Relatório indisponível — refaça a simulação com os mesmos
       dados para baixá-lo de novo."
  - Regenera o PDF a partir dessa sim (não da "latest"). Acesso garantido pela
    própria purchase paga.
- `relatorio-premium` (POST): mesmo gate por fingerprint; param de re-download
  não é necessário lá (a lista usa `/api/relatorio/gerar?purchase=`).

### §6. UI

**`/dashboard/relatorio`:**
- Sim atual paga (ou pro) → "Acesso liberado / Baixar PDF" (re-download
  ilimitado dessa).
- Senão → paywall "Desbloquear **este** relatório — R$ 9,90" (CheckoutButton
  existente, endpoint `/api/checkout/report`).
- **Nova seção "Meus relatórios pagos":** lista as purchases pagas com label
  legível derivado da sim pinada/fingerprint-resolvida (ex.: "CNAE 6201-5/01 ·
  R$ 68.000 · 19/05/2026") e botão "Baixar PDF" → `/api/relatorio/gerar?
  purchase=<id>`. Item cuja sim não resolve (fallback §5.3) mostra estado
  "indisponível — refaça com os mesmos dados". A seção "Meus relatórios pagos"
  é exibida **apenas para usuários não-pro com ≥1 compra paga**; Pro vê só o
  aviso "Pro inclui relatórios ilimitados" (não precisa da lista).
- Sem compras pagas e não-pro: a seção não aparece (só o paywall acima).

**`/relatorio` (topo):** preview travado + CTA mantidos; copy ajustada — remove
qualquer implicação de "acesso vitalício", passa a "este relatório".

Lista textual no padrão dos componentes `Panel` existentes — sem dependência
visual nova.

### §7. Testes & rollout seguro

- **TDD:** `reportFingerprint` (puro) · `hasReportAccess` (novo contrato) ·
  rota gate (pago/não-pago/pro) · rota `?purchase=` (não-dono→403, não
  paga→402, ok→200 regenerando da sim pinada, fallback por fingerprint) ·
  webhook persiste `report_fingerprint`+`simulation_id`. Suíte atual 209/0 deve
  permanecer verde + novos testes.
- **Migração:** via `apply_migration` (DDL aditivo, colunas nullable). Ordem
  segura: **migration aplicada → depois deploy do código** (código novo tolera
  `NULL`; código antigo ignora colunas novas → janela de deploy segura nos dois
  sentidos). Sem backfill.
- **Verificação:** `vitest` verde, `tsc` limpo, `next build` ok + trace da
  fonte intacto, render real de um re-download pinado (teste descartável),
  commits atômicos PT-BR co-author, push fast-forward `main`+PR branch,
  monitorar deploy Vercel até `success`, validação **objetiva** via query nas
  `purchases` após uma compra-teste (campos `report_fingerprint`/`simulation_id`
  preenchidos; gate concede só ao fingerprint pago).

## Pendência não-relacionada (registrada, fora deste escopo)

O webhook Stripe processou a compra-teste (`paid`), mas a configuração de
produção (`STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` na conta
`acct_1TTKLZGXLVbyyFJn` Live) ainda precisava de validação ponta-a-ponta para
clientes reais — tratar separadamente.
