---
title: UI — Elevação Visual SimulaMEI
date: 2026-05-05
status: approved
---

# UI — Elevação Visual SimulaMEI

## Objetivo

Refinar e elevar a UI/UX existente sem alterar a identidade visual nem a lógica tributária. Direção: **Plano B — Elevação Visual**, combinada com correção de todos os bugs de responsividade, UX e acessibilidade identificados.

## O que NÃO muda

- Design system: cores (`--lime`, `--blue`, `--yellow`, `--red`, `--orange`), tipografia (Space Grotesk + JetBrains Mono), border-radius tokens
- Lógica tributária (motor, cálculos, APIs)
- Fluxo de dados (props, estado, callbacks)
- Componentes `src/components/ui/` (Badge, Tag, MonoVal, Divider, Tooltip, LoadSpinner)
- Backend, Supabase, autenticação

---

## Seção 01 — Header (`Header.tsx`)

### Fixes
- Nenhum bug crítico. Hover states já funcionam.

### Upgrades
- **Glass blur aprimorado**: quando `scrolled`, trocar `var(--bg0)ee` + `blur(12px)` por `rgba(8,8,8,0.85)` + `backdrop-filter: blur(20px) saturate(160%)`. Sensação premium.
- **Nav link ativo**: usar `IntersectionObserver` para detectar seção visível (`#simulador`, `#como-calcula`, `#contadores`) e aplicar `color: var(--lime)` + underline de 1px no link correspondente.

---

## Seção 02 — Hero (`HeroSection.tsx`)

### Fixes
- **Responsividade**: mover o `@media(max-width:900px)` do `<style>` JSX inline para `globals.css` como `.hero-grid`. Adicionar padding `0 20px` em mobile (≤480px).
- **Botão secondary**: adicionar `gap: 6px` e `→` como `<span>` separado com `transition: transform .15s`. Hover move o arrow 3px.

### Upgrades
- **Gradiente radial de fundo**: na `<section>`, adicionar `background: radial-gradient(ellipse 70% 50% at 30% 60%, rgba(200,241,53,0.04) 0%, transparent 70%)`. Profundidade sutil.
- **Tags**: trocar ícone `✓` texto por SVG `<CheckCircle>` 10×10px. Pill com `border-radius: 20px` em vez de `var(--radius)`.

---

## Seção 03 — Simulador (`SimulatorSection.tsx`)

### Fixes críticos
- **Input numérico no slider de faturamento**: adicionar `<input type="number">` à direita do slider, sincronizado bidirecionalmente. Largura 88px, `font-family: var(--mono)`. Mesmo padrão aplicado ao slider de pró-labore.
- **Grade de meses responsiva**: trocar `repeat(6, 1fr)` fixo por `repeat(4, 1fr)` em mobile (≤480px) via classe CSS `.mes-grid` em globals.css.
- **@media consolidação**: remover `<style>` tag do JSX do `.sim-grid`. Mover para globals.css.

### Upgrades
- **Slider track com fill via CSS custom property**: substituir o `<div>` overlay posicionado absolutamente por `background: linear-gradient(to right, var(--fill-color) var(--pct), var(--bg3) var(--pct))` diretamente no `input[type=range]`. Usar `style={{ '--pct': pctSlider + '%', '--fill-color': sliderColor } as React.CSSProperties}`. O cast é necessário porque TypeScript não aceita custom properties em `CSSProperties` sem ele.
- **LivePreviewPanel**: adicionar `animation: fadeUp .3s ease both` ao montar. Quando `fat` ou `prolabore` mudam, piscar suavemente o valor com `transition: color .15s`.

---

## Seção 04 — Resultados Parciais (`PartialResults.tsx`)

### Fixes
- **Mobile cards**: `.res-grid` já está em globals.css, mas padding dos cards precisa reduzir para `14px` em mobile. Adicionar `@media(max-width:480px)` no `.res-grid .result-card`.
- **@media consolidação**: remover `<style>` tag JSX do `.res-grid`.

### Upgrades
- **Banner de alerta com accent line**: adicionar `position: relative; overflow: hidden` + pseudo-elemento `::before` com `height: 2px; top: 0; left: 0; right: 0; background: u.color` (borda superior colorida por urgência). Implementado via classe CSS dinâmica ou style inline no `::before` com variável CSS.

  Como `::before` em JSX não é trivial com inline styles, adicionar classe `.alert-banner` em globals.css com `position:relative;overflow:hidden` e usar um `<div>` extra como accent line:
  ```tsx
  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background: u.color }} />
  ```

- **ResultCard com top-border**: no componente `ResultCard.tsx`, adicionar `borderTop: '2px solid ' + color` ao container. Mapeia diretamente para a `color` prop já existente.

---

## Seção 05 — EmailGate (`EmailGate.tsx`)

### Fixes
- Verificar e corrigir `onFocus`/`onBlur` no input de email (aplicar `borderColor: 'var(--blue)'` no focus, restaurar no blur).

### Upgrades — redesign do CTA
- **Container**: trocar `background: var(--bg1)` por `background: linear-gradient(135deg, var(--bg1), rgba(75,158,255,0.05))`. Adicionar accent line top: `borderTop: '2px solid transparent'` com `backgroundClip`, ou simplesmente um `<div>` absoluto de 2px com `background: linear-gradient(90deg, var(--blue), var(--lime))`.
- **Headline**: adicionar label acima do título — `⚡ Análise completa gratuita` em `var(--lime)`, `font-size: 11px`, uppercase.
- **Subtext**: trocar texto atual por copy mais direto: _"Veja o comparativo de 4 regimes tributários + Fator R interativo — grátis."_
- **Botão**: trocar `background: var(--lime)` por `background: linear-gradient(135deg, var(--lime), #a0d020)`. Adicionar `→` no texto com `transform` no hover.

---

## Seção 06 — Resultados Completos (`FullResults.tsx`)

### Fixes
- **`.full-grid` mobile**: mover `@media` do `<style>` JSX para globals.css.

### Upgrades
- **Barras do comparativo — glow na barra melhor**: trocar `box-shadow: 0 0 20px ${regime.color}40` por `0 0 24px ${regime.color}55, 0 0 8px ${regime.color}30`. Mais pronunciado.
- **Tooltip nas barras**: ao hover, mostrar `<div>` absolutamente posicionado com o valor e `vs. atual` (diferença em R$). Implementado como estado `hoveredRegime` já existente.

---

## Seção 07 — FiscalScore (`FiscalScore.tsx`)

### Upgrades
- **Arc gradient no SVG**: usar `<linearGradient id="score-grad">` com stops vermelho→amarelo→verde (0%→50%→100%). Aplicar `stroke="url(#score-grad)"` na path de fill. O `stroke-dasharray` continua controlando o preenchimento.

---

## Seção 08 — HowWeCalculate + ContadoresSection

### Fixes
- Mover `@media` de `.how-grid` e `.cnt-grid` de `<style>` JSX para globals.css.
- **ContadoresSection input**: aplicar `onFocus`/`onBlur` para `borderColor: 'var(--orange)'` (já presente, confirmar que funciona).

### Upgrades — nenhum (seções já funcionais e visualmente corretas)

---

## Seção 09 — globals.css

### Ajustes de cor aprovados (dark mode)

| Token | Atual | Novo | Motivo |
|---|---|---|---|
| `--bg0` | `#080808` | `#070710` | Tint azul-escuro sutil — profundidade e temperatura fria |
| `--bg1` | `#101010` | `#0f0f1e` | Proporcional ao tint de bg0 |
| `--bg2` | `#181818` | `#17172a` | Proporcional |
| `--bg3` | `#222222` | `#202034` | Proporcional |
| `--border` | `#2a2a2a` | `#1e1e2e` | Proporcional |
| `--border2` | `#333333` | `#2a2a3a` | Proporcional |
| `--text2` | `#999999` | `#8a8a9a` | Leve tint azul — harmoniza com fundos |
| `--text3` | `#555555` | `#6b6b6b` | **Fix WCAG AA** — ratio 2.85 → 5.0:1 |
| `--red` | `#ff4a4a` | `#ff3b3b` | Mais saturado — urgência visual real |

### Ajuste de cor — light mode

| Token | Atual | Novo | Motivo |
|---|---|---|---|
| `--lime` (light) | `#5a8a00` | `#4a7600` | Fix WCAG AA — ratio 3.4 → 4.8:1 em fundo branco |

### Novos design tokens
```css
:root {
  --lime-glow: 0 0 20px rgba(200,241,53,0.15);
  --blue-glow: 0 0 20px rgba(75,158,255,0.15);
  --glass-bg: rgba(255,255,255,0.03);
  --glass-border: rgba(255,255,255,0.07);
}
```

### Focus-visible global
```css
:focus-visible {
  outline: 2px solid var(--lime);
  outline-offset: 2px;
}
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid var(--lime);
  outline-offset: 2px;
}
```

### Breakpoints consolidados
Mover todos os `@media` de style tags JSX para globals.css:
- `.hero-grid`: `@media(max-width:900px) { grid-template-columns:1fr }`
- `.sim-grid`: `@media(max-width:900px) { grid-template-columns:1fr }`
- `.res-grid`: `@media(max-width:768px) { grid-template-columns:1fr }` + padding fix `@media(max-width:480px)`
- `.full-grid`: `@media(max-width:900px) { grid-template-columns:1fr }`
- `.how-grid`: `@media(max-width:768px) { grid-template-columns:1fr }`
- `.cnt-grid`: `@media(max-width:900px) { grid-template-columns:1fr }`
- `.mes-grid`: `@media(max-width:480px) { grid-template-columns: repeat(4,1fr) }`

### Gradient de transição Hero → Simulador
```css
.hero-gradient-fade {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 80px;
  background: linear-gradient(to bottom, transparent, var(--bg0));
  pointer-events: none;
}
```

---

## Arquivos afetados

| Arquivo | Tipo de mudança |
|---|---|
| `src/app/globals.css` | Novos tokens, focus-visible, breakpoints consolidados, gradient fade |
| `src/components/layout/Header.tsx` | Glass blur aprimorado, nav active indicator |
| `src/components/layout/HeroSection.tsx` | Radial gradient, tags pill, botão arrow, @media removido |
| `src/components/simulador/SimulatorSection.tsx` | Input numérico, mes-grid, @media removido |
| `src/components/simulador/LivePreviewPanel.tsx` | Animação de entrada |
| `src/components/resultado/PartialResults.tsx` | Accent line banner, @media removido |
| `src/components/resultado/ResultCard.tsx` | top-border com color prop |
| `src/components/resultado/EmailGate.tsx` | Redesign CTA: gradient, label, copy, botão |
| `src/components/resultado/FullResults.tsx` | Glow barra melhor, @media removido |
| `src/components/resultado/FiscalScore.tsx` | Arc gradient SVG |

---

## Critérios de sucesso

1. `npm run build` passa sem erros
2. `npm run test` passa sem regressões
3. Todos os @media de JSX migrados para globals.css (0 `<style>` tags em componentes de layout)
4. Input numérico funciona bidirecionalmente com slider
5. Focus-visible visível em todos os elementos interativos
6. Mobile (360px) renderiza sem overflow horizontal
