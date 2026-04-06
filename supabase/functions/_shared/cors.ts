/**
 * Shared CORS helpers for all Edge Functions.
 */

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN");
if (!allowedOrigin) {
  console.warn("[CORS] ALLOWED_ORIGIN not set — falling back to '*'. Set this in production!");
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin || "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Return the standard OPTIONS pre-flight response. */
export function handleOptions(): Response {
  return new Response(null, { headers: corsHeaders });
}
