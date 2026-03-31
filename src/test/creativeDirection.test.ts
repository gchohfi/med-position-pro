import { describe, it, expect } from "vitest";
import { getCreativeDirection, type ContentIntent } from "@/components/carousel/creativeDirection";

describe("getCreativeDirection", () => {
  const intents: ContentIntent[] = ["educativo", "manifesto", "conexao", "conversao", "hibrido"];

  it("should return a direction for every valid intent", () => {
    for (const intent of intents) {
      const dir = getCreativeDirection(intent);
      expect(dir).toBeDefined();
      expect(dir.label).toBeTruthy();
    }
  });

  it("should have valid coverMaxWords (3-8)", () => {
    for (const intent of intents) {
      const dir = getCreativeDirection(intent);
      expect(dir.coverMaxWords).toBeGreaterThanOrEqual(3);
      expect(dir.coverMaxWords).toBeLessThanOrEqual(8);
    }
  });

  it("should have valid headlineMaxWords (3-12)", () => {
    for (const intent of intents) {
      const dir = getCreativeDirection(intent);
      expect(dir.headlineMaxWords).toBeGreaterThanOrEqual(3);
      expect(dir.headlineMaxWords).toBeLessThanOrEqual(12);
    }
  });

  it("should have valid bodyMaxWords (10-50)", () => {
    for (const intent of intents) {
      const dir = getCreativeDirection(intent);
      expect(dir.bodyMaxWords).toBeGreaterThanOrEqual(5);
      expect(dir.bodyMaxWords).toBeLessThanOrEqual(50);
    }
  });

  it("should have valid spacingScale (>0)", () => {
    for (const intent of intents) {
      const dir = getCreativeDirection(intent);
      expect(dir.spacingScale).toBeGreaterThan(0);
    }
  });

  it("should have valid coverTone", () => {
    const validTones = ["bold", "warm", "sharp", "editorial"];
    for (const intent of intents) {
      const dir = getCreativeDirection(intent);
      expect(validTones).toContain(dir.coverTone);
    }
  });

  it("should have valid typographyWeight", () => {
    const validWeights = ["light", "medium", "heavy"];
    for (const intent of intents) {
      const dir = getCreativeDirection(intent);
      expect(validWeights).toContain(dir.typographyWeight);
    }
  });

  it("should have a non-empty rhythmPattern", () => {
    for (const intent of intents) {
      const dir = getCreativeDirection(intent);
      expect(dir.rhythmPattern.length).toBeGreaterThan(0);
    }
  });

  it("should have maxBlocksPerSlide >= 1", () => {
    for (const intent of intents) {
      const dir = getCreativeDirection(intent);
      expect(dir.maxBlocksPerSlide).toBeGreaterThanOrEqual(1);
    }
  });

  it("educativo should have editorial coverTone", () => {
    const dir = getCreativeDirection("educativo");
    expect(dir.coverTone).toBe("editorial");
  });

  it("manifesto should have bold coverTone", () => {
    const dir = getCreativeDirection("manifesto");
    expect(dir.coverTone).toBe("bold");
  });
});
