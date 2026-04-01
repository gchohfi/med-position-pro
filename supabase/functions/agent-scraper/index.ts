import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_CONTENT_LENGTH = 8000;

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/* ───────────────────────────────────────────
   Type detection
   ─────────────────────────────────────────── */

type ContentType = "instagram" | "twitter" | "url" | "texto";

function detectType(input: { url?: string; texto?: string }): ContentType {
  if (input.texto && !input.url) return "texto";
  const url = input.url ?? "";
  if (/instagram\.com/i.test(url)) return "instagram";
  if (/twitter\.com|x\.com/i.test(url)) return "twitter";
  if (/^https?:\/\//i.test(url)) return "url";
  return "texto";
}

/* ───────────────────────────────────────────
   HTML helpers
   ─────────────────────────────────────────── */

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMeta(html: string, property: string): string {
  // Try og: and twitter: variants
  const patterns = [
    new RegExp(
      `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1];
  }
  return "";
}

function extractTitle(html: string): string {
  const ogTitle = extractMeta(html, "og:title");
  if (ogTitle) return ogTitle;
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return titleMatch?.[1]?.trim() ?? "";
}

function extractMainContent(html: string): string {
  // Try <article> first, then <main>, then <body>
  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
  if (articleMatch) return stripHtml(articleMatch[0]);

  const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
  if (mainMatch) return stripHtml(mainMatch[0]);

  const bodyMatch = html.match(/<body[\s\S]*?<\/body>/i);
  if (bodyMatch) return stripHtml(bodyMatch[0]);

  return stripHtml(html);
}

/* ───────────────────────────────────────────
   Fetch helpers
   ─────────────────────────────────────────── */

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }
  return await res.text();
}

async function extractFromSocialMeta(
  url: string,
): Promise<{ titulo: string; conteudo: string }> {
  const html = await fetchPage(url);
  const titulo = extractTitle(html);
  const description =
    extractMeta(html, "og:description") ||
    extractMeta(html, "twitter:description") ||
    extractMeta(html, "description");
  const conteudo = description || extractMainContent(html);
  return {
    titulo,
    conteudo: conteudo.slice(0, MAX_CONTENT_LENGTH),
  };
}

async function extractFromUrl(
  url: string,
): Promise<{ titulo: string; conteudo: string }> {
  const html = await fetchPage(url);
  const titulo = extractTitle(html);
  const content = extractMainContent(html);
  const conteudo = content.slice(0, MAX_CONTENT_LENGTH);
  return { titulo, conteudo };
}

/* ───────────────────────────────────────────
   Main handler
   ─────────────────────────────────────────── */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const tipo = detectType(body);

    let titulo = "";
    let conteudo = "";
    let url = body.url ?? "";
    let erro: string | undefined;

    switch (tipo) {
      case "texto": {
        conteudo = (body.texto ?? "").slice(0, MAX_CONTENT_LENGTH);
        titulo = conteudo.split(/[.\n]/)[0]?.slice(0, 100) ?? "Texto direto";
        break;
      }
      case "instagram":
      case "twitter": {
        try {
          const result = await extractFromSocialMeta(url);
          titulo = result.titulo;
          conteudo = result.conteudo;
        } catch (e) {
          erro = `Não foi possível extrair conteúdo de ${tipo}: ${(e as Error).message}`;
          conteudo = "";
        }
        break;
      }
      case "url": {
        try {
          const result = await extractFromUrl(url);
          titulo = result.titulo;
          conteudo = result.conteudo;
        } catch (e) {
          erro = `Erro ao extrair URL: ${(e as Error).message}`;
          conteudo = "";
        }
        break;
      }
    }

    const response: Record<string, unknown> = { tipo, url, titulo, conteudo };
    if (erro) response.erro = erro;

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
