
# Redesign Completo — Minimalista Premium

## Direção Estética
- **Inspiração**: Apple, Linear, Stripe — clean, sofisticado, muito espaço em branco
- **Tipografia**: Fonte display elegante (e.g. Instrument Serif ou similar) + sans-serif refinada (Inter/Geist)
- **Cores**: Paleta neutra com um único acento sutil. Fundo quase branco, texto grafite profundo, acento discreto
- **Espaçamento**: Generoso, respirado. Padding e margins amplos
- **Componentes**: Bordas sutis, sombras quase imperceptíveis, cantos arredondados suaves
- **Animações**: Transições suaves e elegantes com framer-motion

## Fases de Implementação

### Fase 1 — Design System (tokens + componentes base)
- Atualizar `index.css` com nova paleta de cores HSL
- Atualizar `tailwind.config.ts` com nova tipografia e tokens
- Ajustar componentes UI base (Button, Card, Input, etc.)

### Fase 2 — Landing Page (Index.tsx)
- Redesenhar hero com tipografia impactante e layout assimétrico
- Seções "Como funciona", "Para quem é", "O que entrega" com novo visual
- Novo footer e nav

### Fase 3 — Layout Interno (Sidebar + AppLayout)
- Sidebar minimalista com ícones refinados
- Layout interno com mais espaço e hierarquia clara

### Fase 4 — Páginas Internas
- Atualizar cada página (Dashboard, Produção, Diagnóstico, etc.)
- Manter toda a lógica de negócio, apenas redesenhar a apresentação

### Fase 5 — Auth e Onboarding
- Redesenhar tela de login/signup
- Redesenhar fluxo de onboarding

### Correções pendentes
- Corrigir erros de build em Biblioteca.tsx e Producao.tsx

## O que NÃO muda
- Lógica de negócio, edge functions, banco de dados
- Estrutura de rotas
- Funcionalidades existentes
