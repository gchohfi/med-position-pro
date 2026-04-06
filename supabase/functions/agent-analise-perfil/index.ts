import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callClaudeStream, buildAnthropicStream } from "../_shared/anthropic.ts";
import { requireAuth, isAuthError } from "../_shared/auth.ts";

const SYSTEM_PROMPT = `Você é um consultor estratégico de posicionamento médico digital especializado em Instagram. Analise o perfil médico fornecido e gere uma análise detalhada de posicionamento, identificando forças, lacunas, oportunidades e recomendações. Respeite a Resolução CFM 2.336/2023.

Diretrizes CFM (Resolução 2.336/2023):
- Não prometa resultados específicos de tratamentos
- Não sugira uso de antes/depois
- Não recomende divulgação de preços
- Mantenha ética médica em todas as recomendações
- Foque em conteúdo educativo e informativo

Estruture sua análise em:
1. Resumo do posicionamento atual
2. Forças identificadas
3. Lacunas e vulnerabilidades
4. Oportunidades de diferenciação
5. Recomendações prioritárias (com ações concretas)
6. Score de posicionamento (0-100) com justificativa`;

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const auth = await requireAuth(req);
    if (isAuthError(auth)) return auth;

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const { profile } = await req.json();

    const userPrompt = `Analise o seguinte perfil médico no Instagram:

Nome: ${profile.nome ?? "Não informado"}
Especialidade: ${profile.especialidade ?? "Não informada"}
Bio do Instagram: ${profile.bio_instagram ?? "Não informada"}
Público-alvo: ${profile.publico_alvo ?? "Não informado"}
Tom de voz: ${profile.tom_de_voz ?? "Não informado"}
Diferenciais: ${profile.diferenciais ?? "Não informados"}
Seguidores no Instagram: ${profile.seguidores_instagram ?? "Não informado"}

Forneça uma análise completa de posicionamento com recomendações práticas e acionáveis.`;

    const res = await callClaudeStream(apiKey, SYSTEM_PROMPT, userPrompt);
    const stream = buildAnthropicStream(res);

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
