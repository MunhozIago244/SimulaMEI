# CNAE Opportunity Engine Design

Date: 2026-04-29

## Decision

Build the next phase as a **tax opportunity engine**. The CNAE explorer is the interface, and the official-source pipeline is the audit layer.

The product should not sell "CNAE lookup". It should sell a documented diagnosis that estimates legal tax opportunities, risks, and next actions.

## Product Shape

- Free: official CNAE lookup, basic status, and simple warnings.
- Diagnostic: opportunity list with estimated annual impact.
- Monitor: monthly re-checks, rule changes, Fator R alerts, and ceiling alerts.
- Accountant/B2B: qualified leads and technical reports.
- API: tax engine as infrastructure for accountants and ERPs.

## Core Objects

### `CnaeTaxProfile`

Stores curated tax classification for a CNAE.

- cnae
- status: `draft | reviewed | approved | blocked`
- defaultAnexo
- possibleAnexos
- fatorREligible
- meiStatus
- category
- sources
- reviewedAt
- reviewedBy

### `TaxOpportunity`

Stores an opportunity generated for a user.

- id
- type
- title
- description
- estimatedAnnualImpact
- risk
- confidence
- requiredInputs
- legalBasis
- sources
- ruleVersion
- recommendedActions
- blockers

### `EvidenceSource`

Tracks why a recommendation exists.

- sourceId
- owner
- url
- fileHash
- fetchedAt
- appliesTo
- notes

## First Opportunity Rules

1. Fator R opportunity: compare Anexo V vs III and calculate minimum monthly pro-labore.
2. MEI ceiling risk: project revenue, classify mild/severe excess, estimate urgency.
3. Regime comparison: compare Simples, Presumido, and Real using current engine.
4. MEI Caminhoneiro ceiling: apply specific ceiling for transport cargo CNAE.

## UI

Add a CNAE detail page:

- `/cnae/[codigo]`
- official identity
- hierarchy
- tax curation status
- MEI/SN/Fator R cards
- opportunities
- evidence/source block
- next-action checklist

## Safety Rules

- Never show uncurated official CNAEs as tax-ready.
- Use "estimated opportunity", not guaranteed savings.
- Every premium recommendation needs a source, rule version, confidence level, and action.
- Recommendations without enough evidence must be marked as pending validation.

## Current Project Audit

- Next.js 16.2.4, React 19.2.4, TypeScript strict.
- Official CNAE catalog imported from IBGE/CONCLA with 1,331 records.
- Monthly GitHub Actions source monitor exists.
- `npm run cnae:check`, `npm run test`, `npm run lint`, and `npm run build` pass on 2026-04-29.
- Tax curation is still limited to the existing curated map.
- No database, auth, payment, or persistent lead capture is implemented yet.

## Implementation Sequence

1. Add typed schemas for tax profiles, opportunities, and evidence.
2. Add opportunity engine with Fator R, ceiling, and regime comparison rules.
3. Add CNAE detail page.
4. Add opportunity preview in the simulation result.
5. Add source/evidence display.
6. Add premium report gate.

## Implementation Slice 1

Status: implemented on 2026-04-29.

Included:

- typed fiscal opportunities;
- source/evidence references;
- Fator R opportunity rule;
- MEI ceiling opportunity rule;
- regime comparison opportunity rule;
- opportunity panel in the unlocked result page;
- CNAE detail helper and `/cnae/[codigo]` route;
- autocomplete affordance to open official CNAE detail pages.

Out of scope for this slice:

- payments;
- PDF generation;
- Supabase persistence;
- automated accountant review workflow;
- AI CNAE diagnosis;
- NFS-e integration.
