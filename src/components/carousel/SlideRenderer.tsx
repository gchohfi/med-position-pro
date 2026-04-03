import React from "react";

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

// ─── TRAVESSIA — ÚNICO SISTEMA VISUAL ─────────────────────────────────────

export type ArchetypeStyle = "travessia";

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

export const VISUAL_SYSTEMS: Record<ArchetypeStyle, VisualSystem> = {
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
  const layout = slide.travessiaLayout || inferLayout(slide);
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

/**
 * Infer a TravessIA layout from the legacy slide type.
 * Used as fallback when travessiaLayout is not set.
 */
function inferLayout(slide: SlideData): "capa" | "timg" | "tonly" | "stat" | "turning" | "light" | "final" {
  if (slide.type === "cover") return "capa";
  if (slide.type === "signature") return "final";
  if (slide.type === "statement") return "turning";
  if (slide.type === "structured") return "stat";
  if (slide.type === "breathing") return "light";
  if (slide.type === "manifesto") return "tonly";
  // editorial and everything else
  return "tonly";
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
  ({ slide, brandName, brandHandle, brandColors }, ref) => {
    const vs = VISUAL_SYSTEMS.travessia;

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

    return renderTravessia(slide, ref, vs, c, PAD, handle, name);
  }
);

SlideRenderer.displayName = "SlideRenderer";
export default SlideRenderer;
