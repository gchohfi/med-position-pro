import { describe, it, expect } from "vitest";
import { ROUTES } from "@/lib/routes";

describe("ROUTES", () => {
  it("has all expected route keys", () => {
    const expectedKeys = [
      "index", "auth", "resetPassword", "onboarding",
      "dashboard", "setup",
      "diagnostico", "analisePerfil", "concorrencia", "radarInstagram", "inspiracao",
      "tendencias", "radarMercado", "estrategiaIa", "carrossel", "producao", "calendario", "series",
      "metricas", "evolucao", "biblioteca", "memoriaViva", "atualizacoes", "supervisor",
    ];
    for (const key of expectedKeys) {
      expect(ROUTES).toHaveProperty(key);
    }
  });

  it("all routes start with /", () => {
    for (const [key, value] of Object.entries(ROUTES)) {
      expect(value, `Route "${key}" should start with /`).toMatch(/^\//);
    }
  });

  it("has no duplicate route paths", () => {
    const values = Object.values(ROUTES);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it("has no trailing slashes (except root)", () => {
    for (const [key, value] of Object.entries(ROUTES)) {
      if (value === "/") continue;
      expect(value, `Route "${key}" should not end with /`).not.toMatch(/\/$/);
    }
  });

  it("all routes are lowercase paths", () => {
    for (const [key, value] of Object.entries(ROUTES)) {
      expect(value, `Route "${key}" should be lowercase`).toBe(value.toLowerCase());
    }
  });

  it("has exactly 24 routes", () => {
    expect(Object.keys(ROUTES).length).toBe(24);
  });
});
