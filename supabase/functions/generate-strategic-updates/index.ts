import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Inline shared helpers ──
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 5000;

async function callGemini(apiKey: string, body: Record<string, unknown>): Promise<Response> {
  let lastError: string | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`[Gemini] retry ${attempt}/${MAX_RETRIES} after ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
    const res = await fetch(GEMINI_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gemini-2.5-flash", ...body }),
    });
    if (res.ok) return res;
    if (res.status === 429 && attempt < MAX_RETRIES) {
      lastError = await res.text();
      console.log(`[Gemini] 429 (attempt ${attempt + 1}): ${lastError.slice(0, 120)}`);
      continue;
    }
    return res;
  }
  throw new Error(`Gemini failed after ${MAX_RETRIES} retries: ${lastError}`);
}

async function callGeminiStream(apiKey: string, body: Record<string, unknown>): Promise<Response> {
  return callGemini(apiKey, { stream: true, ...body });
}

async function callPerplexity(apiKey: string, body: Record<string, unknown>): Promise<Response | null> {
  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "sonar", ...body }),
    });
    if (res.ok) return res;
    console.log(`[Perplexity] error: ${res.status}`);
    return null;
  } catch (e) {
    console.log(`[Perplexity] exception: ${e}`);
    return null;
  }
}

function errorResponse(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function streamResponse(body: ReadableStream | null) {
  return new Response(body, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Missing auth", 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client for reading (respects RLS)
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for write operations (Bug #2 fix)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errorResponse("Unauthorized", 401);

    // Gather context
    const [
      { data: profile },
      { data: positioning },
      { data: diagnosis },
      { data: series },
      { data: contents },
      { data: calendar },
      { data: radar },
      { data: memory },
      { data: snapshots },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("positioning").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("diagnosis_outputs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("series").select("*").eq("user_id", user.id),
      supabase.from("content_outputs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("calendar_items").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30),
      supabase.from("market_radar").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("living_memory").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("positioning_snapshots").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
    ]);

    const activeSeries = (series || []).filter((s: any) => s.status === "ativa");
    const contentTypes = (contents || []).map((c: any) => c.content_type);
    const typeCount: Record<string, number> = {};
    contentTypes.forEach((t: string) => {
      typeCount[t] = (typeCount[t] || 0) + 1;
    });

    const prompt = `Você é o MEDSHIFT, um sistema premium de posicionamento estratégico para médicos.

Analise o contexto completo deste profissional e gere atualizações estratégicas inteligentes.

CONTEXTO:
- Especialidade: ${profile?.specialty || "não informada"}
- Arquétipo: ${positioning?.archetype || "não definido"}
- Tom: ${positioning?.tone || "não definido"}
- Pilares: ${JSON.stringify(positioning?.pillars || [])}
- Público-alvo: ${positioning?.target_audience || "não definido"}
- Séries ativas: ${activeSeries.map((s: any) => s.name).join(", ") || "nenhuma"}
- Conteúdos recentes (últimos 20): ${JSON.stringify(typeCount)}
- Total de conteúdos: ${(contents || []).length}
- Itens no calendário: ${(calendar || []).length}
- Radar de mercado disponível: ${!!radar}
- Memória viva disponível: ${!!memory}
- Snapshots de evolução: ${(snapshots || []).length}

Gere um JSON com a seguinte estrutura:
{
  "updates": [
    {
      "update_type": "repetition|stagnation|opportunity|recommendation|drift|refresh",
      "title": "título curto da atualização",
      "description": "explicação clara e estratégica de por que isso importa",
      "source_module": "módulo que originou o sinal (radar|memoria|evolucao|producao|calendario|series|estrategia)",
      "action_module": "módulo onde agir (estrategia|series|calendario|producao|radar|memoria-viva|evolucao)",
      "action_label": "rótulo do botão de ação",
      "action_path": "caminho da rota (/estrategia, /series, /calendario, /producao, /radar, /memoria-viva, /evolucao)",
      "severity": "info|warning|success"
    }
  ],
  "staleness": [
    {
      "area": "nome da área estagnada",
      "risk": "qual o risco de não agir",
      "recommendation": "o que fazer agora",
      "module_path": "/caminho"
    }
  ],
  "next_move": {
    "title": "próximo movimento principal recomendado",
    "why": "por que esse é o movimento mais importante agora",
    "action_label": "rótulo do botão",
    "action_path": "/caminho"
  }
}

REGRAS:
- Gere entre 3 e 8 updates relevantes
- Gere entre 1 e 4 sinais de estagnação (se houver)
- Sempre sugira 1 próximo movimento principal
- Tom: consultivo, premium, direto. PT-BR.
- Não invente dados. Se não há informação suficiente, sinalize que o sistema precisa de mais dados.
- Priorize insights acionáveis sobre observações genéricas.`;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const aiRes = await callGemini(GEMINI_API_KEY, {
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI error: ${aiRes.status} ${errText}`);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    const result = JSON.parse(content);

    // Bug #2 fix: Use admin client for delete/insert operations
    await adminClient
      .from("strategic_updates")
      .delete()
      .eq("user_id", user.id);

    const updates = (result.updates || []).map((u: any) => ({
      user_id: user.id,
      update_type: u.update_type || "recommendation",
      title: u.title,
      description: u.description,
      source_module: u.source_module,
      action_module: u.action_module,
      action_label: u.action_label,
      action_path: u.action_path,
      severity: u.severity || "info",
    }));

    const stalenessUpdates = (result.staleness || []).map((s: any) => ({
      user_id: user.id,
      update_type: "stagnation",
      title: s.area,
      description: `${s.risk} — ${s.recommendation}`,
      source_module: "sistema",
      action_module: null,
      action_label: "Revisar",
      action_path: s.module_path,
      severity: "warning",
    }));

    const allUpdates = [...updates, ...stalenessUpdates];
    if (allUpdates.length > 0) {
      await adminClient.from("strategic_updates").insert(allUpdates);
    }

    return jsonResponse({
      success: true,
      updates: allUpdates,
      next_move: result.next_move,
      staleness: result.staleness,
    });
  } catch (error) {
    console.error("generate-strategic-updates error:", error);
    return errorResponse(error.message, 500);
  }
});
