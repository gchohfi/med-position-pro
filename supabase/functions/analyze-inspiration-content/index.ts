import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";

const APPROVED_LIBRARY: string[] = [
  "drafatima",
  "dratati",
  "dra.larissasaad",
];

const PERPLEXITY_SYSTEM = `Você é um assistente de descoberta de perfis de inspiração para marketing médico.
Retorne APENAS JSON no formato:
{
  "candidates": [
    { "handle": "usuario", "profile_url": "https://instagram.com/usuario", "reason": "..." }
  ]
}
Regras:
- no máximo 8 candidatos
- não invente links sem confiança
- se não souber, retorne lista vazia`;

function normalizeHandle(input: string): string {
  const cleaned = input.trim().toLowerCase().replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/^@/, "");
  return cleaned.split(/[/?#]/)[0].replace(/[^a-z0-9._]/g, "");
}

function isValidHandle(handle: string): boolean {
  return /^[a-z0-9._]{3,30}$/.test(handle);
}

function parsePerplexityCandidates(raw: string): Array<{ handle: string; profile_url?: string; reason?: string }> {
  try {
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed?.candidates) ? parsed.candidates : [];
    return list.map((item: any) => ({
      handle: String(item?.handle || ""),
      profile_url: item?.profile_url ? String(item.profile_url) : undefined,
      reason: item?.reason ? String(item.reason) : undefined,
    }));
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    const supabase = createClient(supabaseUrl, serviceKey);
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const body = await req.json();
    const mode = String(body.mode || "manual");
    const manualHandles = Array.isArray(body.handles) ? body.handles.map((h: unknown) => String(h)) : [];
    const specialty = String(body.specialty || "");
    const location = String(body.location || "");
    const objective = String(body.objective || "");

    // Etapa A — Discovery (manual first, AI second)
    const discovered = new Map<string, { source_type: "manual" | "ai_discovery" | "library"; profile_url?: string; notes?: string }>();
    for (const item of manualHandles) {
      const normalized = normalizeHandle(item);
      if (!normalized) continue;
      discovered.set(normalized, { source_type: "manual", notes: "Inserido manualmente pela usuária." });
    }

    for (const lib of APPROVED_LIBRARY) {
      if (!discovered.has(lib)) {
        discovered.set(lib, { source_type: "library", profile_url: `https://instagram.com/${lib}`, notes: "Perfil da biblioteca aprovada." });
      }
    }

    if (mode === "assisted" && PERPLEXITY_API_KEY) {
      const prompt = `Especialidade: ${specialty || "médica"}\nLocal: ${location || "Brasil"}\nObjetivo: ${objective || "inspiração para conteúdo autoral"}\nListe apenas handles de Instagram para inspiração estratégica.`;
      const res = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            { role: "system", content: PERPLEXITY_SYSTEM },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content || "{}";
        const candidates = parsePerplexityCandidates(String(text));
        for (const candidate of candidates) {
          const normalized = normalizeHandle(candidate.handle);
          if (!normalized || discovered.has(normalized)) continue;
          discovered.set(normalized, {
            source_type: "ai_discovery",
            profile_url: candidate.profile_url,
            notes: candidate.reason || "Descoberta assistida por IA.",
          });
        }
      }
    }

    // Etapa B — Verification
    const profileRows = Array.from(discovered.entries()).map(([handle, meta]) => {
      const valid = isValidHandle(handle);
      const isLibrary = meta.source_type === "library";
      const verification_status = isLibrary ? "verified" : valid ? "needs_review" : "rejected";
      const verification_confidence = isLibrary ? 0.95 : valid ? 0.6 : 0.1;
      return {
        user_id: user.id,
        discovered_handle: handle,
        normalized_handle: handle,
        profile_url: meta.profile_url || `https://instagram.com/${handle}`,
        source_type: meta.source_type,
        verification_status,
        verification_method: isLibrary ? "internal_library" : "format_and_source_heuristic",
        verification_confidence,
        notes: meta.notes || null,
      };
    });

    if (profileRows.length > 0) {
      await supabase
        .from("inspiration_profiles")
        .upsert(profileRows, { onConflict: "user_id,normalized_handle" });
    }

    // Etapa C — Analysis (apenas verificados)
    const verifiedProfiles = profileRows.filter((row) => row.verification_status === "verified");
    const analyses = verifiedProfiles.map((p) => ({
      user_id: user.id,
      normalized_handle: p.normalized_handle,
      analysis_status: "queued",
      raw_research: null,
      structured_analysis: null,
      generated_ideas: null,
    }));

    if (analyses.length > 0) {
      await supabase.from("inspiration_profile_analyses").upsert(analyses, { onConflict: "user_id,normalized_handle" });
    }

    return new Response(
      JSON.stringify({
        mode,
        counts: {
          discovered: profileRows.length,
          verified: verifiedProfiles.length,
          needs_review: profileRows.filter((r) => r.verification_status === "needs_review").length,
          rejected: profileRows.filter((r) => r.verification_status === "rejected").length,
        },
        profiles: profileRows,
        analysis_queued_for_verified: verifiedProfiles.map((p) => p.normalized_handle),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
