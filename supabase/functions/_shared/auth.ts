/**
 * Shared auth helper for Edge Functions.
 * Validates JWT via supabase.auth.getUser() and returns the authenticated user.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";

export interface AuthResult {
  user: { id: string; email?: string };
}

/**
 * Validate the request's Authorization header and return the authenticated user.
 * Returns a Response (401) if auth fails, or the user object if it succeeds.
 */
export async function requireAuth(
  req: Request,
): Promise<AuthResult | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing Authorization header" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ error: "Server misconfigured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  return { user: { id: user.id, email: user.email } };
}

/** Type guard: true when requireAuth returned a Response (auth failure). */
export function isAuthError(result: AuthResult | Response): result is Response {
  return result instanceof Response;
}
