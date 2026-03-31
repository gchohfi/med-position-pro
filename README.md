# MEDSHIFT — Posicionamento Estratégico para Médicos

Sistema SaaS premium de posicionamento estratégico e geração de conteúdo para profissionais médicos no Instagram, com inteligência artificial integrada.

## Funcionalidades

- **Diagnóstico Estratégico** — Análise completa do posicionamento atual do médico
- **Motor de Conteúdo** — Geração de teses, percepções e conteúdo estratégico com IA
- **Séries Editoriais** — Planejamento de séries de conteúdo temáticas
- **Calendário Editorial** — Organização e planejamento de publicações
- **Radar de Mercado** — Monitoramento de tendências e concorrência
- **Radar Instagram** — Inteligência estratégica de posicionamento no Instagram
- **Memória Viva** — Registro evolutivo do posicionamento ao longo do tempo
- **Produção** — Transformação de conteúdo em formatos (carrossel, reels, legenda)

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| IA | Google Gemini 2.5 Flash + Perplexity Sonar (opcional) |
| Deploy | Netlify (frontend) + Supabase (backend) |

## Configuração

### Variáveis de Ambiente (Frontend)

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-anon-key
```

### Secrets do Supabase (Edge Functions)

Configure no dashboard do Supabase em **Project Settings > Edge Functions > Secrets**:

- `GEMINI_API_KEY` — Chave da API do Google Gemini
- `PERPLEXITY_API_KEY` — Chave da API do Perplexity (opcional, para pesquisa web)

### Desenvolvimento Local

```bash
pnpm install
pnpm dev
```

### Build de Produção

```bash
pnpm build
```

### Deploy das Edge Functions

```bash
supabase functions deploy --project-ref SEU_PROJECT_REF
```

## Estrutura do Projeto

```
src/
├── components/     # Componentes React reutilizáveis
├── contexts/       # Contextos (Auth)
├── hooks/          # Custom hooks
├── integrations/   # Configuração Supabase
├── lib/            # Utilitários e eventos estratégicos
├── pages/          # Páginas da aplicação
supabase/
├── functions/      # Edge Functions (Deno)
│   ├── _shared/    # Módulo compartilhado (Gemini helper, CORS)
│   ├── generate-*/ # Funções de geração com IA
│   └── ...
├── migrations/     # Migrações SQL do banco de dados
```

## Licença

Projeto privado. Todos os direitos reservados.
