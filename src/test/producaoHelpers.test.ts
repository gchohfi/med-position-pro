import { describe, expect, it } from "vitest";
import { normalizeCampaignResult } from "@/lib/producao-helpers";

describe("normalizeCampaignResult", () => {
  it("converts legacy block content into render-safe slides", () => {
    const result = normalizeCampaignResult(
      {
        Gancho: "**Gancho forte**",
        "Quebra de percepção": "Quebra importante",
        "Explicação / visão": "Explicação detalhada",
        "Método / lógica": "Passo a passo",
        Manifesto: "Manifesto da campanha",
        Fechamento: "Fechamento final",
      },
      "Título legado"
    );

    expect(result).not.toBeNull();
    expect(result?.titulo).toBe("Título legado");
    expect(result?.slides).toHaveLength(6);
    expect(result?.slides[0]).toMatchObject({
      numero: 1,
      papel: "gancho",
      titulo: "Gancho",
      corpo: "Gancho forte",
      approved: true,
    });
  });

  it("supports nested slide plan payloads from generation responses", () => {
    const result = normalizeCampaignResult({
      titulo_campanha: "Campanha nova",
      hashtags: "#medicina #autoridade",
      slide_plan_json: {
        slides: [{ numero: 1, papel: "gancho", titulo: "Título", corpo: "Corpo" }],
      },
    });

    expect(result).not.toBeNull();
    expect(result?.titulo).toBe("Campanha nova");
    expect(result?.hashtags).toEqual(["#medicina", "#autoridade"]);
    expect(result?.slides[0]).toMatchObject({
      numero: 1,
      papel: "gancho",
      titulo: "Título",
      corpo: "Corpo",
      approved: true,
    });
  });
});
