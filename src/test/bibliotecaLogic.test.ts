import { describe, it, expect } from "vitest";
import {
  getTitle,
  getStrategicInput,
  getBlocks,
  filterItems,
  type ContentItem,
} from "@/lib/biblioteca-helpers";

function makeItem(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    id: "test-1",
    title: null,
    content_type: "educativo",
    strategic_input: null,
    generated_content: null,
    golden_case: false,
    golden_reason: null,
    series_id: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("getTitle", () => {
  it("returns title when present", () => {
    expect(getTitle(makeItem({ title: "Meu título" }))).toBe("Meu título");
  });

  it("falls back to strategic_input.tese", () => {
    expect(
      getTitle(makeItem({ strategic_input: { tese: "Tese central" } })),
    ).toBe("Tese central");
  });

  it("falls back to strategic_input.objetivo", () => {
    expect(
      getTitle(makeItem({ strategic_input: { objetivo: "Objetivo da peça" } })),
    ).toBe("Objetivo da peça");
  });

  it("returns fallback when no title, tese or objetivo", () => {
    expect(getTitle(makeItem())).toBe("Peça sem título");
  });

  it("prefers tese over objetivo", () => {
    expect(
      getTitle(makeItem({ strategic_input: { tese: "T", objetivo: "O" } })),
    ).toBe("T");
  });
});

describe("getStrategicInput", () => {
  it("extracts tese, objetivo, percepcao from strategic_input", () => {
    const result = getStrategicInput(
      makeItem({
        strategic_input: {
          tese: "Tese",
          objetivo: "Obj",
          percepcao: "Perc",
          tipo: "manifesto",
        },
      }),
    );
    expect(result.tese).toBe("Tese");
    expect(result.objetivo).toBe("Obj");
    expect(result.percepcao).toBe("Perc");
    expect(result.tipo).toBe("manifesto");
  });

  it("returns nulls when strategic_input is empty", () => {
    const result = getStrategicInput(makeItem());
    expect(result.tese).toBeNull();
    expect(result.objetivo).toBeNull();
    expect(result.percepcao).toBeNull();
  });

  it("falls back tipo to content_type", () => {
    const result = getStrategicInput(makeItem({ content_type: "hibrido" }));
    expect(result.tipo).toBe("hibrido");
  });
});

describe("getBlocks", () => {
  it("extracts standard block labels from generated_content", () => {
    const content = {
      "Gancho": "Texto do gancho",
      "Quebra de percepção": "Quebra aqui",
      "Explicação / visão": "Explicação",
      "Método / lógica": "Passo a passo",
      "Manifesto": "Manifesto text",
      "Fechamento": "CTA final",
    };
    const blocks = getBlocks(makeItem({ generated_content: content }));
    expect(blocks).toHaveLength(6);
    expect(blocks[0].label).toBe("Gancho");
    expect(blocks[0].text).toBe("Texto do gancho");
    expect(blocks[5].label).toBe("Fechamento");
  });

  it("returns empty array for null content", () => {
    expect(getBlocks(makeItem({ generated_content: null }))).toEqual([]);
  });

  it("returns empty array for non-object content", () => {
    expect(getBlocks(makeItem({ generated_content: "just a string" }))).toEqual([]);
  });

  it("returns empty array for array content", () => {
    expect(getBlocks(makeItem({ generated_content: ["a", "b"] }))).toEqual([]);
  });

  it("falls back to arbitrary keys when no standard blocks found", () => {
    const content = { "Custom Label": "Custom text", "Another": "More text" };
    const blocks = getBlocks(makeItem({ generated_content: content }));
    expect(blocks).toHaveLength(2);
    expect(blocks[0].label).toBe("Custom Label");
  });

  it("trims whitespace from block text", () => {
    const content = { "Gancho": "  texto com espaço  " };
    const blocks = getBlocks(makeItem({ generated_content: content }));
    expect(blocks[0].text).toBe("texto com espaço");
  });

  it("ignores empty/whitespace-only values", () => {
    const content = { "Gancho": "Bom texto", "Manifesto": "   " };
    const blocks = getBlocks(makeItem({ generated_content: content }));
    expect(blocks).toHaveLength(1);
  });
});

describe("filterItems", () => {
  const items: ContentItem[] = [
    makeItem({ id: "1", content_type: "educativo", golden_case: true }),
    makeItem({ id: "2", content_type: "manifesto", golden_case: false }),
    makeItem({ id: "3", content_type: "educativo", golden_case: false }),
    makeItem({ id: "4", content_type: "conexao", golden_case: true }),
  ];

  it("returns all items for 'todos' filter", () => {
    expect(filterItems(items, "todos")).toHaveLength(4);
  });

  it("returns only golden items for 'golden' filter", () => {
    const result = filterItems(items, "golden");
    expect(result).toHaveLength(2);
    expect(result.every((i) => i.golden_case)).toBe(true);
  });

  it("filters by content_type", () => {
    const result = filterItems(items, "educativo");
    expect(result).toHaveLength(2);
    expect(result.every((i) => i.content_type === "educativo")).toBe(true);
  });

  it("returns empty for non-matching filter", () => {
    expect(filterItems(items, "conversao")).toHaveLength(0);
  });

  it("handles empty items array", () => {
    expect(filterItems([], "todos")).toHaveLength(0);
  });
});
