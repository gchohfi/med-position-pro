import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseStreamingOptions {
  functionName: string;
  onComplete?: (fullText: string) => void;
  onError?: (error: string) => void;
}

export function useStreamingResponse({ functionName, onComplete, onError }: UseStreamingOptions) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (payload: Record<string, unknown>) => {
    setText("");
    setError(null);
    setLoading(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const token = session?.access_token ?? supabaseKey;

      const res = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: supabaseKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(errBody.error || `Erro ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Stream indisponível");

      const decoder = new TextDecoder();
      let accumulated = "";
      let lineBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        // Buffer partial lines across chunks to avoid data loss
        lineBuffer += chunk;
        const lines = lineBuffer.split("\n");
        // Keep the last (potentially incomplete) line in the buffer
        lineBuffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              setText(accumulated);
            }
          } catch {
            // skip malformed JSON
          }
        }
      }

      // Process any remaining buffered line
      if (lineBuffer.startsWith("data: ")) {
        const data = lineBuffer.slice(6).trim();
        if (data && data !== "[DONE]") {
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              setText(accumulated);
            }
          } catch {
            // skip malformed JSON
          }
        }
      }

      onComplete?.(accumulated);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Erro ao processar resposta";
      setError(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }, [functionName, onComplete, onError]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    setText("");
    setError(null);
    setLoading(false);
  }, []);

  return { text, loading, error, start, stop, reset };
}
