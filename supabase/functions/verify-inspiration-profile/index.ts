import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";
import { callPerplexityText } from "../_shared/perplexity.ts";

/**
 * verify-inspiration-profile — Verification ONLY
 *
 * Input:  { handles: string[] }
 * Output: { results: [{ handle, verified, method, confidence, display_name }] }
 *
 * Verification is abstract — easy to swap methods later.
 * Current methods:
 *   1. Instagram oEmbed API (quick, free)
 *   2. Perplexity web search for "instagram.com/{handle}" (web evidence)
 */

interface VerificationResult {
  handle: string;
  verified: boolean;
  method: string;
  confidence: number;
  display_name: string | null;
}

/* ── Method 1: Instagram oEmbed API ── */
async function verifyViaOEmbed(
  handle: string,
): Promise<{ success: boolean; name?: string }> {
  const cleanHandle = handle.replace(/^@/, "");
  try {
    const res = await fetch(
      `https://api.instagram.com/oembed/?url=https://www.instagram.com/${cleanHandle}/`,
    );
    if (res.ok) {
      const data = await res.json();
      return { success: true, name: data.author_name ?? cleanHandle };
    }
    return { success: false };
  } catch {
    return { success: false };
  }
}

/* ── Method 2: Perplexity web evidence search ── */
async function verifyViaWebSearch(
  handle: string,
  perplexityKey: string,
): Promise<{ success: boolean; name?: string; confidence: number }> {
  const cleanHandle = handle.replace(/^@/, "");
  try {
    const query = `Does the Instagram profile instagram.com/${cleanHandle} exist? Is it a real active Instagram account? What is the account name and what do they post about? Answer concisely.`;
    const result = await callPerplexityText(perplexityKey, [
      { role: "user", content: query },
    ]);

    const lower = result.toLowerCase();
    const hasPositiveSignals =
      lower.includes("instagram") &&
      (lower.includes("followers") ||
        lower.includes("seguidores") ||
        lower.includes("posts") ||
        lower.includes("publicações") ||
        lower.includes("content") ||
        lower.includes("conteúdo") ||
        lower.includes("doctor") ||
        lower.includes("médic"));

    const hasNegativeSignals =
      lower.includes("does not exist") ||
      lower.includes("não existe") ||
      lower.includes("couldn't find") ||
      lower.includes("not found") ||
      lower.includes("no results");

    if (hasNegativeSignals) {
      return { success: false, confidence: 0.8 };
    }

    if (hasPositiveSignals) {
      // Try to extract a display name from the response
      const nameMatch = result.match(
        /(?:account|perfil|profile)\s+(?:of|de|named?|chamad[oa])\s+"?([^".,\n]+)/i,
      );
      return {
        success: true,
        name: nameMatch?.[1]?.trim() ?? undefined,
        confidence: 0.7,
      };
    }

    // Ambiguous — mark as needs_review
    return { success: false, confidence: 0.3 };
  } catch {
    return { success: false, confidence: 0 };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  try {
    const perplexityKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityKey) throw new Error("PERPLEXITY_API_KEY not configured");

    const body = await req.json();
    const { handles } = body;

    if (!handles || !Array.isArray(handles) || handles.length === 0) {
      throw new Error("Campo 'handles' é obrigatório (array de handles)");
    }

    // Verify all handles in parallel
    const results: VerificationResult[] = await Promise.all(
      handles.map(async (rawHandle: string): Promise<VerificationResult> => {
        const handle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;
        const cleanHandle = handle.replace(/^@/, "");

        // Method 1: oEmbed (fast, high confidence when it works)
        const oembedResult = await verifyViaOEmbed(cleanHandle);
        if (oembedResult.success) {
          return {
            handle,
            verified: true,
            method: "oembed",
            confidence: 0.95,
            display_name: oembedResult.name ?? null,
          };
        }

        // Method 2: Web search (slower, moderate confidence)
        const webResult = await verifyViaWebSearch(handle, perplexityKey);
        if (webResult.success) {
          return {
            handle,
            verified: true,
            method: "web_search",
            confidence: webResult.confidence,
            display_name: webResult.name ?? null,
          };
        }

        // If web search returned low confidence, mark as needs_review
        if (webResult.confidence >= 0.2 && webResult.confidence < 0.5) {
          return {
            handle,
            verified: false,
            method: "web_search",
            confidence: webResult.confidence,
            display_name: null,
          };
        }

        // Not found by any method
        return {
          handle,
          verified: false,
          method: "none",
          confidence: 0,
          display_name: null,
        };
      }),
    );

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
