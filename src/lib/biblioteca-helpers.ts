/**
 * Pure helper functions extracted from Biblioteca.tsx for testability.
 */

const BLOCK_LABELS = [
  "Gancho",
  "Quebra de percepção",
  "Explicação / visão",
  "Método / lógica",
  "Manifesto",
  "Fechamento",
];

export interface ContentItem {
  id: string;
  title: string | null;
  content_type: string;
  strategic_input: unknown;
  generated_content: unknown;
  golden_case: boolean;
  golden_reason: string | null;
  series_id: string | null;
  created_at: string;
}

export function getTitle(item: ContentItem): string {
  if (item.title) return item.title;
  const input = item.strategic_input as Record<string, unknown> | null;
  return (input?.tese as string) || (input?.objetivo as string) || "Peça sem título";
}

export function getStrategicInput(item: ContentItem) {
  const input = item.strategic_input as Record<string, unknown> | null;
  return {
    tese: (input?.tese as string) || null,
    objetivo: (input?.objetivo as string) || null,
    percepcao: (input?.percepcao as string) || null,
    tipo: (input?.tipo as string) || item.content_type,
  };
}

export function getBlocks(item: ContentItem): { label: string; text: string }[] {
  const content = item.generated_content;
  if (!content || typeof content !== "object") return [];

  const blocks: { label: string; text: string }[] = [];
  for (const label of BLOCK_LABELS) {
    const text = (content as Record<string, string>)[label];
    if (text && typeof text === "string" && text.trim()) {
      blocks.push({ label, text: text.trim() });
    }
  }

  // If no standard blocks found, try to render any keys as blocks
  if (blocks.length === 0 && !Array.isArray(content)) {
    for (const [key, val] of Object.entries(content as Record<string, unknown>)) {
      if (typeof val === "string" && val.trim()) {
        blocks.push({ label: key, text: val.trim() });
      }
    }
  }

  return blocks;
}

export function filterItems(items: ContentItem[], filter: string): ContentItem[] {
  if (filter === "todos") return items;
  if (filter === "golden") return items.filter((i) => i.golden_case);
  return items.filter((i) => i.content_type === filter);
}
