

# V2 — Diagnóstico + Estratégia

## Overview

Two new AI-powered pages that read the user's onboarding data (positioning table) and generate strategic analysis via Lovable AI. This is the intelligence layer that differentiates the product.

## Architecture

Both pages fetch the user's `positioning` data from the database, then call a new edge function (`generate-diagnosis`) that uses Lovable AI to produce structured strategic output. Results are cached in a new `diagnosis_outputs` table so the analysis persists and doesn't re-generate on every page load.

```text
positioning (DB) → edge function → AI analysis → diagnosis_outputs (DB)
                                                        ↓
                                              /diagnostico page
                                              /estrategia page
```

## Database Changes

**New table: `diagnosis_outputs`**
- `id` UUID PK
- `user_id` UUID (references auth.users, unique — one active diagnosis per user)
- `diagnosis` JSONB (posicionamento_atual, forcas, lacunas, incoerencias, oportunidades, maturidade, arquetipo_principal, arquetipo_secundario, direcao_recomendada)
- `estrategia` JSONB (macro_objetivo, pilares_editoriais, tom_recomendado, nivel_sofisticacao, formatos_prioritarios, diferenciacao)
- `created_at`, `updated_at`
- RLS: users can only read/insert/update their own row

## New Edge Function: `generate-diagnosis`

- Receives `{ positioning, specialty, action: "diagnostico" | "estrategia" }`
- Uses Lovable AI (gemini-3-flash-preview) with a detailed system prompt for strategic medical positioning analysis
- Returns structured JSON (non-streaming, using tool calling for reliable structured output)
- Saves result to `diagnosis_outputs` table

## New Pages

### `/diagnostico` — Diagnóstico Estratégico

- Fetches user's positioning + existing diagnosis from DB
- If no diagnosis exists, shows CTA "Gerar diagnóstico" with loading state ("Analisando seu posicionamento...")
- If no onboarding complete, shows empty state directing to onboarding
- **Blocks displayed (premium cards):**
  1. Posicionamento atual percebido (2-3 paragraphs)
  2. Forças do perfil (up to 5 bullet points)
  3. Lacunas estratégicas
  4. Incoerências (misalignments between tone/audience/content)
  5. Oportunidades
  6. Maturidade digital (visual progress bar: iniciante → estruturando → estratégico → avançado)
  7. Arquétipo de Posicionamento (principal + secundário, from 5 types)
  8. Direção recomendada (Atual vs Ideal side-by-side)
- CTA at bottom: "Ver estratégia" → navigates to `/estrategia`

### `/estrategia` — Direcionamento Estratégico

- Fetches same `diagnosis_outputs` row (estrategia JSONB)
- If no estrategia generated yet, triggers generation
- **Blocks displayed:**
  1. Macro-objetivo (clear phrase)
  2. Pilares editoriais (3-5 pillars, each with name + description + content type)
  3. Tom recomendado (explanatory text)
  4. Nível de sofisticação (visual: básico → intermediário → premium)
  5. Formatos prioritários (carrossel, reels, etc.)
  6. Diferenciação estratégica
- CTA: "Criar conteúdo com base nessa estratégia" → navigates to `/producao` with query params for pre-fill

## File Changes

| File | Change |
|------|--------|
| `supabase/functions/generate-diagnosis/index.ts` | New edge function |
| `src/pages/Diagnostico.tsx` | New page |
| `src/pages/Estrategia.tsx` | New page |
| `src/App.tsx` | Add routes for `/diagnostico` and `/estrategia` |
| `src/components/AppSidebar.tsx` | Enable Diagnóstico and Estratégia nav items |
| `src/pages/Dashboard.tsx` | Update "Analisar posicionamento" button to link to `/diagnostico` |
| `src/pages/Producao.tsx` | Read query params to pre-fill strategic inputs from estratégia |
| DB migration | Create `diagnosis_outputs` table with RLS |

## States (both pages)

- **Loading**: Skeleton cards + "Analisando seu posicionamento..." / "Construindo sua estratégia..."
- **Empty**: "Complete seu onboarding para gerar o diagnóstico" with link to `/onboarding`
- **Success**: Full card layout with subtle confirmation toast
- **Regenerate**: Button to re-run analysis (updates existing row)

## Design

Maintains existing V1 system: Playfair Display headings, Inter body, off-white bg, muted gold accent, 2xl rounded cards, generous whitespace. Report-like reading flow — no clutter, editorial feel.

