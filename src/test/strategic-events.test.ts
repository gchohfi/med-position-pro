import { describe, it, expect } from "vitest";
import { STRATEGIC_EVENTS } from "@/lib/strategic-events";

describe("STRATEGIC_EVENTS", () => {
  it("should have all required event types", () => {
    const requiredEvents = [
      "ONBOARDING_COMPLETED",
      "DIAGNOSIS_GENERATED",
      "STRATEGY_GENERATED",
      "SERIES_CREATED",
      "SERIES_UPDATED",
      "CALENDAR_GENERATED",
      "CONTENT_GENERATED",
      "GOLDEN_CASE_MARKED",
      "MEMORY_REFRESHED",
      "EVOLUTION_SNAPSHOT",
      "RADAR_REFRESHED",
      "INSPIRATION_APPROVED",
      "INSPIRATION_REJECTED",
      "STRATEGIC_UPDATES_GENERATED",
      "ASSET_UPLOADED",
      "INSTAGRAM_INTEL_GENERATED",
    ];

    for (const event of requiredEvents) {
      expect(STRATEGIC_EVENTS).toHaveProperty(event);
    }
  });

  it("should have snake_case values", () => {
    for (const [key, value] of Object.entries(STRATEGIC_EVENTS)) {
      expect(value).toMatch(/^[a-z_]+$/);
    }
  });

  it("should have unique values", () => {
    const values = Object.values(STRATEGIC_EVENTS);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });

  it("should have 16 event types", () => {
    expect(Object.keys(STRATEGIC_EVENTS).length).toBe(16);
  });

  it("event values should match lowercase key pattern", () => {
    for (const [key, value] of Object.entries(STRATEGIC_EVENTS)) {
      expect(value).toBe(key.toLowerCase());
    }
  });
});
