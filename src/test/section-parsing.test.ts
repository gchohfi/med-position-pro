import { describe, it, expect } from "vitest";

/**
 * Tests for the section parsing logic used in Producao.tsx
 * Extracted here to be testable independently.
 */

const OUTPUT_SECTIONS = [
  "Gancho",
  "Quebra de percepção",
  "Explicação / visão",
  "Método / lógica",
  "Manifesto",
  "Fechamento",
];

function parseSections(fullContent: string): Record<string, string> {
  const sections: Record<string, string> = {};
  for (let i = 0; i < OUTPUT_SECTIONS.length; i++) {
    const sectionName = OUTPUT_SECTIONS[i];
    const nextSection = OUTPUT_SECTIONS[i + 1];
    const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
    const escapedNext = nextSection
      ? nextSection.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&")
      : null;
    const startPattern = `(?:#{1,3}\\s*)?(?:\\*{1,2})?(?:\\d+\\.?\\s*)?${escapedName}(?:\\*{1,2})?[:\\s\u2014-]*\\n?`;
    const endPattern = escapedNext
      ? `(?=(?:#{1,3}\\s*)?(?:\\*{1,2})?(?:\\d+\\.?\\s*)?${escapedNext})`
      : "$";
    const regex = new RegExp(`${startPattern}([\\s\\S]*?)${endPattern}`, "i");
    const match = fullContent.match(regex);
    sections[sectionName] = match ? match[1].trim() : "";
  }

  if (Object.values(sections).every((v) => !v)) {
    sections["Gancho"] = fullContent;
  }

  return sections;
}

describe("Section Parsing (Producao)", () => {
  it("should parse plain section headers", () => {
    const content = `Gancho
Este é o gancho do conteúdo.

Quebra de percepção
Aqui quebramos a percepção.

Explicação / visão
A explicação detalhada.

Método / lógica
1. Passo um
2. Passo dois

Manifesto
Nosso manifesto aqui.

Fechamento
CTA final.`;

    const result = parseSections(content);
    expect(result["Gancho"]).toBe("Este é o gancho do conteúdo.");
    expect(result["Quebra de percepção"]).toBe("Aqui quebramos a percepção.");
    expect(result["Explicação / visão"]).toBe("A explicação detalhada.");
    expect(result["Método / lógica"]).toContain("Passo um");
    expect(result["Manifesto"]).toBe("Nosso manifesto aqui.");
    expect(result["Fechamento"]).toBe("CTA final.");
  });

  it("should parse markdown bold headers (**Section**)", () => {
    const content = `**Gancho**
Conteúdo do gancho.

**Quebra de percepção**
Conteúdo da quebra.

**Explicação / visão**
Conteúdo da explicação.

**Método / lógica**
Conteúdo do método.

**Manifesto**
Conteúdo do manifesto.

**Fechamento**
Conteúdo do fechamento.`;

    const result = parseSections(content);
    expect(result["Gancho"]).toBe("Conteúdo do gancho.");
    expect(result["Quebra de percepção"]).toBe("Conteúdo da quebra.");
    expect(result["Fechamento"]).toBe("Conteúdo do fechamento.");
  });

  it("should parse numbered headers (1. Section)", () => {
    const content = `1. Gancho
Conteúdo do gancho.

2. Quebra de percepção
Conteúdo da quebra.

3. Explicação / visão
Conteúdo da explicação.

4. Método / lógica
Conteúdo do método.

5. Manifesto
Conteúdo do manifesto.

6. Fechamento
Conteúdo do fechamento.`;

    const result = parseSections(content);
    expect(result["Gancho"]).toBe("Conteúdo do gancho.");
    expect(result["Quebra de percepção"]).toBe("Conteúdo da quebra.");
  });

  it("should parse markdown heading headers (## Section)", () => {
    const content = `## Gancho
Conteúdo do gancho.

## Quebra de percepção
Conteúdo da quebra.

## Explicação / visão
Conteúdo da explicação.

## Método / lógica
Conteúdo do método.

## Manifesto
Conteúdo do manifesto.

## Fechamento
Conteúdo do fechamento.`;

    const result = parseSections(content);
    expect(result["Gancho"]).toBe("Conteúdo do gancho.");
    expect(result["Manifesto"]).toBe("Conteúdo do manifesto.");
  });

  it("should handle headers with colon (Section:)", () => {
    const content = `Gancho: Este é o gancho.

Quebra de percepção: A quebra aqui.

Explicação / visão: A explicação.

Método / lógica: O método.

Manifesto: O manifesto.

Fechamento: O fechamento.`;

    const result = parseSections(content);
    expect(result["Gancho"]).toBe("Este é o gancho.");
  });

  it("should fallback to putting all content in Gancho when no sections found", () => {
    const content = "Este é um conteúdo sem seções definidas. Apenas texto corrido.";
    const result = parseSections(content);
    expect(result["Gancho"]).toBe(content);
  });

  it("should handle empty content", () => {
    const result = parseSections("");
    // All sections should be empty, and fallback should set Gancho to empty string
    expect(result["Gancho"]).toBe("");
  });

  it("should handle multiline section content", () => {
    const content = `Gancho
Linha 1 do gancho.
Linha 2 do gancho.
Linha 3 do gancho.

Quebra de percepção
Conteúdo da quebra.

Explicação / visão
Explicação aqui.

Método / lógica
Método aqui.

Manifesto
Manifesto aqui.

Fechamento
Fechamento aqui.`;

    const result = parseSections(content);
    expect(result["Gancho"]).toContain("Linha 1");
    expect(result["Gancho"]).toContain("Linha 2");
    expect(result["Gancho"]).toContain("Linha 3");
  });
});
