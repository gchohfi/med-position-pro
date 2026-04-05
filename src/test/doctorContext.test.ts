import { describe, it, expect, beforeEach } from "vitest";

/**
 * Tests for DoctorContext logic without rendering React components.
 * We test the isConfigured logic and localStorage persistence behavior directly.
 */

interface MinimalProfile {
  nome: string;
  especialidade: string;
  crm: string;
  [key: string]: unknown;
}

// Mirrors the isConfigured logic from DoctorContext.tsx
function isConfigured(profile: MinimalProfile | null): boolean {
  return !!(profile?.nome && profile?.especialidade && profile?.crm);
}

const STORAGE_KEY = "medshift_doctor_profile";

describe("DoctorContext: isConfigured logic", () => {
  it("returns true when nome, especialidade and crm are present", () => {
    expect(isConfigured({ nome: "Dra. Maria", especialidade: "Nutrologia", crm: "123456" })).toBe(true);
  });

  it("returns false when nome is missing", () => {
    expect(isConfigured({ nome: "", especialidade: "Nutrologia", crm: "123456" })).toBe(false);
  });

  it("returns false when especialidade is missing", () => {
    expect(isConfigured({ nome: "Dra. Maria", especialidade: "", crm: "123456" })).toBe(false);
  });

  it("returns false when crm is missing", () => {
    expect(isConfigured({ nome: "Dra. Maria", especialidade: "Nutrologia", crm: "" })).toBe(false);
  });

  it("returns false when profile is null", () => {
    expect(isConfigured(null)).toBe(false);
  });
});

describe("DoctorContext: localStorage persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores profile in localStorage when set", () => {
    const profile = { nome: "Dra. Ana", especialidade: "Dermatologia", crm: "SP-12345" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.nome).toBe("Dra. Ana");
    expect(parsed.crm).toBe("SP-12345");
  });

  it("removes profile from localStorage when cleared", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nome: "Test" }));
    localStorage.removeItem(STORAGE_KEY);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "not-valid-json{{{");
    let profile: MinimalProfile | null = null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      profile = stored ? JSON.parse(stored) : null;
    } catch {
      profile = null;
    }
    expect(profile).toBeNull();
  });
});
