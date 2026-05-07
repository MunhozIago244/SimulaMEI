# SimulaMEI Improvement Plan

Goal: stabilize the MVP calculation flow before adding new product surface.

## Phase 1 - Correctness

- Fix the simulation input contract so the UI sends accumulated yearly revenue, and the tax engine derives projected annual revenue once.
- Use projected annual revenue for regime comparisons and Fator R calculations.
- Fix score thresholds that compare decimal ratios as if they were whole percentages.
- Add the CNAE used by the UI to classify MEI Caminhoneiro correctly.

## Phase 2 - Stability

- Add regression tests for projection, excess classification, score thresholds, Fator R and Anexo IV cost.
- Fix the Tooltip component API so both icon-only and wrapped-content usage compile.
- Add a `test` script and test dependency metadata.

## Phase 3 - Delivery Readiness

- Reinstall dependencies cleanly and generate a lockfile.
- Run `npm run test`, `npm run lint` and `npm run build`.
- Connect `/api/leads` to Supabase/Resend before using the gate as a real acquisition funnel.
