import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleOptions } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions();

  return new Response(
    JSON.stringify({ error: "Not available in production" }),
    { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
