/**
 * Shared CORS helpers for all Edge Functions.
 */

export const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Return the standard OPTIONS pre-flight response. */
export function handleOptions(): Response {
  return new Response(null, { headers: corsHeaders });
}
