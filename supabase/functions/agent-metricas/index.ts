import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um analista de métricas de Instagram para médicos. Analise os dados de performance fornecidos e identifique padrões, melhores horários, tipos de conteúdo mais eficazes e recomendações de otimização. Respeite a Resolução CFM 2.336/2023.

Diretrizes CFM (Resolução 2.336/2023):
- Não prometa resultados específicos de tratamentos
- Não sugira uso de antes/depois
- Não recomende divulgação de preços
- Mantenha ética médica em todas as recomendações
- Foque em conteúdo educativo e informativo

Estruture sua análise em:
1. Resumo geral de performance (alcance, engajamento, crescimento)
2. Análise por formato (carrosséis vs reels vs stories vs posts)
3. Melhores horários e dias para publicação
4. Temas e assuntos com melhor performance
5. Taxa de engajamento e comparação com benchmarks da especialidade
6. Análise de crescimento de seguidores
7. Recomendações de otimização priorizadas
8. Projeções e metas sugeridas`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const { profile, metrics } = await req.json();

    const userPrompt = `Analise as métricas de Instagram do seguinte perfil médico:

Perfil:
Nome: ${profile.nome ?? "Não informado"}
Especialidade: ${profile.especialidade ?? "Não informada"}
Seguidores: ${profile.seguidores_instagram ?? "Não informado"}

Dados de performance:
${JSON.stringify(metrics ?? [], null, 2)}

Forneça uma análise completa de performance com recomendações práticas de otimização.`;

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
