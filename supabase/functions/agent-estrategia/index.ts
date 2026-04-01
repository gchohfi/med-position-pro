import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um estrategista de conteúdo médico digital. Crie um plano estratégico de conteúdo para Instagram incluindo pilares editoriais, frequência de publicação, mix de formatos (carrossel, reels, stories), tom de voz e calendário sugerido. Respeite a Resolução CFM 2.336/2023.

Diretrizes CFM (Resolução 2.336/2023):
- Não prometa resultados específicos de tratamentos
- Não sugira uso de antes/depois
- Não recomende divulgação de preços
- Mantenha ética médica em todas as recomendações
- Foque em conteúdo educativo e informativo

Estruture seu plano em:
1. Pilares editoriais (3-5 pilares com descrição e exemplos de temas)
2. Frequência e calendário de publicação semanal
3. Mix de formatos recomendado (% carrossel, reels, stories, lives)
4. Diretrizes de tom de voz e linguagem
5. Estratégia de hashtags e SEO do Instagram
6. Calendário sugerido para as próximas 4 semanas (com temas específicos)
7. KPIs e métricas para acompanhar`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const { profile } = await req.json();

    const userPrompt = `Crie um plano estratégico de conteúdo para o seguinte perfil médico:

Nome: ${profile.nome ?? "Não informado"}
Especialidade: ${profile.especialidade ?? "Não informada"}
Bio do Instagram: ${profile.bio_instagram ?? "Não informada"}
Público-alvo: ${profile.publico_alvo ?? "Não informado"}
Tom de voz atual: ${profile.tom_de_voz ?? "Não informado"}
Diferenciais: ${profile.diferenciais ?? "Não informados"}
Seguidores no Instagram: ${profile.seguidores_instagram ?? "Não informado"}

Desenvolva um plano estratégico completo, prático e acionável para o Instagram deste médico.`;

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
