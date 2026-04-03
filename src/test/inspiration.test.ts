import { describe, expect, it } from "vitest";
import { isValidInstagramHandle, normalizeInstagramHandle } from "@/lib/inspiration";

describe("inspiration handle helpers", () => {
  it("normaliza handle de @usuario", () => {
    expect(normalizeInstagramHandle("@Dra.Nutri")).toBe("dra.nutri");
  });

  it("normaliza URL do instagram", () => {
    expect(normalizeInstagramHandle("https://instagram.com/dra.nutri/?hl=pt-br")).toBe("dra.nutri");
  });

  it("valida handles válidos e rejeita inválidos", () => {
    expect(isValidInstagramHandle("dra.nutri")).toBe(true);
    expect(isValidInstagramHandle("dr")).toBe(false);
    expect(isValidInstagramHandle("perfil com espaco")).toBe(false);
  });
});
