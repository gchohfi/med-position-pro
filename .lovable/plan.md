

# MedPositioning SaaS — V1

## 1. Landing Page (/)
Premium editorial landing page in Portuguese (BR) with:
- **Hero**: "Uma plataforma que entende seu posicionamento antes de criar qualquer conteúdo" + CTA "Começar diagnóstico"
- **Como funciona**: 3 steps (diagnóstico → estratégia → conteúdo)
- **Para quem é**: Medical professionals seeking strong positioning
- **O que entrega** + **Benefícios**
- **CTA final**
- Design: off-white bg, warm neutrals, graphite text, muted gold accent, serif headlines, generous whitespace, 2xl rounded cards, soft shadows

## 2. Auth (Supabase)
- Login & Signup pages with email/password
- Connected to Supabase auth
- Profiles table for user data
- Redirect to onboarding on first login, dashboard on return

## 3. Onboarding (multi-step consultive flow)
- Progress bar, one question per screen, calm transitions
- Steps: specialty, target audience, archetype, tone of voice, editorial pillars, content goals
- Card/selector/slider inputs (NOT form-like)
- Consultive microcopy ("Vamos entender quem você realmente quer atrair")
- Saves to Supabase positioning/profile tables

## 4. Dashboard
- Strategic overview: posicionamento atual, arquétipo, tom de voz, pilares editoriais, série ativa, oportunidade estratégica
- Action buttons: Analisar posicionamento, Criar nova série, Gerar conteúdo
- Clean editorial grid, high whitespace
- Mock data for V1 (populated from onboarding answers)

## 5. Produção de Conteúdo (AI-powered)
- **Step 1 — Strategic Input**: mandatory fields before generation (objetivo, tipo do conteúdo, tese central, percepção desejada) in elegant cards. CTA disabled until all filled.
- **Step 2 — AI Generation**: Edge function calls Lovable AI to generate structured 6-block output (Gancho → Quebra de percepção → Explicação → Método → Manifesto → Fechamento). Streaming response.
- **Step 3 — Actions**: Gerar carrossel, Gerar roteiro de reels, Gerar legenda, Salvar no calendário, Vincular a série
- **States**: loading (skeleton + "Estruturando raciocínio estratégico…"), empty, success

## 6. Sidebar Navigation
- Dashboard, Diagnóstico (disabled), Estratégia (disabled), Séries (disabled), Calendário (disabled), Produção
- Clean minimal sidebar with collapse support

## 7. Design System
- Colors: off-white bg (#FAFAF7), warm sand accents, graphite text, muted gold highlights
- Typography: serif for headlines (Playfair Display), Inter for body
- Components: 2xl radius cards, soft shadows, subtle borders, smooth fade-in animations
- All text in Portuguese (BR)

## Database Tables (Supabase)
- `profiles` (user_id, name, specialty, created_at)
- `positioning` (user_id, archetype, tone, pillars, target_audience, goals)
- `content_outputs` (user_id, type, strategic_input, generated_content, created_at)

