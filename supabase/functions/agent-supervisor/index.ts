import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o supervisor do squad de IA médica para Instagram. Sintetize as análises disponíveis e forneça um panorama estratégico integrado com prioridades de ação. Respeite a Resolução CFM 2.336/2023.

Diretrizes CFM (Resolução 2.336/2023):
- Não prometa resultados específicos de tratamentos
- Não sugira uso de antes/depois
- Não recomende divulgação de preços
- Mantenha ética médica em todas as recomendações
- Foque em conteúdo educativo e informativo

Como supervisor, você deve:
1. Integrar as análises de todos os agentes (perfil, concorrência, tendências, estratégia, métricas)
2. Identificar convergências e divergências entre as análises
3. Priorizar ações com base no impacto esperado
4. Criar um plano de ação consolidado com timeline
5. Destacar quick wins (ações de alto impacto e baixo esforço)
6. Apontar riscos e pontos de atenção
7. Definir próximos passos concretos`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const { profile, analyses } = await req.json();

    const analysisSections: string[] = [];

    if (analyses?.perfil) {
      analysisSections.push(`ANÁLISE DE PERFIL:\n${analyses.perfil}`);
    }
    if (analyses?.concorrencia) {
      analysisSections.push(`ANÁLISE DE CONCORRÊNCIA:\n${analyses.concorrencia}`);
    }
    if (analyses?.tendencias) {
      analysisSections.push(`ANÁLISE DE TENDÊNCIAS:\n${analyses.tendencias}`);
    }
    if (analyses?.estrategia) {
      analysisSections.push(`PLANO ESTRATÉGICO:\n${analyses.estrategia}`);
    }
    if (analyses?.metricas) {
      analysisSections.push(`ANÁLISE DE MÉTRICAS:\n${analyses.metricas}`);
    }

    const userPrompt = `Perfil do médico:
Nome: ${profile.nome ?? "Não informado"}
Especialidade: ${profile.especialidade ?? "Não informada"}
Público-alvo: ${profile.publico_alvo ?? "Não informado"}
Seguidores: ${profile.seguidores_instagram ?? "Não informado"}

ANÁLISES DISPONÍVEIS DO SQUAD:
${analysisSections.length > 0 ? analysisSections.join("\n\n---\n\n") : "Nenhuma análise disponível ainda."}

Sintetize todas as análises acima em um panorama estratégico integrado. Priorize as ações mais importantes e crie um plano de ação consolidado.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (
                parsed.type === "content_block_delta" &&
                parsed.delta?.text
              ) {
                const chunk = JSON.stringify({
                  choices: [{ delta: { content: parsed.delta.text } }],
                });
                controller.enqueue(
                  new TextEncoder().encode(`data: ${chunk}\n\n`)
                );
              }
            } catch {
              // skip non-JSON lines
            }
          }
        }
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

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
