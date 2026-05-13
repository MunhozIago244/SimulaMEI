---
name: SimulaMEI
description: Motor tributário educacional para MEI — simula teto, Fator R e comparativo de regimes.
colors:
  bg-void: "oklch(8% 0.012 255)"
  bg-base: "oklch(12% 0.018 255)"
  bg-raised: "oklch(17% 0.022 255)"
  bg-lifted: "oklch(22% 0.024 255)"
  border-subtle: "oklch(25% 0.022 255)"
  border-strong: "oklch(33% 0.026 255)"
  text-primary: "oklch(94% 0.012 115)"
  text-secondary: "oklch(70% 0.018 255)"
  text-tertiary: "oklch(63% 0.018 255)"
  ink-on-accent: "oklch(10% 0.018 130)"
  lime: "oklch(88% 0.19 126)"
  lime-dim: "oklch(62% 0.12 126)"
  blue: "oklch(68% 0.15 252)"
  yellow: "oklch(82% 0.15 85)"
  orange: "oklch(73% 0.18 52)"
  red: "oklch(66% 0.21 28)"
typography:
  display:
    fontFamily: "'Space Grotesk', sans-serif"
    fontSize: "clamp(28px, 4vw, 48px)"
    fontWeight: 900
    lineHeight: 0.98
    letterSpacing: "0"
  headline:
    fontFamily: "'Space Grotesk', sans-serif"
    fontSize: "clamp(20px, 2.5vw, 28px)"
    fontWeight: 850
    lineHeight: 1.1
  body:
    fontFamily: "'Space Grotesk', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "11px"
    fontWeight: 850
    letterSpacing: "0.04em"
  mono:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "13px"
    fontWeight: 700
rounded:
  base: "7px"
  lg: "8px"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink-on-accent}"
    rounded: "{rounded.base}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink-on-accent}"
  button-secondary:
    backgroundColor: "{colors.bg-base}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.base}"
    padding: "10px 20px"
  button-secondary-hover:
    backgroundColor: "{colors.bg-raised}"
    textColor: "{colors.text-primary}"
  metric-card:
    backgroundColor: "{colors.bg-raised}"
    rounded: "{rounded.base}"
    padding: "{spacing.md}"
  input-text:
    backgroundColor: "{colors.bg-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.base}"
    padding: "10px 12px"
---

# Design System: SimulaMEI

## 1. Overview

**Creative North Star: "The Fiscal Terminal"**

SimulaMEI is built like the tool a sharp accountant would use at their own desk: dense but never noisy, precise but never cold. The visual language borrows from instrument panels and operational dashboards, not from marketing sites or government portals. Every element is on the surface to earn its place; decoration is a tax the interface refuses to pay.

The default theme is dark because the primary user is a MEI consulting their numbers at night on a phone, or in a browser tab open between work tasks. The darkness is not aesthetic posturing; it reduces eye strain during real use and makes the high-contrast lime signals pop without screaming. The lime accent is not chosen for brand differentiation — it is the signal color, the "positive, actionable, go" color in a traffic-light vocabulary where yellow is warning and orange is risk.

This system explicitly rejects the bureaucratic density of government fiscal portals (e-CAC, Receita Federal), the upsell noise of online accounting services, and the inflated hero-metric template of generic SaaS dashboards. Numbers appear before explanations. Confidence comes from showing the data source, not from decorative trust badges.

**Key Characteristics:**
- Dark-mode-first with a subtle blue-tinted void as the base layer
- Lime as the single signal accent: actionable, affirmative, scarce
- Space Grotesk for structural copy; JetBrains Mono for values, labels, and codes
- Instrument-panel framing: raised surfaces with header rules, not floating cards
- Motion is responsive, not choreographed: state feedback only, expo-out easing

## 2. Colors: The Terminal Palette

Five layers of dark depth plus a four-signal accent vocabulary. The palette is legible at arm's length on a phone screen and clinical in a browser at a desk.

### Primary
- **Signal Lime** (`oklch(88% 0.19 126)`): The single affirmative action color. Used on primary CTAs, toggle-on state, active nav items, slider thumbs, and focus rings. Appears on less than 15% of any screen. Its rarity makes it trustworthy.
- **Signal Lime Dim** (`oklch(62% 0.12 126)`): Subdued lime for secondary mentions, evidence dot indicators, and quiet links. Never used for interactive primary states.

### Secondary
- **Informational Blue** (`oklch(68% 0.15 252)`): Context, footnotes, tooltip trigger states. The "i" color. Not an alert; purely explanatory.

### Tertiary
- **Caution Yellow** (`oklch(82% 0.15 85)`): Fiscal warnings that require attention but not immediate action (approaching teto, rate change).
- **Risk Orange** (`oklch(73% 0.18 52)`): Active risk signal. Fator R unfavorable, regime change recommended. More urgent than yellow, not an error.
- **Error Red** (`oklch(66% 0.21 28)`): Form validation errors, critical fiscal alerts only. Rare by design; overuse desensitizes.

### Neutral
- **Void** (`oklch(8% 0.012 255)`): Page background. Deep blue-tinted near-black. Never pure black.
- **Base** (`oklch(12% 0.018 255)`): Primary surface, instrument panels, cards.
- **Raised** (`oklch(17% 0.022 255)`): Elevated content areas, inputs, metric cards.
- **Lifted** (`oklch(22% 0.024 255)`): Hover targets, pill backgrounds, toggle tracks.
- **Border Subtle** (`oklch(25% 0.022 255)`): Default borders, dividers between panels.
- **Border Strong** (`oklch(33% 0.026 255)`): Active borders, strong separators, slider fill areas.
- **Text Primary** (`oklch(94% 0.012 115)`): Body copy, headings. Slightly warm toward lime hue.
- **Text Secondary** (`oklch(70% 0.018 255)`): Labels, secondary information, helper text.
- **Text Tertiary** (`oklch(63% 0.018 255)`): Uppercase labels, instrument headers, metadata.
- **Ink on Accent** (`oklch(10% 0.018 130)`): Dark text rendered on lime backgrounds (buttons, active nav).

### Named Rules
**The One Signal Rule.** Lime is used for one thing: affirmative action or confirmed status. It does not appear as decoration, dividers, or hover tints. When everything is lime, nothing is.

**The Traffic Light Contract.** Lime = go / confirmed. Yellow = caution / approaching limit. Orange = risk / review needed. Red = error / blocked. This vocabulary is fixed across the entire product. Never use red for brand color; never use lime for a warning.

## 3. Typography

**Display Font:** Space Grotesk (with sans-serif fallback)
**Body Font:** Space Grotesk (with sans-serif fallback)
**Label/Mono Font:** JetBrains Mono (with monospace fallback)

**Character:** Space Grotesk is geometric but human, condensed enough to be efficient at high weight without feeling mechanical. JetBrains Mono brings numerical precision to values and codes without the coldness of a traditional terminal font. Together they read as "a person who knows their numbers."

### Hierarchy
- **Display** (900, `clamp(28px, 4vw, 48px)`, lh 0.98): Section titles on the marketing surface. Never inside instrument panels.
- **Headline** (850, `clamp(20px, 2.5vw, 28px)`, lh 1.1): Panel titles, modal headers, result summaries.
- **Title** (800, 17px, lh 1.3): Sub-panel headings, category labels inside result cards.
- **Body** (400, 16px, lh 1.5, max 68ch): Explanatory copy. Line length capped at 68ch.
- **Label Mono** (850, 11px, uppercase, ls 0.04em): Instrument panel headers, metric card labels, status badges. Always JetBrains Mono. Always uppercase.
- **Value Mono** (700, 13–18px, lh 1.2): Numeric outputs, currency values, CNAE codes. Always JetBrains Mono. Tabular figures where available.

### Named Rules
**The Number-First Rule.** Fiscal values always appear in Value Mono before any prose explanation. A result page leads with the number; the context follows below, smaller.

**The Uppercase Label Contract.** All instrument panel headers and metric card labels are uppercase mono at 11px with 0.04em tracking. This is the only sanctioned use of uppercase text. Section headings and body copy are mixed case.

## 4. Elevation

This system uses tonal layering as its primary depth mechanism: each surface step is a lighter shade of the same blue-tinted neutral. Shadows are used sparingly, only to frame major panels and create ambient glows under accent interactions.

The body sits on **Void**. Instrument panels and cards float on **Base**. Content within those panels uses **Raised**. Interactive targets and hover states step up to **Lifted**. This creates four readable depth steps without any shadow on most elements.

### Shadow Vocabulary
- **Panel Shadow** (`0 26px 80px oklch(2% 0.01 255 / 0.34)`): Major instrument panels and the simulator container. Creates separation from the page background without a harsh edge.
- **Lime Glow** (`0 18px 54px oklch(88% 0.19 126 / 0.12)`): Applied on hover to primary lime-background actions. A diffuse ambient bloom, not a hard drop shadow.
- **Blue Glow** (`0 18px 54px oklch(68% 0.15 252 / 0.12)`): Informational panel accents. Rare.

### Named Rules
**The Flat-by-Default Rule.** Metric cards, inputs, and secondary elements carry no shadow at rest. Shadow appears only in response to interaction (hover on a primary CTA) or to frame a top-level structural panel. Anything with a shadow must deserve it.

## 5. Components

### Buttons
Tactile and direct; weight signals hierarchy, not size alone.

- **Shape:** Gently rounded (7px radius). Consistent across all variants.
- **Primary:** Lime background (`--lime`), dark ink text (`--ink-on-accent`), font-weight 850. Padding 10px 20px. On hover: lime glow shadow appears; no color change. On active: scale down to 97.5% (`--press-scale`).
- **Secondary:** Base background (`--bg1`), 1px subtle border, text-secondary. On hover: border strengthens, text shifts to primary. Same active scale.
- **Quiet Link:** Lime text, 13px, weight 850, no underline. On hover: text shifts to primary. Used for inline actions within panels.
- **Focus visible:** 2px lime outline, 2px offset, radius matches button.

### Instrument Panels
The signature container pattern. Not a floating card; a framed operational surface.

- **Background:** `--bg1` with a faint top-edge gradient (`oklch(100% 0 0 / 0.025) → transparent`).
- **Border:** 1px `--border`, radius 8px (`--radius-lg`).
- **Shadow:** `--panel-shadow`.
- **Header Strip:** Flex row, 13px 16px padding, 1px bottom border `--border`, 1.8% white overlay for slight lift. Label in uppercase mono (`--instrument-label`).
- **Never nest instrument panels.** If content needs further grouping inside a panel, use metric cards or horizontal rules.

### Metric Cards
Dense, scannable data cells. Used inside panels and dashboards.

- **Background:** `--bg2`, 1px `--border`, 7px radius, 16px padding.
- **Label:** Uppercase mono 11px, `--text3`, 8px bottom margin.
- **Value:** 18px, weight 850, `--text1`, lh 1.2, `overflow-wrap: anywhere` for long currency strings.

### Inputs / Fields
- **Style:** `--bg2` background, 1px `--border2`, 7px radius. Mono font, 13px, weight 700 for numeric inputs.
- **Focus:** Border shifts to `--lime`. No outline; the border color change is the focus indicator for non-WCAG contexts. `focus-visible` retains the 2px lime outline for keyboard users.
- **Disabled:** Opacity 0.5, cursor not-allowed.
- **Range Slider:** 4px track with lime fill, 20px circular lime thumb with bg0 inner border ring. Scales to 120% on hover.
- **Toggle:** 42×24px pill. Off: `--bg3`. On: `--lime`. Knob transitions 200ms.

### Evidence Pills
Inline data provenance tags. Used to show what inputs were used in a calculation.

- **Style:** `--bg2` background, 1px `--border`, 7px radius, 5px 9px padding, 12px weight 750 text.
- **Indicator:** 6px lime dot with a 3px radius ring at 12% opacity, left of the text. This dot signals "confirmed input", not a decorative bullet.

### Navigation (Floating Section Nav)
- **Container:** Fixed bottom pill, backdrop-blur(14px) + `--bg1` at 86% opacity, 1px `--border`, pill radius, 20px 54px panel shadow.
- **Items:** 34px min-height, 12px weight 800, 180ms transitions.
- **Active state:** Lime background, ink-on-accent text. No indicator dot; the background IS the active state.
- **Hover:** `--bg2` background, text shifts to primary, 1px upward translate.

### Tooltip
- **Trigger:** 15px circle, `--border2` background. On hover/focus: shifts to `--blue`.
- **Box:** `--bg2`, 1px `--border2`, 220px width, 12px 12px padding, opacity transition.

## 6. Do's and Don'ts

### Do:
- **Do** show the fiscal result (value in mono) before any explanatory text. The number leads; the context follows.
- **Do** use `--lime` exclusively for affirmative, actionable, or confirmed states. Its scarcity is its signal value.
- **Do** use uppercase JetBrains Mono at 11px (letter-spacing 0.04em) for all instrument labels and metric card headers.
- **Do** cap body explanatory text at 68ch line length.
- **Do** use `--yellow` and `--orange` for fiscal alerts before reaching for `--red`. Red is for blocked or errored states only.
- **Do** name the source of every calculated value: which CNAE was used, which year's table, which input was assumed.
- **Do** apply `--panel-shadow` to top-level instrument panels and the simulator container. Nowhere else.
- **Do** support `prefers-reduced-motion`: all animations reduce to 1ms when the system preference is active.
- **Do** include `aria-current` on active nav items and `focus-visible` outlines on all interactive elements.

### Don't:
- **Don't** use portals governamentais as a visual reference: no dense form tables, no blue-gray headers, no "official seal" aesthetics.
- **Don't** use the hero-metric template: big number centered with a gradient accent and supporting stats below. This is the SaaS dashboard cliché the system rejects.
- **Don't** use online accounting service patterns: chat widgets, aggressive upsell banners, "speak with an expert" overlays that compete with the content.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe on cards, alerts, or callouts. Use full borders, background tints, or leading indicators (the lime dot) instead.
- **Don't** use gradient text (`background-clip: text`). Emphasis is through weight and size, not decoration.
- **Don't** nest instrument panels. A panel inside a panel is always the wrong structure.
- **Don't** use red (`--red`) for fiscal warnings. Red is reserved for form errors and blocked states. Overuse destroys the traffic-light vocabulary.
- **Don't** use glassmorphism decoratively. The floating nav uses backdrop-blur for a functional reason (readability over content). Nowhere else.
- **Don't** add legal disclaimers as inline body text interrupting the result flow. The site's positioning is educational and non-juridical; that is communicated once in the layout, not repeated on every panel.
- **Don't** use `#000` or `#fff`. The darkest value is `--bg-void` (`oklch(8% 0.012 255)`); the lightest text is `--text-primary` (`oklch(94% 0.012 115)`).
