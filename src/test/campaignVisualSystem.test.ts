import { describe, it, expect } from "vitest";
import { VISUAL_SYSTEMS } from "@/components/carousel/SlideRenderer";

describe("Campaign Visual System", () => {
  it("has both travessia and editorial_black_gold systems", () => {
    expect(VISUAL_SYSTEMS.travessia).toBeDefined();
    expect(VISUAL_SYSTEMS.editorial_black_gold).toBeDefined();
  });

  it("editorial_black_gold is marked as premium", () => {
    expect(VISUAL_SYSTEMS.editorial_black_gold.premium).toBe(true);
    expect(VISUAL_SYSTEMS.travessia.premium).toBeUndefined();
  });

  it("editorial_black_gold uses serif headline font", () => {
    expect(VISUAL_SYSTEMS.editorial_black_gold.headlineFont).toContain("Playfair");
  });

  it("editorial_black_gold has gold accent color", () => {
    expect(VISUAL_SYSTEMS.editorial_black_gold.colors.accent).toBe("#C9A84C");
  });

  it("editorial_black_gold has deeper black background", () => {
    expect(VISUAL_SYSTEMS.editorial_black_gold.colors.bg).toBe("#0A0A0A");
  });

  it("editorial_black_gold has larger headline sizes than travessia", () => {
    expect(VISUAL_SYSTEMS.editorial_black_gold.headlineSizes.xl).toBeGreaterThan(
      VISUAL_SYSTEMS.travessia.headlineSizes.xl
    );
  });

  it("editorial_black_gold has wider margins for premium whitespace", () => {
    expect(VISUAL_SYSTEMS.editorial_black_gold.margins.page).toBeGreaterThan(
      VISUAL_SYSTEMS.travessia.margins.page
    );
  });

  it("all visual systems have required color keys", () => {
    const requiredKeys = ["bg", "bgAlt", "text", "textMuted", "accent", "coverBg", "coverText"];
    for (const [, vs] of Object.entries(VISUAL_SYSTEMS)) {
      for (const key of requiredKeys) {
        expect(vs.colors).toHaveProperty(key);
      }
    }
  });

  it("all visual systems have valid font strings", () => {
    for (const [, vs] of Object.entries(VISUAL_SYSTEMS)) {
      expect(vs.headlineFont.length).toBeGreaterThan(0);
      expect(vs.bodyFont.length).toBeGreaterThan(0);
    }
  });

  it("all visual systems have positive margin and size values", () => {
    for (const [, vs] of Object.entries(VISUAL_SYSTEMS)) {
      expect(vs.margins.page).toBeGreaterThan(0);
      expect(vs.margins.inner).toBeGreaterThan(0);
      expect(vs.bodySize).toBeGreaterThan(0);
      expect(vs.headlineSizes.xl).toBeGreaterThan(0);
    }
  });
});
