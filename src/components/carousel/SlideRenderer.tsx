import React from "react";

export interface SlideData {
  type: "cover" | "statement" | "editorial" | "structured" | "manifesto" | "signature" | "breathing";
  travessiaLayout?: "capa" | "timg" | "tonly" | "stat" | "turning" | "light" | "timeline" | "final";
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
  // timeline
  timelineSteps?: Array<{ numero: string; titulo: string; descricao?: string; destaque?: boolean }>;
  timelineTitulo?: string;
  timelineSubtitulo?: string;
}

// ─── VISUAL SYSTEMS ─────────────────────────────────────────────────────────

export type ArchetypeStyle = "travessia" | "editorial_black_gold" | "ivory_sage";

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
  premium?: boolean;
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
  editorial_black_gold: {
    label: "Black & Gold",
    description: "Premium editorial — preto profundo com acentos dourados, tipografia serifada",
    premium: true,
    colors: {
      bg: "#0A0A0A", bgAlt: "#141414", text: "#F5F0E8", textMuted: "rgba(201,168,76,0.4)",
      accent: "#C9A84C", coverBg: "#0A0A0A", coverText: "#F5F0E8",
    },
    headlineFont: "'Playfair Display', Georgia, 'Times New Roman', serif",
    bodyFont: "'Inter', sans-serif",
    headlineSizes: { xl: 130, lg: 104, md: 88, sm: 72 },
    bodySize: 40,
    lineHeights: { headline: 0.88, body: 1.6 },
    margins: { page: 64, inner: 32 },
  },
  ivory_sage: {
    label: "Ivory & Sage",
    description: "Fundo off-white elegante com acentos verde-salvia — ideal para conteúdo educativo acessível",
    premium: false,
    colors: {
      bg: "#FAF9F6", bgAlt: "#F0EDE8", text: "#1C1C1A", textMuted: "rgba(28,28,26,0.45)",
      accent: "#4A7C59", coverBg: "#F0EDE8", coverText: "#1C1C1A",
    },
    headlineFont: "'Inter', sans-serif",
    bodyFont: "'Inter', sans-serif",
    headlineSizes: { xl: 120, lg: 96, md: 80, sm: 64 },
    bodySize: 40,
    lineHeights: { headline: 0.94, body: 1.6 },
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
  doctorImageUrl?: string,
): React.ReactElement {
  const layout = slide.travessiaLayout || inferLayout(slide);
  const DISPLAY = vs.headlineFont;
  const BODY = vs.bodyFont;
  const W = 1080;
  const H = 1350;
  const isPremium = !!vs.premium;

  const base: React.CSSProperties = {
    width: W, height: H, boxSizing: "border-box",
    fontFamily: BODY, position: "relative", overflow: "hidden",
  };

  const isDark = layout !== "light";
  const bgColor = isDark ? c.bg : (isPremium ? "#FAF8F5" : "#FFFFFF");
  const textColor = isDark ? c.text : (isPremium ? "#1A1A1A" : "#111111");
  const mutedColor = isDark ? c.textMuted : (isPremium ? "rgba(30,30,30,0.4)" : "rgba(0,0,0,0.45)");
  const accentColor = isDark ? c.accent : (isPremium ? "#C9A84C" : "#111111");

  // Header: brand name left, handle right + premium gold rule
  const header = (
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0,
      padding: `${PAD}px ${PAD}px 0`,
      display: "flex", flexDirection: "column",
      zIndex: 3,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontFamily: DISPLAY, fontSize: isPremium ? 24 : 28, fontWeight: 700,
          color: accentColor, textTransform: "uppercase",
          letterSpacing: isPremium ? "0.12em" : "0.06em",
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
      {isPremium && (
        <div style={{
          width: "100%", height: 1,
          background: `linear-gradient(90deg, ${c.accent}00 0%, ${c.accent}80 30%, ${c.accent} 50%, ${c.accent}80 70%, ${c.accent}00 100%)`,
          marginTop: 16,
        }} />
      )}
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

  // ── CAPA — Manifesto editorial com presença de autoridade ──
  if (layout === "capa") {
    const hasDoctor = !!doctorImageUrl;
    const hlWords = slide.headline.split(/\s+/).length;
    // Premium: serif at larger scale for manifesto feel
    // Standard: condensed sans for impact
    const hlSize = isPremium
      ? (hlWords <= 3 ? 148 : hlWords <= 5 ? 120 : 96)
      : (hlWords <= 3 ? 130 : hlWords <= 5 ? 110 : 90);

    return (
      <div ref={ref} style={{ ...base, backgroundColor: c.bg }}>
        {/* ── Doctor image: editorial portrait, right-side composition ── */}
        {hasDoctor && (
          <>
            <div style={{
              position: "absolute",
              top: "-8%", right: isPremium ? "-5%" : "-10%", bottom: "-5%",
              width: "62%",
              backgroundImage: `url(${doctorImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "35% 8%",
              filter: isPremium
                ? "contrast(1.15) brightness(0.55) saturate(0.4) sepia(0.15)"
                : "contrast(1.2) brightness(0.45) saturate(0.6)",
            }} />
            {/* Left-to-right fade: text zone protection */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: `linear-gradient(90deg, ${c.bg} 30%, ${c.bg}EE 42%, ${c.bg}88 55%, ${c.bg}44 68%, transparent 85%)`,
              zIndex: 1,
            }} />
            {/* Bottom fade for footer */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, height: "25%",
              background: `linear-gradient(0deg, ${c.bg}EE 0%, transparent 100%)`,
              zIndex: 1,
            }} />
            {/* Top fade for header */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: "15%",
              background: `linear-gradient(180deg, ${c.bg}CC 0%, transparent 100%)`,
              zIndex: 1,
            }} />
          </>
        )}

        {/* ── No doctor: atmospheric dark gradient ── */}
        {!hasDoctor && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: isPremium
              ? `linear-gradient(160deg, #030303 0%, #0A0A0A 35%, #0F0D09 65%, #0A0A0A 100%)`
              : `linear-gradient(155deg, #0a0a0a 0%, #1a1a1a 40%, #111111 100%)`,
          }} />
        )}

        {/* Premium: gold vignette at bottom */}
        {isPremium && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: `radial-gradient(ellipse 90% 40% at 30% 95%, ${c.accent}0A 0%, transparent 70%)`,
            zIndex: 1,
          }} />
        )}

        {/* Noise/grain overlay for editorial texture */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          opacity: 0.03, zIndex: 1,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
          backgroundSize: "128px 128px",
        }} />

        {header}

        {/* ── Content zone: left-aligned manifesto composition ── */}
        <div style={{
          position: "absolute", top: 0, left: PAD, right: PAD,
          bottom: 160, display: "flex", flexDirection: "column",
          justifyContent: "flex-end", zIndex: 2,
          maxWidth: hasDoctor ? "55%" : "85%",
        }}>
          {/* Gold accent bar — tension marker */}
          {isPremium && (
            <div style={{
              width: 56, height: 3, backgroundColor: c.accent,
              opacity: 0.7, marginBottom: 40, borderRadius: 1,
            }} />
          )}

          {/* Eyebrow — specialty/context */}
          {slide.eyebrow && (
            <span style={{
              fontFamily: BODY, fontSize: isPremium ? 14 : 18, fontWeight: 600,
              color: isPremium ? c.accent : accentColor,
              textTransform: "uppercase",
              letterSpacing: isPremium ? "0.35em" : "0.2em",
              marginBottom: isPremium ? 32 : 24,
              opacity: isPremium ? 0.85 : 1,
            }}>
              {slide.eyebrow}
            </span>
          )}

          {/* Headline — THE manifesto statement */}
          <h1 style={{
            fontFamily: DISPLAY,
            fontSize: hlSize,
            fontWeight: isPremium ? 900 : 700,
            lineHeight: isPremium ? 0.88 : 0.92,
            color: c.text,
            margin: 0,
            textTransform: isPremium ? "none" : "uppercase",
            letterSpacing: isPremium ? "-0.025em" : "-0.02em",
            textShadow: hasDoctor ? `0 4px 40px ${c.bg}80` : "none",
          }}>
            {travessiaEmphasis(slide.headline, accentColor)}
          </h1>

          {/* Premium: thin accent underline below headline */}
          {isPremium && (
            <div style={{
              width: 40, height: 1, backgroundColor: c.accent,
              opacity: 0.3, marginTop: 40,
            }} />
          )}
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

  // ── FINAL — Assinatura editorial com presença da doutora ──
  if (layout === "final") {
    const hasDoctor = !!doctorImageUrl;
    return (
      <div ref={ref} style={{ ...base, backgroundColor: bgColor }}>
        {/* Doctor as subtle authority presence on the right */}
        {hasDoctor && isPremium && (
          <>
            <div style={{
              position: "absolute",
              top: "10%", right: 0, bottom: "15%",
              width: "45%",
              backgroundImage: `url(${doctorImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "40% 10%",
              filter: "contrast(1.1) brightness(0.5) saturate(0.3) sepia(0.1)",
              opacity: 0.5,
            }} />
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: `linear-gradient(90deg, ${bgColor} 45%, ${bgColor}DD 55%, ${bgColor}88 70%, transparent 100%)`,
              zIndex: 1,
            }} />
          </>
        )}
        {header}
        <div style={{
          position: "absolute", top: 0, left: PAD, right: PAD, bottom: 140,
          display: "flex", flexDirection: "column", justifyContent: "center",
          zIndex: 2, maxWidth: hasDoctor && isPremium ? "55%" : "100%",
        }}>
          {slide.conclusion && (
            <h2 style={{
              fontFamily: DISPLAY, fontSize: isPremium ? 88 : 96, fontWeight: isPremium ? 900 : 700,
              lineHeight: vs.lineHeights.headline, color: textColor,
              margin: 0, marginBottom: 48,
              textTransform: isPremium ? "none" : "uppercase",
              letterSpacing: isPremium ? "-0.02em" : "0",
            }}>
              {travessiaEmphasis(slide.conclusion, accentColor)}
            </h2>
          )}
          {/* CTA box */}
          <div style={{
            backgroundColor: accentColor, padding: isPremium ? 40 : 44,
            borderRadius: isPremium ? 2 : 4, marginBottom: 40,
            display: "inline-flex", alignSelf: "flex-start",
          }}>
            <span style={{
              fontFamily: isPremium ? BODY : DISPLAY, fontSize: isPremium ? 18 : 36,
              fontWeight: 700, color: bgColor, textTransform: "uppercase",
              letterSpacing: isPremium ? "0.2em" : "0.06em",
            }}>
              SALVE ESTE CARROSSEL
            </span>
          </div>
          {slide.perguntaComentario && (
            <div style={{
              borderTop: `1px solid ${isPremium ? c.accent + "40" : mutedColor}`,
              paddingTop: 28,
            }}>
              <p style={{
                fontFamily: BODY, fontSize: 32, fontWeight: 400,
                lineHeight: 1.5, color: mutedColor,
                margin: 0, fontStyle: isPremium ? "italic" : "normal",
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
  ({ slide, visualSystem = "editorial_black_gold", brandName, brandHandle, brandColors, doctorImageUrl }, ref) => {
    const vs = VISUAL_SYSTEMS[visualSystem] ?? VISUAL_SYSTEMS.editorial_black_gold;

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

    return renderTravessia(slide, ref, vs, c, PAD, handle, name, doctorImageUrl);
  }
);

SlideRenderer.displayName = "SlideRenderer";
export default SlideRenderer;
