import React from "react";
import { getCreativeDirection, getSlideTension } from "./creativeDirection";

export interface SlideData {
  type: "cover" | "statement" | "editorial" | "structured" | "manifesto" | "signature" | "breathing";
  travessiaLayout?: "capa" | "timg" | "tonly" | "stat" | "turning" | "light" | "final";
  label: string;
  headline: string;
  body?: string;
  items?: string[];
  slideNumber: number;
  totalSlides: number;
  showImage?: boolean;
  // TravessIA fields
  eyebrow?: string;
  imgQuery?: string;
  zoneLabel?: string;
  statNumber?: string;
  statUnit?: string;
  eDai?: string;
  miniTitulo?: string;
  opinion?: string;
  conclusion?: string;
  perguntaComentario?: string;
}

// ─── EDITORIAL STYLE SYSTEMS ─────────────────────────────────────────────
// Three distinct brand languages — not themes, not skins.
// Each system dictates composition, typography weight, spacing, and image behavior.

export type ArchetypeStyle = "vogue" | "apple" | "clinical" | "travessia";

export interface VisualSystem {
  label: string;
  description: string;
  colors: { bg: string; bgAlt: string; text: string; textMuted: string; accent: string; coverBg: string; coverText: string };
  headlineFont: string;
  bodyFont: string;
  headlineSizes: { xl: number; lg: number; md: number; sm: number };
  bodySize: number;
  lineHeights: { headline: number; body: number };
  margins: { page: number; inner: number };
}

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "'Inter', -apple-system, system-ui, sans-serif";

export const VISUAL_SYSTEMS: Record<ArchetypeStyle, VisualSystem> = {
  vogue: {
    label: "Vogue",
    description: "Branding, manifesto, autoridade editorial",
    colors: {
      bg: "#0E0E0E", bgAlt: "#161616", text: "#F5F3EF", textMuted: "#F5F3EF55",
      accent: "#C4A76C", coverBg: "#080808", coverText: "#FFFFFF",
    },
    headlineFont: SERIF,
    bodyFont: SANS,
    headlineSizes: { xl: 96, lg: 76, md: 60, sm: 48 },
    bodySize: 22,
    lineHeights: { headline: 0.92, body: 1.7 },
    margins: { page: 120, inner: 56 },
  },
  apple: {
    label: "Apple",
    description: "Minimal, conceitual, educativo refinado",
    colors: {
      bg: "#FAFAFA", bgAlt: "#F5F5F5", text: "#1D1D1F", textMuted: "#1D1D1F44",
      accent: "#86868B", coverBg: "#000000", coverText: "#F5F5F7",
    },
    headlineFont: SANS,
    bodyFont: SANS,
    headlineSizes: { xl: 88, lg: 68, md: 54, sm: 44 },
    bodySize: 24,
    lineHeights: { headline: 1.04, body: 1.65 },
    margins: { page: 140, inner: 64 },
  },
  clinical: {
    label: "Clinical Premium",
    description: "Estruturado, método, clareza científica",
    colors: {
      bg: "#F4F6F8", bgAlt: "#EBEEF2", text: "#1E2A3A", textMuted: "#1E2A3A50",
      accent: "#4A7C9B", coverBg: "#0F1A28", coverText: "#F0F2F5",
    },
    headlineFont: SERIF,
    bodyFont: SANS,
    headlineSizes: { xl: 72, lg: 56, md: 46, sm: 38 },
    bodySize: 23,
    lineHeights: { headline: 1.12, body: 1.7 },
    margins: { page: 110, inner: 52 },
  },
  travessia: {
    label: "TravessIA",
    description: "Layout editorial com 7 tipos (capa, texto+img, stat, turning, light, final)",
    colors: {
      bg: "#111111", bgAlt: "#1a1a1a", text: "#f0f0f0", textMuted: "rgba(255,255,255,0.5)",
      accent: "#ffffff", coverBg: "#111111", coverText: "#ffffff",
    },
    headlineFont: "'Bebas Neue', 'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    headlineSizes: { xl: 120, lg: 96, md: 80, sm: 64 },
    bodySize: 40,
    lineHeights: { headline: 0.92, body: 1.55 },
    margins: { page: 56, inner: 28 },
  },
};

export type CarouselTheme = ArchetypeStyle;
export const CAROUSEL_THEMES = VISUAL_SYSTEMS;

// Content-type → style auto-selection
const CONTENT_STYLE_MAP: Record<string, ArchetypeStyle> = {
  manifesto: "vogue",
  conversao: "vogue",
  educativo: "apple",
  hibrido: "apple",
  conexao: "clinical",
};

// Archetype → style auto-selection
const ARCHETYPE_MAP: Record<string, ArchetypeStyle> = {
  "Especialista": "vogue",
  "Visionária": "vogue",
  "Líder": "vogue",
  "Artesã": "vogue",
  "Mentora": "apple",
  "Educadora": "apple",
  "Cuidadora": "clinical",
  "Inovadora": "clinical",
  "Técnica": "clinical",
  "Conectora": "clinical",
};

export function getStyleForArchetype(archetype?: string | null): ArchetypeStyle {
  if (!archetype) return "vogue";
  return ARCHETYPE_MAP[archetype] || "vogue";
}

export function getStyleForContentType(contentType?: string): ArchetypeStyle {
  if (!contentType) return "vogue";
  return CONTENT_STYLE_MAP[contentType] || "vogue";
}

// ─── GRAIN TEXTURE (shared SVG noise) ──────────────────────────────────────
const GRAIN_URL = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const grain = (opacity = 0.035): React.CSSProperties => ({
  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
  opacity,
  backgroundImage: GRAIN_URL,
  backgroundSize: "128px 128px",
  pointerEvents: "none",
});

// ─── RENDERER ─────────────────────────────────────────────────────────────

// ─── TRAVESSIA EMPHASIS UTILITY ─────────────────────────────────────────
// Converts *text* to <em> with accent color
function travessiaEmphasis(text: string, accentColor: string): React.ReactNode {
  if (!text) return null;
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i} style={{ color: accentColor, fontStyle: "italic" }}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

// ─── TRAVESSIA RENDERER ────────────────────────────────────────────────────
// Renders all 7 TravessIA layouts: capa, timg, tonly, stat, turning, light, final
function renderTravessia(
  slide: SlideData,
  ref: React.Ref<HTMLDivElement>,
  vs: VisualSystem,
  c: VisualSystem["colors"],
  PAD: number,
  handle: string,
  name: string,
): React.ReactElement {
  const layout = slide.travessiaLayout!;
  const DISPLAY = vs.headlineFont;
  const BODY = vs.bodyFont;
  const W = 1080;
  const H = 1350;

  const base: React.CSSProperties = {
    width: W, height: H, boxSizing: "border-box",
    fontFamily: BODY, position: "relative", overflow: "hidden",
  };

  const isDark = layout !== "light";
  const bgColor = isDark ? c.bg : "#FFFFFF";
  const textColor = isDark ? c.text : "#111111";
  const mutedColor = isDark ? c.textMuted : "rgba(0,0,0,0.45)";
  const accentColor = isDark ? c.accent : "#111111";

  // Header: brand name left, handle right
  const header = (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0,
      padding: `${PAD}px ${PAD}px 0`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      zIndex: 3,
    }}>
      <span style={{
        fontFamily: DISPLAY, fontSize: 28, fontWeight: 700,
        color: accentColor, textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}>
        {name}
      </span>
      <span style={{
        fontFamily: BODY, fontSize: 18, fontWeight: 400,
        color: mutedColor,
      }}>
        {handle}
      </span>
    </div>
  );

  // Footer: slide counter left, dots center, CTA on first/last
  const counter = `${String(slide.slideNumber).padStart(2, "0")}/${String(slide.totalSlides).padStart(2, "0")}`;
  const isFirstOrLast = slide.slideNumber === 1 || slide.slideNumber === slide.totalSlides;
  const ctaText = slide.slideNumber === 1 ? "DESLIZE PARA O LADO" : slide.slideNumber === slide.totalSlides ? "SALVE E COMPARTILHE" : "";

  const dots = Array.from({ length: Math.min(slide.totalSlides, 15) }, (_, i) => (
    <div key={i} style={{
      width: i === slide.slideNumber - 1 ? 16 : 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: i === slide.slideNumber - 1 ? accentColor : mutedColor,
      opacity: i === slide.slideNumber - 1 ? 1 : 0.3,
      transition: "width 0.2s",
    }} />
  ));

  const footer = (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      padding: `0 ${PAD}px ${40}px`,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
      zIndex: 3,
    }}>
      {isFirstOrLast && ctaText && (
        <span style={{
          fontFamily: BODY, fontSize: 13, fontWeight: 600,
          color: mutedColor, letterSpacing: "0.18em", textTransform: "uppercase",
        }}>
          {ctaText}
        </span>
      )}
      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
        {dots}
      </div>
      <div style={{
        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontFamily: BODY, fontSize: 14, fontWeight: 500, color: mutedColor }}>
          {counter}
        </span>
        <span style={{ fontFamily: BODY, fontSize: 11, color: mutedColor, opacity: 0.5 }}>
          {handle}
        </span>
      </div>
    </div>
  );

  // ── CAPA ──
  if (layout === "capa") {
    return (
      <div ref={ref} style={{ ...base, backgroundColor: bgColor }}>
        {/* Background gradient fallback for image */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: `linear-gradient(155deg, #0a0a0a 0%, #1a1a1a 40%, #111111 100%)`,
        }} />
        {/* Overlay gradient */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.15) 100%)",
          zIndex: 1,
        }} />
        {header}
        <div style={{
          position: "absolute", bottom: 140, left: PAD, right: PAD,
          zIndex: 2, display: "flex", flexDirection: "column",
        }}>
          {slide.eyebrow && (
            <span style={{
              fontFamily: BODY, fontSize: 18, fontWeight: 600,
              color: accentColor, textTransform: "uppercase",
              letterSpacing: "0.2em", marginBottom: 24,
            }}>
              {slide.eyebrow}
            </span>
          )}
          <h1 style={{
            fontFamily: DISPLAY, fontSize: 120, fontWeight: 700,
            lineHeight: 0.92, color: "#FFFFFF",
            margin: 0, textTransform: "uppercase",
            letterSpacing: "-0.02em",
          }}>
            {travessiaEmphasis(slide.headline, accentColor)}
          </h1>
        </div>
        {footer}
      </div>
    );
  }

  // ── TIMG ──
  if (layout === "timg") {
    return (
      <div ref={ref} style={{ ...base, backgroundColor: bgColor }}>
        {header}
        {/* Image block placeholder */}
        <div style={{
          position: "absolute", top: 80, left: 0, right: 0, height: 520,
          background: `linear-gradient(135deg, ${c.bgAlt} 0%, ${c.bg} 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontFamily: BODY, fontSize: 16, color: mutedColor, opacity: 0.4,
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            {slide.imgQuery || "IMAGE"}
          </span>
        </div>
        <div style={{
          position: "absolute", top: 630, left: PAD, right: PAD, bottom: 140,
          display: "flex", flexDirection: "column", justifyContent: "center",
          zIndex: 2,
        }}>
          {slide.miniTitulo && (
            <h2 style={{
              fontFamily: DISPLAY, fontSize: 80, fontWeight: 700,
              lineHeight: 0.92, color: textColor,
              margin: 0, marginBottom: 28, textTransform: "uppercase",
            }}>
              {travessiaEmphasis(slide.miniTitulo, accentColor)}
            </h2>
          )}
          {slide.body && (
            <p style={{
              fontFamily: BODY, fontSize: 40, fontWeight: 400,
              lineHeight: 1.55, color: textColor,
              margin: 0, opacity: 0.85,
            }}>
              {travessiaEmphasis(slide.body, accentColor)}
            </p>
          )}
        </div>
        {footer}
      </div>
    );
  }

  // ── TONLY ──
  if (layout === "tonly") {
    return (
      <div ref={ref} style={{ ...base, backgroundColor: bgColor }}>
        {header}
        <div style={{
          position: "absolute", top: 0, left: PAD, right: PAD, bottom: 140,
          display: "flex", flexDirection: "column", justifyContent: "center",
          zIndex: 2,
        }}>
          {slide.zoneLabel && (
            <span style={{
              fontFamily: BODY, fontSize: 18, fontWeight: 600,
              color: accentColor, textTransform: "uppercase",
              letterSpacing: "0.2em", marginBottom: 20,
            }}>
              {slide.zoneLabel}
            </span>
          )}
          {/* Divider bar */}
          <div style={{
            width: 64, height: 4, backgroundColor: accentColor,
            marginBottom: 40, borderRadius: 2,
          }} />
          <h2 style={{
            fontFamily: DISPLAY, fontSize: 88, fontWeight: 700,
            lineHeight: 0.92, color: textColor,
            margin: 0, marginBottom: 32, textTransform: "uppercase",
          }}>
            {travessiaEmphasis(slide.headline, accentColor)}
          </h2>
          {slide.body && (
            <p style={{
              fontFamily: BODY, fontSize: 40, fontWeight: 400,
              lineHeight: 1.55, color: textColor,
              margin: 0, opacity: 0.85, maxWidth: "90%",
            }}>
              {travessiaEmphasis(slide.body, accentColor)}
            </p>
          )}
        </div>
        {footer}
      </div>
    );
  }

  // ── STAT ──
  if (layout === "stat") {
    return (
      <div ref={ref} style={{ ...base, backgroundColor: bgColor }}>
        {header}
        <div style={{
          position: "absolute", top: 0, left: PAD, right: PAD, bottom: 140,
          display: "flex", flexDirection: "column", justifyContent: "center",
          zIndex: 2,
        }}>
          {slide.statNumber && (
            <span style={{
              fontFamily: DISPLAY, fontSize: 220, fontWeight: 700,
              lineHeight: 0.85, color: accentColor,
              letterSpacing: "-0.03em",
            }}>
              {slide.statNumber}
            </span>
          )}
          {slide.statUnit && (
            <span style={{
              fontFamily: BODY, fontSize: 22, fontWeight: 600,
              color: mutedColor, textTransform: "uppercase",
              letterSpacing: "0.2em", marginTop: 8, marginBottom: 40,
            }}>
              {slide.statUnit}
            </span>
          )}
          {slide.body && (
            <p style={{
              fontFamily: BODY, fontSize: 40, fontWeight: 400,
              lineHeight: 1.55, color: textColor,
              margin: 0, marginBottom: 32, opacity: 0.85, maxWidth: "90%",
            }}>
              {travessiaEmphasis(slide.body, accentColor)}
            </p>
          )}
          {slide.eDai && (
            <div style={{
              borderLeft: `4px solid ${accentColor}`,
              paddingLeft: 24, marginTop: 16,
            }}>
              <p style={{
                fontFamily: BODY, fontSize: 32, fontWeight: 400,
                lineHeight: 1.5, color: mutedColor,
                margin: 0, fontStyle: "italic",
              }}>
                {travessiaEmphasis(slide.eDai, accentColor)}
              </p>
            </div>
          )}
        </div>
        {footer}
      </div>
    );
  }

  // ── TURNING ──
  if (layout === "turning") {
    return (
      <div ref={ref} style={{ ...base, backgroundColor: bgColor }}>
        {header}
        {/* Full-width accent bar */}
        <div style={{
          position: "absolute", top: 300, left: 0, right: 0,
          height: 10, backgroundColor: accentColor,
          zIndex: 2,
        }} />
        <div style={{
          position: "absolute", top: 340, left: PAD, right: PAD, bottom: 140,
          display: "flex", flexDirection: "column", justifyContent: "center",
          zIndex: 2,
        }}>
          <h2 style={{
            fontFamily: DISPLAY, fontSize: 96, fontWeight: 700,
            lineHeight: 0.92, color: textColor,
            margin: 0, marginBottom: 40, textTransform: "uppercase",
          }}>
            {travessiaEmphasis(slide.headline, accentColor)}
          </h2>
          {slide.opinion && (
            <p style={{
              fontFamily: BODY, fontSize: 44, fontWeight: 400,
              lineHeight: 1.45, color: textColor,
              margin: 0, fontStyle: "italic", opacity: 0.85,
              maxWidth: "92%",
            }}>
              {travessiaEmphasis(slide.opinion, accentColor)}
            </p>
          )}
        </div>
        {footer}
      </div>
    );
  }

  // ── LIGHT ──
  if (layout === "light") {
    const lightBg = "#FFFFFF";
    const lightText = "#111111";
    const lightMuted = "rgba(0,0,0,0.45)";
    const lightAccent = "#111111";
    return (
      <div ref={ref} style={{ ...base, backgroundColor: lightBg }}>
        {/* Light header override */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          padding: `${PAD}px ${PAD}px 0`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          zIndex: 3,
        }}>
          <span style={{
            fontFamily: DISPLAY, fontSize: 28, fontWeight: 700,
            color: lightAccent, textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}>
            {name}
          </span>
          <span style={{
            fontFamily: BODY, fontSize: 18, fontWeight: 400,
            color: lightMuted,
          }}>
            {handle}
          </span>
        </div>
        <div style={{
          position: "absolute", top: 100, left: PAD, right: PAD, bottom: 140,
          display: "flex", flexDirection: "column", justifyContent: "center",
          zIndex: 2,
        }}>
          {slide.miniTitulo && (
            <h2 style={{
              fontFamily: DISPLAY, fontSize: 80, fontWeight: 700,
              lineHeight: 0.92, color: lightText,
              margin: 0, marginBottom: 28, textTransform: "uppercase",
            }}>
              {travessiaEmphasis(slide.miniTitulo, lightAccent)}
            </h2>
          )}
          {slide.body && (
            <p style={{
              fontFamily: BODY, fontSize: 40, fontWeight: 400,
              lineHeight: 1.55, color: lightText,
              margin: 0, opacity: 0.85, maxWidth: "90%",
            }}>
              {travessiaEmphasis(slide.body, lightAccent)}
            </p>
          )}
          {/* Optional image area */}
          {slide.imgQuery && (
            <div style={{
              marginTop: 40, width: "100%", height: 300,
              background: `linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)`,
              borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{
                fontFamily: BODY, fontSize: 14, color: lightMuted, opacity: 0.5,
                letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                {slide.imgQuery}
              </span>
            </div>
          )}
        </div>
        {/* Light footer override */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: `0 ${PAD}px ${40}px`,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          zIndex: 3,
        }}>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {Array.from({ length: Math.min(slide.totalSlides, 15) }, (_, i) => (
              <div key={i} style={{
                width: i === slide.slideNumber - 1 ? 16 : 6,
                height: 6, borderRadius: 3,
                backgroundColor: i === slide.slideNumber - 1 ? lightAccent : lightMuted,
                opacity: i === slide.slideNumber - 1 ? 1 : 0.3,
              }} />
            ))}
          </div>
          <div style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontFamily: BODY, fontSize: 14, fontWeight: 500, color: lightMuted }}>
              {counter}
            </span>
            <span style={{ fontFamily: BODY, fontSize: 11, color: lightMuted, opacity: 0.5 }}>
              {handle}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── FINAL ──
  if (layout === "final") {
    return (
      <div ref={ref} style={{ ...base, backgroundColor: bgColor }}>
        {header}
        <div style={{
          position: "absolute", top: 0, left: PAD, right: PAD, bottom: 140,
          display: "flex", flexDirection: "column", justifyContent: "center",
          zIndex: 2,
        }}>
          {slide.conclusion && (
            <h2 style={{
              fontFamily: DISPLAY, fontSize: 96, fontWeight: 700,
              lineHeight: 0.92, color: textColor,
              margin: 0, marginBottom: 48, textTransform: "uppercase",
            }}>
              {travessiaEmphasis(slide.conclusion, accentColor)}
            </h2>
          )}
          {/* CTA box */}
          <div style={{
            backgroundColor: accentColor, padding: 44,
            borderRadius: 4, marginBottom: 40,
          }}>
            <span style={{
              fontFamily: DISPLAY, fontSize: 36, fontWeight: 700,
              color: bgColor, textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}>
              SALVE ESTE CARROSSEL
            </span>
          </div>
          {slide.perguntaComentario && (
            <div style={{ borderTop: `1px solid ${mutedColor}`, paddingTop: 28 }}>
              <p style={{
                fontFamily: BODY, fontSize: 32, fontWeight: 400,
                lineHeight: 1.5, color: mutedColor,
                margin: 0,
              }}>
                {travessiaEmphasis(slide.perguntaComentario, accentColor)}
              </p>
            </div>
          )}
        </div>
        {footer}
      </div>
    );
  }

  // Fallback for unknown TravessIA layout
  return (
    <div ref={ref} style={{ ...base, backgroundColor: bgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: mutedColor, fontFamily: BODY, fontSize: 40 }}>
        {slide.headline}
      </p>
    </div>
  );
}

interface SlideRendererProps {
  slide: SlideData;
  visualSystem?: ArchetypeStyle;
  brandName?: string;
  brandHandle?: string;
  brandColors?: { bg: string; text: string; accent: string; bgAlt?: string };
  contentType?: string;
  doctorImageUrl?: string;
}

const SlideRenderer = React.forwardRef<HTMLDivElement, SlideRendererProps>(
  ({ slide, visualSystem = "vogue", brandName, brandHandle, brandColors, contentType, doctorImageUrl }, ref) => {
    const vs = VISUAL_SYSTEMS[visualSystem];
    const dir = getCreativeDirection(contentType);
    const tension = getSlideTension(dir, slide.slideNumber - 1);
    const style = visualSystem;

    const c = brandColors
      ? {
          ...vs.colors,
          bg: brandColors.bg, text: brandColors.text, accent: brandColors.accent,
          bgAlt: brandColors.bgAlt || vs.colors.bgAlt,
          textMuted: `${brandColors.text}50`,
          coverBg: brandColors.text, coverText: brandColors.bg,
        }
      : vs.colors;

    const PAD = vs.margins.page;
    const handle = brandHandle || "@medshift";
    const name = brandName || "MEDSHIFT";

    const base: React.CSSProperties = {
      width: 1080,
      height: 1350,
      boxSizing: "border-box",
      fontFamily: vs.bodyFont,
      position: "relative",
      overflow: "hidden",
    };

    // ── FOOTER ──
    const footer = (color: string, zIdx = 2) => (
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: `0 ${PAD}px ${40}px`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        zIndex: zIdx,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 500, color,
          letterSpacing: "0.04em", fontFamily: vs.bodyFont,
          opacity: style === "vogue" ? 0.25 : 0.18,
        }}>
          {handle}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 400, color,
          letterSpacing: "0.12em", fontFamily: vs.bodyFont,
          opacity: 0.14,
        }}>
          {String(slide.slideNumber).padStart(2, "0")}/{String(slide.totalSlides).padStart(2, "0")}
        </span>
      </div>
    );

    // ═══ TRAVESSIA VISUAL SYSTEM ═══
    if (style === "travessia" && slide.travessiaLayout) {
      return renderTravessia(slide, ref, vs, c, PAD, handle, name);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ███ COVER ██████████████████████████████████████████████████████████████
    // ═══════════════════════════════════════════════════════════════════════
    if (slide.type === "cover") {
      const wc = slide.headline.split(/\s+/).length;
      const hasImage = !!doctorImageUrl;

      // ── VOGUE COVER: Full-bleed image, aggressive crop, massive serif ──
      if (style === "vogue") {
        const fontSize = wc <= 3 ? 142 : wc <= 4 ? 118 : 96;
        return (
          <div ref={ref} style={{ ...base, backgroundColor: "#060606" }}>
            {hasImage && (
              <>
                <div style={{
                  position: "absolute", top: "-15%", left: "10%", right: "-12%", bottom: "-10%",
                  backgroundImage: `url(${doctorImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "42% 5%",
                  filter: "contrast(1.2) brightness(0.45) saturate(0.65)",
                }} />
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  background: "linear-gradient(110deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 25%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.1) 75%, rgba(0,0,0,0.3) 100%)",
                }} />
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  background: "radial-gradient(ellipse 50% 50% at 62% 30%, transparent 10%, rgba(0,0,0,0.65) 100%)",
                }} />
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
                  background: "linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)",
                }} />
              </>
            )}
            {!hasImage && (
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: `linear-gradient(155deg, #0A0A0A 0%, #121212 40%, #0E0E0E 100%)`,
              }} />
            )}
            <div style={grain(0.05)} />
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 60,
              display: "flex", flexDirection: "column",
              justifyContent: "flex-end",
              padding: `${PAD}px ${PAD * 0.7}px ${PAD * 2.8}px`,
              zIndex: 2,
            }}>
              <div style={{
                width: 52, height: 3, backgroundColor: c.accent,
                opacity: 0.6, marginBottom: 72, borderRadius: 1,
              }} />
              <h1 style={{
                fontFamily: SERIF,
                fontSize,
                fontWeight: 700,
                lineHeight: 0.85,
                color: "#FFFFFF",
                margin: 0,
                maxWidth: "95%",
                letterSpacing: "-0.055em",
                textTransform: "uppercase",
                textShadow: hasImage
                  ? "0 8px 60px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5)"
                  : "none",
              }}>
                {slide.headline}
              </h1>
            </div>
            {footer("#FFFFFF", 3)}
          </div>
        );
      }

      // ── APPLE COVER: Pure black, massive sans-serif, no image ──
      if (style === "apple") {
        const fontSize = wc <= 3 ? 120 : wc <= 5 ? 96 : 78;
        return (
          <div ref={ref} style={{ ...base, backgroundColor: "#000000" }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 60,
              display: "flex", flexDirection: "column",
              justifyContent: "center",
              padding: `${PAD * 1.5}px ${PAD * 1.2}px`,
            }}>
              <h1 style={{
                fontFamily: SANS,
                fontSize,
                fontWeight: 700,
                lineHeight: 1.0,
                color: "#F5F5F7",
                margin: 0,
                maxWidth: "90%",
                letterSpacing: "-0.04em",
              }}>
                {slide.headline}
              </h1>
            </div>
            {footer("#F5F5F7", 3)}
          </div>
        );
      }

      // ── CLINICAL COVER: Dark blue, serif headline, subtle structure ──
      const fontSize = wc <= 3 ? 96 : wc <= 5 ? 78 : 64;
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.coverBg }}>
          {hasImage && (
            <>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: `url(${doctorImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "50% 15%",
                filter: "contrast(1.1) brightness(0.35) saturate(0.5)",
                opacity: 0.5,
              }} />
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: `linear-gradient(180deg, ${c.coverBg}EE 0%, ${c.coverBg}BB 50%, ${c.coverBg} 100%)`,
              }} />
            </>
          )}
          <div style={grain(0.03)} />
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 60,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD}px ${PAD}px`,
          }}>
            <div style={{
              width: 56, height: 2, backgroundColor: c.accent,
              opacity: 0.5, marginBottom: 48,
            }} />
            <h1 style={{
              fontFamily: SERIF,
              fontSize,
              fontWeight: 600,
              lineHeight: 1.08,
              color: c.coverText,
              margin: 0,
              maxWidth: "85%",
              letterSpacing: "-0.02em",
            }}>
              {slide.headline}
            </h1>
            <span style={{
              marginTop: 36, fontSize: 12, fontWeight: 600,
              color: c.accent, letterSpacing: "0.3em",
              textTransform: "uppercase", opacity: 0.6,
              fontFamily: SANS,
            }}>
              {name}
            </span>
          </div>
          {footer(c.coverText, 3)}
        </div>
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ███ BREATHING ██████████████████████████████████████████████████████████
    // ═══════════════════════════════════════════════════════════════════════
    if (slide.type === "breathing") {
      const isDash = slide.headline === "—";
      const hLen = slide.headline.length;

      // ── VOGUE: Dark breathing, ultra-minimal ──
      if (style === "vogue") {
        const hSize = isDash ? 200 : hLen <= 20 ? 38 : 28;
        return (
          <div ref={ref} style={{ ...base, backgroundColor: "#0E0E0E" }}>
            <div style={grain(0.04)} />
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              display: "flex", flexDirection: "column",
              justifyContent: "center", alignItems: "center",
              padding: `${PAD * 3}px ${PAD * 2}px`,
              textAlign: "center",
            }}>
              <p style={{
                fontFamily: isDash ? SANS : SERIF,
                fontSize: hSize,
                fontWeight: isDash ? 100 : 400,
                lineHeight: isDash ? 1 : 1.6,
                color: "#F5F3EF",
                margin: 0,
                maxWidth: "45%",
                fontStyle: isDash ? "normal" : "italic",
                opacity: isDash ? 0.06 : 0.2,
                letterSpacing: isDash ? 0 : "0.02em",
              }}>
                {slide.headline}
              </p>
            </div>
            {footer("#F5F3EF")}
          </div>
        );
      }

      // ── APPLE: Maximum whitespace, barely-there text ──
      if (style === "apple") {
        const hSize = isDash ? 160 : hLen <= 20 ? 32 : 24;
        return (
          <div ref={ref} style={{ ...base, backgroundColor: "#FAFAFA" }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              display: "flex", flexDirection: "column",
              justifyContent: "center", alignItems: "center",
              padding: `${PAD * 4}px ${PAD * 2.5}px`,
              textAlign: "center",
            }}>
              <p style={{
                fontFamily: SANS,
                fontSize: hSize,
                fontWeight: isDash ? 100 : 500,
                lineHeight: isDash ? 1 : 1.7,
                color: "#1D1D1F",
                margin: 0,
                maxWidth: "40%",
                opacity: isDash ? 0.04 : 0.15,
                letterSpacing: isDash ? 0 : "0.01em",
              }}>
                {slide.headline}
              </p>
            </div>
            {footer("#1D1D1F")}
          </div>
        );
      }

      // ── CLINICAL: Light with accent line ──
      const hSize = isDash ? 160 : hLen <= 20 ? 34 : 26;
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bg }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            padding: `${PAD * 3}px ${PAD * 2}px`,
            textAlign: "center",
          }}>
            {!isDash && (
              <div style={{
                width: 40, height: 2, backgroundColor: c.accent,
                opacity: 0.15, marginBottom: 48,
              }} />
            )}
            <p style={{
              fontFamily: isDash ? SANS : SERIF,
              fontSize: hSize,
              fontWeight: isDash ? 100 : 400,
              lineHeight: isDash ? 1 : 1.65,
              color: c.text,
              margin: 0,
              maxWidth: "50%",
              fontStyle: isDash ? "normal" : "italic",
              opacity: isDash ? 0.05 : 0.22,
            }}>
              {slide.headline}
            </p>
          </div>
          {footer(c.text)}
        </div>
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ███ STATEMENT ██████████████████████████████████████████████████████████
    // ═══════════════════════════════════════════════════════════════════════
    if (slide.type === "statement") {
      const hLen = slide.headline.length;

      // ── VOGUE: Dark, massive italic, cinematic ──
      if (style === "vogue") {
        const hSize = hLen <= 25 ? 78 : hLen <= 45 ? 62 : hLen <= 70 ? 50 : 42;
        return (
          <div ref={ref} style={{ ...base, backgroundColor: "#0A0A0A" }}>
            <div style={grain(0.04)} />
            <div style={{
              position: "absolute",
              left: PAD - 20,
              top: "18%", bottom: "18%",
              width: 3, backgroundColor: c.accent,
              opacity: 0.5, borderRadius: 2,
            }} />
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
              display: "flex", flexDirection: "column",
              justifyContent: "center",
              padding: `${PAD}px ${PAD * 1.4}px ${PAD}px ${PAD + 40}px`,
            }}>
              <blockquote style={{
                fontFamily: SERIF,
                fontSize: hSize,
                fontWeight: 500,
                lineHeight: 1.18,
                color: "#F5F3EF",
                margin: 0,
                fontStyle: "italic",
                maxWidth: "82%",
                letterSpacing: "-0.02em",
              }}>
                {slide.headline}
              </blockquote>
            </div>
            {footer("#F5F3EF")}
          </div>
        );
      }

      // ── APPLE: Light, clean, centered sans-serif ──
      if (style === "apple") {
        const hSize = hLen <= 25 ? 64 : hLen <= 45 ? 52 : hLen <= 70 ? 42 : 36;
        return (
          <div ref={ref} style={{ ...base, backgroundColor: "#FAFAFA" }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
              display: "flex", flexDirection: "column",
              justifyContent: "center", alignItems: "center",
              padding: `${PAD}px ${PAD * 1.8}px`,
              textAlign: "center",
            }}>
              <p style={{
                fontFamily: SANS,
                fontSize: hSize,
                fontWeight: 600,
                lineHeight: 1.2,
                color: "#1D1D1F",
                margin: 0,
                maxWidth: "75%",
                letterSpacing: "-0.025em",
              }}>
                {slide.headline}
              </p>
            </div>
            {footer("#1D1D1F")}
          </div>
        );
      }

      // ── CLINICAL: Accent bar, structured quote ──
      const hSize = hLen <= 25 ? 60 : hLen <= 45 ? 50 : hLen <= 70 ? 42 : 36;
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bg }}>
          <div style={{
            position: "absolute",
            left: PAD - 28,
            top: "22%", bottom: "22%",
            width: 3, backgroundColor: c.accent,
            opacity: 0.4, borderRadius: 2,
          }} />
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD}px ${PAD * 1.6}px ${PAD}px ${PAD + 36}px`,
          }}>
            <blockquote style={{
              fontFamily: SERIF,
              fontSize: hSize,
              fontWeight: 500,
              lineHeight: 1.22,
              color: c.text,
              margin: 0,
              fontStyle: "italic",
              maxWidth: "85%",
              letterSpacing: "-0.015em",
            }}>
              {slide.headline}
            </blockquote>
          </div>
          {footer(c.text)}
        </div>
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ███ EDITORIAL ██████████████████████████████████████████████████████████
    // ═══════════════════════════════════════════════════════════════════════
    if (slide.type === "editorial") {
      const hLen = slide.headline.length;
      const useDark = tension === "heavy";

      // ── VOGUE: Always dark, dramatic contrast ──
      if (style === "vogue") {
        const hSize = hLen <= 25 ? 100 : hLen <= 45 ? 80 : hLen <= 70 ? 64 : 52;
        const hasImage = !!(doctorImageUrl && useDark);

        return (
          <div ref={ref} style={{ ...base, backgroundColor: useDark ? "#060606" : "#0E0E0E" }}>
            {hasImage && (
              <>
                <div style={{
                  position: "absolute", top: "-10%", left: "20%", right: "-10%", bottom: "-5%",
                  backgroundImage: `url(${doctorImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "45% 10%",
                  filter: "contrast(1.15) brightness(0.3) saturate(0.5)",
                }} />
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  background: "linear-gradient(100deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.3) 100%)",
                }} />
              </>
            )}
            <div style={grain(useDark ? 0.045 : 0.03)} />
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
              display: "flex", flexDirection: "column",
              justifyContent: "center",
              padding: `${PAD}px ${PAD}px`,
            }}>
              <div style={{
                width: useDark ? 44 : 28, height: 2.5,
                backgroundColor: c.accent,
                opacity: useDark ? 0.55 : 0.25,
                marginBottom: 48, borderRadius: 1,
              }} />
              <h2 style={{
                fontFamily: SERIF,
                fontSize: hSize,
                fontWeight: useDark ? 700 : 500,
                lineHeight: useDark ? 0.92 : 1.05,
                color: "#F5F3EF",
                margin: 0,
                maxWidth: useDark ? "88%" : "72%",
                letterSpacing: useDark ? "-0.045em" : "-0.02em",
                textTransform: useDark ? "uppercase" : "none",
                textShadow: hasImage ? "0 4px 30px rgba(0,0,0,0.5)" : "none",
              }}>
                {slide.headline}
              </h2>
              {slide.body && !useDark && (
                <p style={{
                  fontSize: vs.bodySize,
                  lineHeight: vs.lineHeights.body,
                  color: "#F5F3EF55",
                  margin: `${vs.margins.inner}px 0 0`,
                  maxWidth: "60%",
                  fontWeight: 400,
                }}>
                  {slide.body}
                </p>
              )}
            </div>
            {footer("#F5F3EF")}
          </div>
        );
      }

      // ── APPLE: Alternates white/black, massive sans ──
      if (style === "apple") {
        const hSize = hLen <= 25 ? 88 : hLen <= 45 ? 68 : hLen <= 70 ? 54 : 44;
        const bgColor = useDark ? "#000000" : "#FAFAFA";
        const textColor = useDark ? "#F5F5F7" : "#1D1D1F";
        const mutedColor = useDark ? "#F5F5F744" : "#1D1D1F40";

        return (
          <div ref={ref} style={{ ...base, backgroundColor: bgColor }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
              display: "flex", flexDirection: "column",
              justifyContent: "center",
              padding: `${PAD * 1.2}px ${PAD * 1.3}px`,
            }}>
              <h2 style={{
                fontFamily: SANS,
                fontSize: hSize,
                fontWeight: 700,
                lineHeight: 1.04,
                color: textColor,
                margin: 0,
                maxWidth: "80%",
                letterSpacing: "-0.035em",
              }}>
                {slide.headline}
              </h2>
              {slide.body && (
                <p style={{
                  fontSize: vs.bodySize,
                  lineHeight: vs.lineHeights.body,
                  color: mutedColor,
                  margin: `${vs.margins.inner + 8}px 0 0`,
                  maxWidth: "60%",
                  fontWeight: 400,
                }}>
                  {slide.body}
                </p>
              )}
            </div>
            {footer(textColor)}
          </div>
        );
      }

      // ── CLINICAL: Light/dark alternation, structured ──
      const hSize = hLen <= 25 ? vs.headlineSizes.xl : hLen <= 45 ? vs.headlineSizes.lg : hLen <= 70 ? vs.headlineSizes.md : vs.headlineSizes.sm;
      const bgColor = useDark ? c.coverBg : c.bg;
      const textColor = useDark ? c.coverText : c.text;
      const mutedColor = useDark ? `${c.coverText}55` : c.textMuted;

      return (
        <div ref={ref} style={{ ...base, backgroundColor: bgColor }}>
          {useDark && <div style={grain(0.03)} />}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD}px ${PAD}px`,
          }}>
            <div style={{
              width: 32, height: 2,
              backgroundColor: c.accent,
              opacity: 0.3, marginBottom: 40,
            }} />
            <h2 style={{
              fontFamily: SERIF,
              fontSize: hSize,
              fontWeight: 600,
              lineHeight: vs.lineHeights.headline,
              color: textColor,
              margin: 0,
              maxWidth: "75%",
              letterSpacing: "-0.015em",
            }}>
              {slide.headline}
            </h2>
            {slide.body && (
              <p style={{
                fontSize: vs.bodySize,
                lineHeight: vs.lineHeights.body,
                color: mutedColor,
                margin: `${vs.margins.inner}px 0 0`,
                maxWidth: "65%",
                fontWeight: 400,
              }}>
                {slide.body}
              </p>
            )}
          </div>
          {footer(textColor)}
        </div>
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ███ STRUCTURED █████████████████████████████████████████████████████████
    // ═══════════════════════════════════════════════════════════════════════
    if (slide.type === "structured") {
      const items = (slide.items || []).slice(0, 3);

      // ── VOGUE: Dark bg, gold numbers, editorial structure ──
      if (style === "vogue") {
        return (
          <div ref={ref} style={{ ...base, backgroundColor: "#0E0E0E" }}>
            <div style={grain(0.035)} />
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
              display: "flex", flexDirection: "column",
              justifyContent: "center",
              padding: `${PAD}px ${PAD}px`,
            }}>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: c.accent, letterSpacing: "0.3em",
                textTransform: "uppercase",
                opacity: 0.6, marginBottom: 32,
                fontFamily: SANS,
              }}>
                {slide.label}
              </span>
              <h2 style={{
                fontFamily: SERIF,
                fontSize: 50,
                fontWeight: 600,
                lineHeight: 1.1,
                color: "#F5F3EF",
                margin: `0 0 ${72}px`,
                maxWidth: "70%",
                letterSpacing: "-0.02em",
              }}>
                {slide.headline}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 36 }}>
                    <span style={{
                      fontFamily: SERIF,
                      fontSize: 96,
                      fontWeight: 300,
                      color: c.accent,
                      lineHeight: 0.75,
                      minWidth: 88,
                      opacity: 0.55,
                      letterSpacing: "-0.06em",
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p style={{
                      fontSize: 22,
                      lineHeight: 1.5,
                      color: "#F5F3EF",
                      margin: 0,
                      maxWidth: "75%",
                      fontWeight: 400,
                      paddingTop: 16,
                      opacity: 0.55,
                      fontFamily: SANS,
                    }}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {footer("#F5F3EF")}
          </div>
        );
      }

      // ── APPLE: White bg, grey numbers, ultra-clean ──
      if (style === "apple") {
        return (
          <div ref={ref} style={{ ...base, backgroundColor: "#FAFAFA" }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
              display: "flex", flexDirection: "column",
              justifyContent: "center",
              padding: `${PAD * 1.1}px ${PAD * 1.2}px`,
            }}>
              <h2 style={{
                fontFamily: SANS,
                fontSize: 48,
                fontWeight: 700,
                lineHeight: 1.1,
                color: "#1D1D1F",
                margin: `0 0 ${80}px`,
                maxWidth: "75%",
                letterSpacing: "-0.03em",
              }}>
                {slide.headline}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 52 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 28 }}>
                    <span style={{
                      fontFamily: SANS,
                      fontSize: 80,
                      fontWeight: 200,
                      color: "#86868B",
                      lineHeight: 0.8,
                      minWidth: 72,
                      opacity: 0.4,
                      letterSpacing: "-0.04em",
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p style={{
                      fontSize: 24,
                      lineHeight: 1.5,
                      color: "#1D1D1F",
                      margin: 0,
                      maxWidth: "80%",
                      fontWeight: 400,
                      paddingTop: 12,
                      opacity: 0.6,
                      fontFamily: SANS,
                    }}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {footer("#1D1D1F")}
          </div>
        );
      }

      // ── CLINICAL: Blue accent, balanced, high clarity ──
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bg }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD}px ${PAD}px`,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: c.accent, letterSpacing: "0.25em",
              textTransform: "uppercase",
              opacity: 0.55, marginBottom: 28,
              fontFamily: SANS,
            }}>
              {slide.label}
            </span>
            <h2 style={{
              fontFamily: SERIF,
              fontSize: vs.headlineSizes.md - 4,
              fontWeight: 600,
              lineHeight: vs.lineHeights.headline + 0.1,
              color: c.text,
              margin: `0 0 ${vs.margins.inner + 40}px`,
              maxWidth: "72%",
              letterSpacing: "-0.01em",
            }}>
              {slide.headline}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 32 }}>
                  <span style={{
                    fontFamily: SERIF,
                    fontSize: 88,
                    fontWeight: 300,
                    color: c.accent,
                    lineHeight: 0.8,
                    minWidth: 80,
                    opacity: 0.6,
                    letterSpacing: "-0.05em",
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p style={{
                    fontSize: vs.bodySize + 2,
                    lineHeight: 1.5,
                    color: c.text,
                    margin: 0,
                    maxWidth: "78%",
                    fontWeight: 400,
                    paddingTop: 14,
                    opacity: 0.65,
                    fontFamily: SANS,
                  }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {footer(c.text)}
        </div>
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ███ MANIFESTO ██████████████████████████████████████████████████████████
    // ═══════════════════════════════════════════════════════════════════════
    if (slide.type === "manifesto") {
      const wc = slide.headline.split(/\s+/).length;
      const hasImage = !!(doctorImageUrl && slide.showImage);

      // ── VOGUE: Full-bleed image, aggressive crop, text overlaps subject ──
      if (style === "vogue") {
        const hSize = wc <= 5 ? 108 : wc <= 8 ? 88 : 72;
        return (
          <div ref={ref} style={{ ...base, backgroundColor: "#060606" }}>
            {hasImage ? (
              <>
                <div style={{
                  position: "absolute", top: "-18%", left: "-12%", right: "8%", bottom: "-12%",
                  backgroundImage: `url(${doctorImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "38% 3%",
                  filter: "contrast(1.25) brightness(0.4) saturate(0.55)",
                }} />
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  background: "linear-gradient(140deg, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.65) 30%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.4) 100%)",
                }} />
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  background: "radial-gradient(ellipse 45% 45% at 58% 30%, transparent 5%, rgba(0,0,0,0.6) 100%)",
                }} />
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: "50%",
                  background: "linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)",
                }} />
              </>
            ) : (
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: `radial-gradient(ellipse 70% 50% at 50% 55%, ${c.accent}0C 0%, transparent 70%)`,
              }} />
            )}
            <div style={grain(0.05)} />
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 60,
              display: "flex", flexDirection: "column",
              justifyContent: "flex-end",
              padding: `${PAD}px ${PAD * 0.7}px ${PAD * 2.5}px ${PAD}px`,
              zIndex: 2,
            }}>
              <div style={{
                width: 44, height: 3,
                backgroundColor: "#FFFFFF",
                opacity: 0.45,
                marginBottom: 56, borderRadius: 1,
              }} />
              <blockquote style={{
                fontFamily: SERIF,
                fontSize: hSize,
                fontWeight: 700,
                lineHeight: 0.9,
                color: "#FFFFFF",
                margin: 0,
                maxWidth: "90%",
                letterSpacing: "-0.045em",
                textTransform: "uppercase",
                textShadow: hasImage
                  ? "0 6px 50px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.5)"
                  : "none",
              }}>
                {slide.headline}
              </blockquote>
            </div>
            {footer("#FFFFFF", 3)}
          </div>
        );
      }

      // ── APPLE: Pure text manifesto, no image, centered weight ──
      if (style === "apple") {
        const hSize = wc <= 5 ? 84 : wc <= 8 ? 68 : 56;
        return (
          <div ref={ref} style={{ ...base, backgroundColor: "#000000" }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 60,
              display: "flex", flexDirection: "column",
              justifyContent: "center", alignItems: "center",
              padding: `${PAD * 1.5}px ${PAD * 1.6}px`,
              textAlign: "center",
            }}>
              <blockquote style={{
                fontFamily: SANS,
                fontSize: hSize,
                fontWeight: 700,
                lineHeight: 1.05,
                color: "#F5F5F7",
                margin: 0,
                maxWidth: "82%",
                letterSpacing: "-0.04em",
              }}>
                {slide.headline}
              </blockquote>
            </div>
            {footer("#F5F5F7", 3)}
          </div>
        );
      }

      // ── CLINICAL: Subtle image bg, structured authority ──
      const hSize = wc <= 5 ? 72 : wc <= 8 ? 60 : 50;
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.coverBg }}>
          {hasImage && (
            <>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: `url(${doctorImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "50% 15%",
                filter: "contrast(1.1) brightness(0.3) saturate(0.45)",
                opacity: 0.45,
              }} />
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: `linear-gradient(180deg, ${c.coverBg}DD 0%, ${c.coverBg}99 50%, ${c.coverBg}EE 100%)`,
              }} />
            </>
          )}
          <div style={grain(0.03)} />
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 60,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD}px ${PAD * 1.2}px`,
          }}>
            <div style={{
              width: 48, height: 2,
              backgroundColor: c.accent,
              opacity: 0.45, marginBottom: 44,
            }} />
            <blockquote style={{
              fontFamily: SERIF,
              fontSize: hSize,
              fontWeight: 600,
              lineHeight: 1.1,
              color: c.coverText,
              margin: 0,
              maxWidth: "80%",
              letterSpacing: "-0.02em",
            }}>
              {slide.headline}
            </blockquote>
          </div>
          {footer(c.coverText, 3)}
        </div>
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ███ SIGNATURE ██████████████████████████████████████████████████████████
    // ═══════════════════════════════════════════════════════════════════════
    if (slide.type === "signature") {
      const hLen = slide.headline.length;
      const hasImage = !!doctorImageUrl;

      // ── VOGUE: Editorial portrait, dark, image dominates ──
      if (style === "vogue") {
        const hSize = hLen <= 25 ? 52 : hLen <= 45 ? 44 : hLen <= 70 ? 36 : 30;
        return (
          <div ref={ref} style={{ ...base, backgroundColor: "#0A0A0A" }}>
            {hasImage && (
              <>
                <div style={{
                  position: "absolute",
                  top: "-10%", right: "-18%", bottom: "-8%",
                  width: "70%",
                  backgroundImage: `url(${doctorImageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "30% 5%",
                  filter: "grayscale(25%) contrast(1.15) brightness(0.75) saturate(0.8)",
                }} />
                <div style={{
                  position: "absolute", top: "-10%", left: 0, bottom: "-8%",
                  width: "55%",
                  background: `linear-gradient(90deg, #0A0A0A 35%, #0A0A0AEE 50%, #0A0A0A99 65%, #0A0A0A33 80%, transparent 100%)`,
                  zIndex: 1,
                }} />
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "15%",
                  background: `linear-gradient(180deg, #0A0A0ACC 0%, transparent 100%)`,
                  zIndex: 1,
                }} />
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: "18%",
                  background: `linear-gradient(0deg, #0A0A0ADD 0%, transparent 100%)`,
                  zIndex: 1,
                }} />
              </>
            )}
            <div style={grain(0.04)} />
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
              display: "flex", flexDirection: "column",
              justifyContent: "center",
              padding: `${PAD}px ${PAD * 1.2}px ${PAD}px ${PAD}px`,
              zIndex: 2,
            }}>
              <div style={{
                width: 36, height: 2.5,
                backgroundColor: c.accent, opacity: 0.45,
                marginBottom: 56, borderRadius: 1,
              }} />
              <h2 style={{
                fontFamily: SERIF,
                fontSize: hSize,
                fontWeight: 500,
                lineHeight: 1.2,
                color: "#F5F3EF",
                margin: 0,
                maxWidth: hasImage ? "48%" : "65%",
                letterSpacing: "-0.015em",
                fontStyle: "italic",
              }}>
                {slide.headline}
              </h2>
              <div style={{
                marginTop: 68,
                display: "flex", flexDirection: "column",
                gap: 8,
              }}>
                <span style={{
                  fontSize: 13, fontWeight: 700, color: "#F5F3EF",
                  letterSpacing: "0.25em", textTransform: "uppercase", opacity: 0.22,
                  fontFamily: SANS,
                }}>
                  {name}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 400, color: c.accent,
                  letterSpacing: "0.04em", opacity: 0.35,
                  fontFamily: SANS,
                }}>
                  {handle}
                </span>
              </div>
            </div>
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: `0 ${PAD}px ${40}px`,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 2,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 400, color: "#F5F3EF",
                letterSpacing: "0.12em", opacity: 0.1,
                fontFamily: SANS,
              }}>
                {String(slide.slideNumber).padStart(2, "0")}/{String(slide.totalSlides).padStart(2, "0")}
              </span>
            </div>
          </div>
        );
      }

      // ── APPLE: Pure white, text-only, pristine closing ──
      if (style === "apple") {
        const hSize = hLen <= 25 ? 48 : hLen <= 45 ? 40 : hLen <= 70 ? 34 : 28;
        return (
          <div ref={ref} style={{ ...base, backgroundColor: "#FAFAFA" }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
              display: "flex", flexDirection: "column",
              justifyContent: "center", alignItems: "center",
              padding: `${PAD}px`,
              textAlign: "center",
            }}>
              <h2 style={{
                fontFamily: SANS,
                fontSize: hSize,
                fontWeight: 600,
                lineHeight: 1.25,
                color: "#1D1D1F",
                margin: 0,
                maxWidth: "65%",
                letterSpacing: "-0.02em",
              }}>
                {slide.headline}
              </h2>
              <p style={{
                marginTop: 44,
                fontSize: 20,
                fontWeight: 400,
                lineHeight: 1.6,
                color: "#86868B",
                maxWidth: "50%",
                fontFamily: SANS,
              }}>
                Agende sua avaliação pelo link na bio
              </p>
              <div style={{
                marginTop: 72,
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 8,
              }}>
                <span style={{
                  fontSize: 13, fontWeight: 600, color: "#1D1D1F",
                  letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.2,
                  fontFamily: SANS,
                }}>
                  {name}
                </span>
              </div>
            </div>
            {footer("#1D1D1F")}
          </div>
        );
      }

      // ── CLINICAL: Integrated portrait, light bg ──
      const hSize = hLen <= 25 ? 46 : hLen <= 45 ? 38 : hLen <= 70 ? 32 : 28;
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bgAlt }}>
          {hasImage && (
            <>
              <div style={{
                position: "absolute",
                top: "-8%", right: "-15%", bottom: "-5%",
                width: "60%",
                backgroundImage: `url(${doctorImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "35% 8%",
                filter: "grayscale(15%) contrast(1.05) brightness(0.9) saturate(0.85)",
              }} />
              <div style={{
                position: "absolute", top: "-8%", left: 0, bottom: "-5%",
                width: "55%",
                background: `linear-gradient(90deg, ${c.bgAlt} 42%, ${c.bgAlt}EE 58%, ${c.bgAlt}88 72%, ${c.bgAlt}33 85%, transparent 100%)`,
                zIndex: 1,
              }} />
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "18%",
                background: `linear-gradient(180deg, ${c.bgAlt}DD 0%, transparent 100%)`,
                zIndex: 1,
              }} />
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "15%",
                background: `linear-gradient(0deg, ${c.bgAlt}EE 0%, transparent 100%)`,
                zIndex: 1,
              }} />
            </>
          )}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: hasImage
              ? `${PAD}px ${PAD * 1.5}px ${PAD}px ${PAD}px`
              : `${PAD}px`,
            textAlign: hasImage ? "left" : "center",
            alignItems: hasImage ? "flex-start" : "center",
            zIndex: 2,
          }}>
            <div style={{
              width: 32, height: 2,
              backgroundColor: c.accent, opacity: 0.35,
              marginBottom: 48,
            }} />
            <h2 style={{
              fontFamily: SERIF,
              fontSize: hSize,
              fontWeight: 500,
              lineHeight: 1.25,
              color: c.text,
              margin: 0,
              maxWidth: hasImage ? "48%" : "68%",
              letterSpacing: "-0.01em",
              fontStyle: "italic",
            }}>
              {slide.headline}
            </h2>
            <p style={{
              marginTop: 36,
              fontSize: vs.bodySize - 4,
              fontWeight: 400,
              lineHeight: 1.6,
              color: c.textMuted,
              maxWidth: hasImage ? "40%" : "52%",
              fontFamily: SANS,
            }}>
              Agende sua avaliação pelo link na bio
            </p>
            <div style={{
              marginTop: 56,
              display: "flex", flexDirection: "column",
              alignItems: hasImage ? "flex-start" : "center", gap: 8,
            }}>
              <span style={{
                fontSize: 13, fontWeight: 700, color: c.text,
                letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.25,
                fontFamily: SANS,
              }}>
                {name}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 400, color: c.accent,
                letterSpacing: "0.04em", opacity: 0.3,
                fontFamily: SANS,
              }}>
                {handle}
              </span>
            </div>
          </div>
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: `0 ${PAD}px ${40}px`,
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 2,
          }}>
            <span style={{
              fontSize: 10, fontWeight: 400, color: c.text,
              letterSpacing: "0.12em", opacity: 0.1,
              fontFamily: SANS,
            }}>
              {String(slide.slideNumber).padStart(2, "0")}/{String(slide.totalSlides).padStart(2, "0")}
            </span>
          </div>
        </div>
      );
    }

    // Fallback
    return (
      <div ref={ref} style={{ ...base, backgroundColor: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: c.textMuted, fontFamily: vs.bodyFont, fontSize: vs.bodySize }}>
          {slide.headline}
        </p>
      </div>
    );
  }
);

SlideRenderer.displayName = "SlideRenderer";
export default SlideRenderer;
