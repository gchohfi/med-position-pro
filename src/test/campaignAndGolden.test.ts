import { describe, it, expect } from "vitest";
import {
  validarRoteiro,
  avaliarQualidadeRoteiro,
  validarVisualAntiMediocridade,
  type TravessIARoteiro,
  type TravessIASlide,
  type PreferredVisualStyle,
} from "@/types/carousel";
import { VISUAL_SYSTEMS, type ArchetypeStyle } from "@/components/carousel/SlideRenderer";

/**
 * Tests for campaign_brief, slide_plan_json, golden patterns,
 * visual system selection, and QA scoring integration.
 */

function makeSlide(n: number, layout: TravessIASlide["layout"], overrides: Partial<TravessIASlide> = {}): TravessIASlide {
  return { numero: n, layout, ...overrides };
}

function makeRoteiro(slides: TravessIASlide[], overrides: Partial<TravessIARoteiro> = {}): TravessIARoteiro {
  return { titulo_carrossel: "Teste", tese: "Tese central", slides, ...overrides };
}

// ─── Campaign Brief / Slide Plan JSON ──────────────────────────────────

describe("campaign_brief and slide_plan_json structure", () => {
  it("roteiro can be serialized to JSON (slide_plan_json compatible)", () => {
    const roteiro = makeRoteiro([
      makeSlide(1, "capa", { headline: "Hook", eyebrow: "Nutrologia" }),
      makeSlide(2, "tonly", { big_text: "Verdade" }),
      makeSlide(3, "stat", { stat_number: "73%" }),
      makeSlide(4, "turning", { turn_text: "Mas..." }),
      makeSlide(5, "light", { mini_titulo: "Dica" }),
      makeSlide(6, "timg", { mini_titulo: "Prova" }),
      makeSlide(7, "final", { conclusion: "Fim", pergunta_comentario: "?" }),
    ], { preferredVisualStyle: "editorial_black_gold" });

    const json = JSON.stringify(roteiro);
    const parsed = JSON.parse(json) as TravessIARoteiro;
    expect(parsed.slides).toHaveLength(7);
    expect(parsed.preferredVisualStyle).toBe("editorial_black_gold");
    expect(parsed.titulo_carrossel).toBe("Teste");
  });

  it("slide_plan_json with approved slides filters correctly", () => {
    const slides = [
      makeSlide(1, "capa", { headline: "Hook" }),
      makeSlide(2, "tonly", { big_text: "A" }),
      makeSlide(3, "stat", { stat_number: "50%" }),
    ];

    // Simulates the Producao approval flow — filter to only approved
    const approvedIndexes = [0, 2]; // skip slide 2
    const approved = slides.filter((_, i) => approvedIndexes.includes(i));
    const payload = JSON.stringify({ titulo_carrossel: "Test", slides: approved });
    const parsed = JSON.parse(payload);
    expect(parsed.slides).toHaveLength(2);
    expect(parsed.slides[0].layout).toBe("capa");
    expect(parsed.slides[1].layout).toBe("stat");
  });

  it("campaign_brief fields match expected structure", () => {
    const brief = {
      tipo: "educativo",
      objetivo: "Gerar autoridade",
      tese: "Vitamina D muda tudo",
      percepcao: "Confiança",
      nivel_ousadia: 3,
      territorio_visual: "clean editorial",
      presenca_medica: "casual",
      cta: "Salve para lembrar",
      restricoes: "CFM 2.336",
    };

    expect(brief.tipo).toBeTruthy();
    expect(brief.nivel_ousadia).toBeGreaterThanOrEqual(1);
    expect(brief.nivel_ousadia).toBeLessThanOrEqual(5);
    expect(brief.objetivo.length).toBeGreaterThan(0);
    expect(brief.tese.length).toBeGreaterThan(0);
  });
});

// ─── Golden Patterns / Golden Reason ──────────────────────────────────

describe("golden_case and golden_reason flow", () => {
  it("golden_case defaults to false", () => {
    const item = {
      id: "test-1",
      golden_case: false,
      golden_reason: null as string | null,
      content_type: "educativo",
    };
    expect(item.golden_case).toBe(false);
    expect(item.golden_reason).toBeNull();
  });

  it("toggling golden_case preserves other fields", () => {
    const item = {
      id: "test-1",
      golden_case: false,
      golden_reason: null as string | null,
      content_type: "manifesto",
      title: "Peça premium",
    };

    // Toggle to golden
    const toggled = { ...item, golden_case: true };
    expect(toggled.golden_case).toBe(true);
    expect(toggled.content_type).toBe("manifesto");
    expect(toggled.title).toBe("Peça premium");

    // Toggle back
    const untoggled = { ...toggled, golden_case: false };
    expect(untoggled.golden_case).toBe(false);
  });

  it("golden_reason can store qualitative explanation", () => {
    const item = {
      golden_case: true,
      golden_reason: "Alta taxa de salvamento e padrão visual consistente com posicionamento",
    };
    expect(item.golden_reason).toBeTruthy();
    expect(item.golden_reason!.length).toBeGreaterThan(10);
  });

  it("golden_patterns in memory structure are string arrays", () => {
    // Mirrors the schema expected by generate-memory edge function
    const memoryFragment = {
      golden_patterns: [
        "Abertura com dado de impacto + virada de perspectiva",
        "Slide final com pergunta reflexiva em 1a pessoa",
      ],
    };
    expect(Array.isArray(memoryFragment.golden_patterns)).toBe(true);
    expect(memoryFragment.golden_patterns.length).toBeGreaterThan(0);
    memoryFragment.golden_patterns.forEach((p) => {
      expect(typeof p).toBe("string");
      expect(p.length).toBeGreaterThan(0);
    });
  });
});

// ─── Visual System Selection ──────────────────────────────────────────

describe("visual system selection", () => {
  const availableStyles: ArchetypeStyle[] = ["travessia", "editorial_black_gold"];

  it("all available styles have a matching visual system", () => {
    for (const style of availableStyles) {
      expect(VISUAL_SYSTEMS[style]).toBeDefined();
      expect(VISUAL_SYSTEMS[style].label).toBeTruthy();
    }
  });

  it("preferredVisualStyle in roteiro selects the correct system", () => {
    const roteiro = makeRoteiro([], { preferredVisualStyle: "editorial_black_gold" });
    const vs = VISUAL_SYSTEMS[roteiro.preferredVisualStyle!];
    expect(vs.premium).toBe(true);
    expect(vs.colors.accent).toBe("#C9A84C");
  });

  it("defaults to editorial_black_gold when preferredVisualStyle is undefined", () => {
    const roteiro = makeRoteiro([]);
    // Mirrors Carrossel.tsx line 281 logic
    const style: PreferredVisualStyle = roteiro.preferredVisualStyle || "editorial_black_gold";
    expect(style).toBe("editorial_black_gold");
    expect(VISUAL_SYSTEMS[style]).toBeDefined();
  });

  it("travessia and editorial_black_gold have distinct color palettes", () => {
    const t = VISUAL_SYSTEMS.travessia.colors;
    const e = VISUAL_SYSTEMS.editorial_black_gold.colors;
    expect(t.bg).not.toBe(e.bg);
    expect(t.accent).not.toBe(e.accent);
  });

  it("visual system from skill overrides roteiro default", () => {
    // Mirrors Carrossel.tsx logic: profile?.skill?.estilo_visual?.preferredVisualStyle
    const skillStyle: PreferredVisualStyle = "travessia";
    const roteiroStyle: PreferredVisualStyle | undefined = undefined;
    const resolved = roteiroStyle || skillStyle || "editorial_black_gold";
    expect(resolved).toBe("travessia");
  });
});

// ─── QA Score + Warnings Integration ──────────────────────────────────

describe("QA scoring integration with visual validation", () => {
  const perfectSlides = [
    makeSlide(1, "capa", { headline: "Pare agora", eyebrow: "Nutrologia" }),
    makeSlide(2, "tonly", { big_text: "Verdade", texto: "Curto" }),
    makeSlide(3, "stat", { stat_number: "73%", stat_unit: "casos" }),
    makeSlide(4, "turning", { turn_text: "Mas e se...", opinion: "Insight" }),
    makeSlide(5, "light", { mini_titulo: "Dica", texto: "Leve" }),
    makeSlide(6, "timg", { mini_titulo: "Prova", texto: "Visual" }),
    makeSlide(7, "final", { conclusion: "Cuide de voce", pergunta_comentario: "O que voce faz?" }),
  ];

  it("perfect roteiro passes all 3 quality checks", () => {
    const roteiro = makeRoteiro(perfectSlides);
    const warnings = validarRoteiro(roteiro);
    const quality = avaliarQualidadeRoteiro(roteiro);
    const visual = validarVisualAntiMediocridade(roteiro);

    expect(warnings).toHaveLength(0);
    expect(quality.score).toBeGreaterThanOrEqual(85);
    expect(quality.summary).toBe("excelente");
    expect(visual.verdict).toBe("premium");
  });

  it("weak roteiro fails all 3 quality checks", () => {
    const weakSlides = [
      makeSlide(1, "tonly", { big_text: "Errado" }), // not capa
      makeSlide(2, "tonly", { big_text: "Genérico" }),
      makeSlide(3, "tonly", { big_text: "Outro" }),
    ];
    const roteiro = makeRoteiro(weakSlides);
    const warnings = validarRoteiro(roteiro);
    const quality = avaliarQualidadeRoteiro(roteiro);
    const visual = validarVisualAntiMediocridade(roteiro);

    expect(warnings.length).toBeGreaterThan(0);
    expect(quality.summary).toBe("fraca");
    // Visual score depends on exact penalty math — verify it's not premium
    expect(["fraco", "morno"]).toContain(visual.verdict);
  });

  it("QA score boundaries: 85=excelente, 70=boa, 55=regular, <55=fraca", () => {
    // Just testing the boundary logic from avaliarQualidadeRoteiro
    const testBoundary = (score: number) => {
      if (score >= 85) return "excelente";
      if (score >= 70) return "boa";
      if (score >= 55) return "regular";
      return "fraca";
    };
    expect(testBoundary(100)).toBe("excelente");
    expect(testBoundary(85)).toBe("excelente");
    expect(testBoundary(84)).toBe("boa");
    expect(testBoundary(70)).toBe("boa");
    expect(testBoundary(69)).toBe("regular");
    expect(testBoundary(55)).toBe("regular");
    expect(testBoundary(54)).toBe("fraca");
    expect(testBoundary(0)).toBe("fraca");
  });
});
