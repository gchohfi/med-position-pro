import { describe, it, expect } from "vitest";
import {
  travessiaToSlideData,
  DEFAULT_BRAND,
  DEFAULT_SKILL,
  type TravessIASlide,
  type TravessIALayout,
} from "@/types/carousel";

function makeSlide(layout: TravessIALayout, overrides: Partial<TravessIASlide> = {}): TravessIASlide {
  return { numero: 1, layout, ...overrides };
}

describe("travessiaToSlideData", () => {
  const layoutToType: [TravessIALayout, string][] = [
    ["capa", "cover"],
    ["timg", "editorial"],
    ["tonly", "editorial"],
    ["stat", "structured"],
    ["turning", "statement"],
    ["light", "editorial"],
    ["final", "signature"],
  ];

  it.each(layoutToType)("maps layout '%s' to type '%s'", (layout, expectedType) => {
    const result = travessiaToSlideData(makeSlide(layout), 7);
    expect(result.type).toBe(expectedType);
  });

  it("preserves travessiaLayout on the output", () => {
    const result = travessiaToSlideData(makeSlide("stat"), 5);
    expect(result.travessiaLayout).toBe("stat");
  });

  it("maps headline from headline field", () => {
    const result = travessiaToSlideData(makeSlide("capa", { headline: "Test headline" }), 3);
    expect(result.headline).toBe("Test headline");
  });

  it("falls back headline: big_text → turn_text → conclusion → mini_titulo", () => {
    expect(travessiaToSlideData(makeSlide("tonly", { big_text: "Big" }), 1).headline).toBe("Big");
    expect(travessiaToSlideData(makeSlide("turning", { turn_text: "Turn" }), 1).headline).toBe("Turn");
    expect(travessiaToSlideData(makeSlide("final", { conclusion: "End" }), 1).headline).toBe("End");
    expect(travessiaToSlideData(makeSlide("light", { mini_titulo: "Mini" }), 1).headline).toBe("Mini");
  });

  it("returns empty headline when no text fields present", () => {
    const result = travessiaToSlideData(makeSlide("capa"), 1);
    expect(result.headline).toBe("");
  });

  it("maps body from texto field", () => {
    const result = travessiaToSlideData(makeSlide("tonly", { texto: "Body text" }), 1);
    expect(result.body).toBe("Body text");
  });

  it("falls back body: opinion → pergunta_comentario", () => {
    expect(travessiaToSlideData(makeSlide("turning", { opinion: "Op" }), 1).body).toBe("Op");
    expect(travessiaToSlideData(makeSlide("final", { pergunta_comentario: "Q?" }), 1).body).toBe("Q?");
  });

  it("maps stat fields correctly", () => {
    const result = travessiaToSlideData(
      makeSlide("stat", { stat_number: "73%", stat_unit: "dos pacientes", e_dai: "Isso importa" }),
      7,
    );
    expect(result.statNumber).toBe("73%");
    expect(result.statUnit).toBe("dos pacientes");
    expect(result.eDai).toBe("Isso importa");
  });

  it("maps eyebrow and imgQuery", () => {
    const result = travessiaToSlideData(
      makeSlide("capa", { eyebrow: "Nutrologia", img_query: "doctor portrait" }),
      3,
    );
    expect(result.eyebrow).toBe("Nutrologia");
    expect(result.imgQuery).toBe("doctor portrait");
  });

  it("sets slideNumber and totalSlides correctly", () => {
    const slide = makeSlide("tonly", { numero: 4 });
    const result = travessiaToSlideData(slide, 10);
    expect(result.slideNumber).toBe(4);
    expect(result.totalSlides).toBe(10);
  });

  it("sets label as uppercase layout", () => {
    const result = travessiaToSlideData(makeSlide("turning"), 1);
    expect(result.label).toBe("TURNING");
  });
});

describe("DEFAULT_BRAND", () => {
  it("has all required color fields", () => {
    expect(DEFAULT_BRAND.cor_primaria).toBeTruthy();
    expect(DEFAULT_BRAND.cor_secundaria).toBeTruthy();
    expect(DEFAULT_BRAND.cor_texto).toBeTruthy();
    expect(DEFAULT_BRAND.cor_accent).toBeTruthy();
  });

  it("has valid font fields", () => {
    expect(DEFAULT_BRAND.fonte_titulo.length).toBeGreaterThan(0);
    expect(DEFAULT_BRAND.fonte_corpo.length).toBeGreaterThan(0);
  });

  it("has a valid estilo", () => {
    expect(["clean", "bold", "editorial", "minimal"]).toContain(DEFAULT_BRAND.estilo);
  });
});

describe("DEFAULT_SKILL", () => {
  it("has required identity fields", () => {
    expect(DEFAULT_SKILL.nome_canal).toBeTruthy();
    expect(DEFAULT_SKILL.handle).toMatch(/^@/);
    expect(DEFAULT_SKILL.posicionamento).toBeTruthy();
  });

  it("has pilares and proibicoes arrays", () => {
    expect(DEFAULT_SKILL.pilares.length).toBeGreaterThan(0);
    expect(DEFAULT_SKILL.proibicoes.length).toBeGreaterThan(0);
  });

  it("has estilo_visual with required keys", () => {
    const ev = DEFAULT_SKILL.estilo_visual;
    expect(ev.cor_fundo).toBeTruthy();
    expect(ev.cor_destaque).toBeTruthy();
    expect(ev.cor_texto).toBeTruthy();
    expect(ev.fonte_display).toBeTruthy();
    expect(ev.fonte_corpo).toBeTruthy();
  });

  it("has a preferred visual style", () => {
    expect(["travessia", "editorial_black_gold"]).toContain(
      DEFAULT_SKILL.estilo_visual.preferredVisualStyle,
    );
  });
});
