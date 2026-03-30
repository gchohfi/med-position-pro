import React from "react";
import { getCreativeDirection, getSlideTension } from "./creativeDirection";

export interface SlideData {
  type: "cover" | "statement" | "editorial" | "structured" | "manifesto" | "signature" | "breathing";
  label: string;
  headline: string;
  body?: string;
  items?: string[];
  slideNumber: number;
  totalSlides: number;
  showImage?: boolean;
}

// ─── ARCHETYPE VISUAL SYSTEMS ─────────────────────────────────────────────

export type ArchetypeStyle = "editorial-premium" | "clinical-structured" | "humanized";

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
  "editorial-premium": {
    label: "Editorial Premium",
    description: "Elegante, minimalista, editorial de alto padrão",
    colors: {
      bg: "#F8F6F2", bgAlt: "#F0EDE7", text: "#2A2A2A", textMuted: "#2A2A2A55",
      accent: "#B8A07E", coverBg: "#1A1A1A", coverText: "#F5F3EF",
    },
    headlineFont: SERIF,
    bodyFont: SANS,
    headlineSizes: { xl: 82, lg: 64, md: 52, sm: 42 },
    bodySize: 24,
    lineHeights: { headline: 1.08, body: 1.75 },
    margins: { page: 120, inner: 56 },
  },
  "clinical-structured": {
    label: "Clínico Estruturado",
    description: "Limpo, técnico, alta clareza",
    colors: {
      bg: "#F4F6F8", bgAlt: "#EBEEF2", text: "#1E2A3A", textMuted: "#1E2A3A50",
      accent: "#5A7B9A", coverBg: "#1A2332", coverText: "#F0F2F5",
    },
    headlineFont: SANS,
    bodyFont: SANS,
    headlineSizes: { xl: 72, lg: 56, md: 46, sm: 38 },
    bodySize: 23,
    lineHeights: { headline: 1.12, body: 1.7 },
    margins: { page: 110, inner: 52 },
  },
  "humanized": {
    label: "Humanizado",
    description: "Caloroso, acessível, próximo",
    colors: {
      bg: "#FBF8F4", bgAlt: "#F3EDE4", text: "#3A3028", textMuted: "#3A302850",
      accent: "#C4956A", coverBg: "#2E2820", coverText: "#F8F4EE",
    },
    headlineFont: SERIF,
    bodyFont: SANS,
    headlineSizes: { xl: 76, lg: 60, md: 48, sm: 40 },
    bodySize: 24,
    lineHeights: { headline: 1.1, body: 1.78 },
    margins: { page: 116, inner: 56 },
  },
};

export type CarouselTheme = ArchetypeStyle;
export const CAROUSEL_THEMES = VISUAL_SYSTEMS;

const ARCHETYPE_MAP: Record<string, ArchetypeStyle> = {
  "Especialista": "editorial-premium",
  "Visionária": "editorial-premium",
  "Mentora": "humanized",
  "Cuidadora": "humanized",
  "Inovadora": "clinical-structured",
  "Técnica": "clinical-structured",
  "Líder": "editorial-premium",
  "Educadora": "clinical-structured",
  "Artesã": "editorial-premium",
  "Conectora": "humanized",
};

export function getStyleForArchetype(archetype?: string | null): ArchetypeStyle {
  if (!archetype) return "editorial-premium";
  return ARCHETYPE_MAP[archetype] || "editorial-premium";
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
  ({ slide, visualSystem = "editorial-premium", brandName, brandHandle, brandColors, contentType, doctorImageUrl }, ref) => {
    const vs = VISUAL_SYSTEMS[visualSystem];
    const dir = getCreativeDirection(contentType);
    const tension = getSlideTension(dir, slide.slideNumber - 1);

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

    // ── FOOTER — Near-invisible pagination ──
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
          opacity: 0.18,
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

    // ═════════════════════════════════════════════════════════════════════════
    // SLIDE 1 — COVER
    // Fullscreen doctor image. Dark overlay. Massive serif. 3-5 words.
    // Must stop the scroll. Cinematic, atmospheric, high-tension.
    // ═════════════════════════════════════════════════════════════════════════
    if (slide.type === "cover") {
      const wc = slide.headline.split(/\s+/).length;
      const fontSize = wc <= 3 ? 138 : wc <= 4 ? 116 : 96;
      const hasImage = !!doctorImageUrl;

      return (
        <div ref={ref} style={{ ...base, backgroundColor: "#080808" }}>
          {hasImage && (
            <>
              {/* Full-bleed — aggressive crop: face/upper body, off-center right */}
              <div style={{
                position: "absolute", top: "-12%", left: "15%", right: "-8%", bottom: "-8%",
                backgroundImage: `url(${doctorImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "45% 8%",
                filter: "contrast(1.15) brightness(0.5) saturate(0.7)",
              }} />
              {/* Heavy directional overlay — 80% left for text dominance */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(105deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.72) 30%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.15) 75%, rgba(0,0,0,0.25) 100%)",
              }} />
              {/* Strong vignette — cinematic */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: "radial-gradient(ellipse 55% 55% at 60% 35%, transparent 15%, rgba(0,0,0,0.6) 100%)",
              }} />
              {/* Bottom crush */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "35%",
                background: "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%)",
              }} />
            </>
          )}
          {!hasImage && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: `radial-gradient(ellipse 80% 60% at 25% 65%, ${c.accent}10 0%, transparent 70%)`,
            }} />
          )}
          <div style={grain(0.045)} />

          {/* Typography — overlaps image zone, massive, anchored bottom-left */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 60,
            display: "flex", flexDirection: "column",
            justifyContent: "flex-end",
            padding: `${PAD}px ${PAD * 0.8}px ${PAD * 2.5}px`,
            zIndex: 2,
          }}>
            <div style={{
              width: 48, height: 3, backgroundColor: c.accent,
              opacity: 0.5, marginBottom: 64, borderRadius: 1,
            }} />
            <h1 style={{
              fontFamily: SERIF,
              fontSize,
              fontWeight: 700,
              lineHeight: 0.88,
              color: "#FFFFFF",
              margin: 0,
              maxWidth: "95%",
              letterSpacing: "-0.05em",
              textTransform: "uppercase",
              textShadow: hasImage
                ? "0 6px 50px rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.5)"
                : "none",
            }}>
              {slide.headline}
            </h1>
          </div>
          {footer("#FFFFFF", 3)}
        </div>
      );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // BREATHING — Maximum whitespace. Featherweight typography.
    // Visual pause between heavy slides. Feels like a gallery breath.
    // ═════════════════════════════════════════════════════════════════════════
    if (slide.type === "breathing") {
      const isDash = slide.headline === "—";
      const hLen = slide.headline.length;
      const hSize = isDash ? 160 : hLen <= 20 ? 36 : hLen <= 40 ? 30 : 24;

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
                width: 24, height: 1.5,
                backgroundColor: c.accent, opacity: 0.12,
                marginBottom: 56, borderRadius: 1,
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
              opacity: isDash ? 0.05 : 0.25,
              letterSpacing: isDash ? 0 : "0.015em",
            }}>
              {slide.headline}
            </p>
          </div>
          {footer(c.text)}
        </div>
      );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // STATEMENT — Bold pulled quote. Italic serif. Asymmetric accent bar.
    // Feels like a manifesto pull-quote from a magazine spread.
    // ═════════════════════════════════════════════════════════════════════════
    if (slide.type === "statement") {
      const hLen = slide.headline.length;
      const hSize = hLen <= 25 ? 68 : hLen <= 45 ? 56 : hLen <= 70 ? 46 : 38;

      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bg }}>
          {/* Left accent bar */}
          <div style={{
            position: "absolute",
            left: PAD - 28,
            top: "22%", bottom: "22%",
            width: 3,
            backgroundColor: c.accent,
            opacity: 0.45,
            borderRadius: 2,
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

    // ═════════════════════════════════════════════════════════════════════════
    // EDITORIAL — Single idea. Alternates light/dark for visual rhythm.
    // Dark variant: high contrast, impactful.
    // Light variant: clean, refined, breathing.
    // ═════════════════════════════════════════════════════════════════════════
    if (slide.type === "editorial") {
      const hLen = slide.headline.length;
      const useDark = tension === "heavy";
      const hSize = hLen <= 25
        ? (useDark ? 96 : vs.headlineSizes.xl)
        : hLen <= 45
          ? (useDark ? 76 : vs.headlineSizes.lg)
          : hLen <= 70
            ? (useDark ? 60 : vs.headlineSizes.md)
            : (useDark ? 50 : vs.headlineSizes.sm);

      const bgColor = useDark ? c.coverBg : c.bg;
      const textColor = useDark ? c.coverText : c.text;
      const mutedColor = useDark ? `${c.coverText}55` : c.textMuted;

      return (
        <div ref={ref} style={{ ...base, backgroundColor: bgColor }}>
          {useDark && (
            <>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: `radial-gradient(ellipse 70% 50% at 70% 60%, ${c.accent}0A 0%, transparent 70%)`,
              }} />
              <div style={grain(0.03)} />
            </>
          )}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD}px ${PAD}px`,
          }}>
            <div style={{
              width: useDark ? 40 : 28, height: 2,
              backgroundColor: c.accent,
              opacity: useDark ? 0.5 : 0.2,
              marginBottom: 44, borderRadius: 1,
            }} />
            <h2 style={{
              fontFamily: SERIF,
              fontSize: hSize,
              fontWeight: useDark ? 700 : 600,
              lineHeight: useDark ? 1.0 : vs.lineHeights.headline + 0.08,
              color: textColor,
              margin: 0,
              maxWidth: useDark ? "85%" : "75%",
              letterSpacing: useDark ? "-0.035em" : "-0.02em",
              textTransform: useDark ? "uppercase" : "none",
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
                letterSpacing: "0.005em",
              }}>
                {slide.body}
              </p>
            )}
          </div>
          {footer(textColor)}
        </div>
      );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // STRUCTURED — Giant numbers. Strong hierarchy. Method/logic slide.
    // Numbers are the dominant visual element. 01, 02, 03.
    // ═════════════════════════════════════════════════════════════════════════
    if (slide.type === "structured") {
      const items = (slide.items || []).slice(0, 3);
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bg }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD}px ${PAD}px`,
          }}>
            {/* Section label */}
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
                  {/* GIANT number — dominant visual element */}
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

    // ═════════════════════════════════════════════════════════════════════════
    // MANIFESTO — AUTHORITY SLIDE. Fullscreen doctor image.
    // Text overlay with cinematic depth. The "I am" moment.
    // ═════════════════════════════════════════════════════════════════════════
    if (slide.type === "manifesto") {
      const wc = slide.headline.split(/\s+/).length;
      const hSize = wc <= 5 ? 92 : wc <= 8 ? 76 : 64;
      const hasImage = !!(doctorImageUrl && slide.showImage);

      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.coverBg }}>
          {hasImage ? (
            <>
              {/* Full-bleed photo — slightly off-center */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: `url(${doctorImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "50% 12%",
                filter: "contrast(1.1) brightness(0.6) saturate(0.75)",
              }} />
              {/* Directional overlay — editorial gradient */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(160deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.35) 80%, rgba(0,0,0,0.75) 100%)",
              }} />
              {/* Vignette */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: "radial-gradient(ellipse 60% 60% at 50% 40%, transparent 20%, rgba(0,0,0,0.45) 100%)",
              }} />
              {/* Bottom gradient */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "40%",
                background: "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, transparent 100%)",
              }} />
              {/* Accent glow */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: `radial-gradient(ellipse 50% 40% at 25% 65%, ${c.accent}18 0%, transparent 70%)`,
                mixBlendMode: "soft-light",
              }} />
            </>
          ) : (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: `radial-gradient(ellipse 70% 50% at 50% 55%, ${c.accent}12 0%, transparent 70%)`,
            }} />
          )}
          <div style={grain(0.04)} />

          {/* Text — bottom-anchored, cinematic */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
            display: "flex", flexDirection: "column",
            justifyContent: "flex-end",
            padding: hasImage
              ? `${PAD}px ${PAD * 1.4}px ${PAD * 2}px ${PAD}px`
              : `${PAD * 1.3}px ${PAD * 0.8}px`,
            textAlign: hasImage ? "left" : "center",
            alignItems: hasImage ? "flex-start" : "center",
            zIndex: 2,
          }}>
            <div style={{
              width: 36, height: 2,
              backgroundColor: "#FFFFFF",
              opacity: 0.35,
              marginBottom: 44, borderRadius: 1,
            }} />
            <blockquote style={{
              fontFamily: SERIF,
              fontSize: hSize,
              fontWeight: 700,
              lineHeight: 1.02,
              color: "#FFFFFF",
              margin: 0,
              maxWidth: hasImage ? "72%" : "82%",
              letterSpacing: "-0.03em",
              textTransform: "uppercase",
              textShadow: hasImage
                ? "0 3px 35px rgba(0,0,0,0.55), 0 1px 4px rgba(0,0,0,0.35)"
                : "none",
            }}>
              {slide.headline}
            </blockquote>
          </div>
          {footer("#FFFFFF", 3)}
        </div>
      );
    }

    // ═════════════════════════════════════════════════════════════════════════
    // SIGNATURE — Elegant closing. Integrated portrait. Brand presence.
    // Portrait bleeds off-frame. Left text is interdependent with image.
    // Calm. Refined. Not a CTA — a signature.
    // ═════════════════════════════════════════════════════════════════════════
    if (slide.type === "signature") {
      const hLen = slide.headline.length;
      const hSize = hLen <= 25 ? 46 : hLen <= 45 ? 38 : hLen <= 70 ? 32 : 28;
      const hasImage = !!doctorImageUrl;

      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bgAlt }}>
          {hasImage && (
            <>
              {/* Portrait — off-center, bleeds beyond edges */}
              <div style={{
                position: "absolute",
                top: -60, right: -30, bottom: -60,
                width: "55%",
                backgroundImage: `url(${doctorImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center 10%",
                filter: "grayscale(15%) contrast(1.05) brightness(0.92) saturate(0.9)",
              }} />
              {/* Left gradient mask — smooth blend */}
              <div style={{
                position: "absolute", top: -60, left: 0, bottom: -60,
                width: "65%",
                background: `linear-gradient(90deg, ${c.bgAlt} 48%, ${c.bgAlt}EE 60%, ${c.bgAlt}AA 72%, ${c.bgAlt}44 84%, transparent 100%)`,
                zIndex: 1,
              }} />
              {/* Top fade */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "22%",
                background: `linear-gradient(180deg, ${c.bgAlt} 0%, ${c.bgAlt}88 40%, transparent 100%)`,
                zIndex: 1,
              }} />
              {/* Bottom fade */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "20%",
                background: `linear-gradient(0deg, ${c.bgAlt} 0%, ${c.bgAlt}CC 40%, transparent 100%)`,
                zIndex: 1,
              }} />
              {/* Subtle accent glow */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: `radial-gradient(ellipse 40% 30% at 28% 62%, ${c.accent}0E 0%, transparent 70%)`,
                zIndex: 1,
                mixBlendMode: "multiply",
              }} />
            </>
          )}

          {/* Text — left side, interdependent with portrait */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: hasImage
              ? `${PAD}px ${PAD * 3}px ${PAD}px ${PAD}px`
              : `${PAD}px`,
            textAlign: hasImage ? "left" : "center",
            alignItems: hasImage ? "flex-start" : "center",
            zIndex: 2,
          }}>
            <div style={{
              width: 32, height: 2,
              backgroundColor: c.accent, opacity: 0.3,
              marginBottom: 48, borderRadius: 1,
            }} />
            <h2 style={{
              fontFamily: SERIF,
              fontSize: hSize,
              fontWeight: 500,
              lineHeight: 1.28,
              color: c.text,
              margin: 0,
              maxWidth: hasImage ? "44%" : "68%",
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
              maxWidth: hasImage ? "38%" : "52%",
              fontFamily: SANS,
            }}>
              Agende sua avaliação pelo link na bio
            </p>
            {/* Brand signature */}
            <div style={{
              marginTop: 56,
              display: "flex", flexDirection: "column",
              alignItems: hasImage ? "flex-start" : "center", gap: 8,
            }}>
              <span style={{
                fontSize: 13, fontWeight: 700, color: c.text,
                letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.28,
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

          {/* Centered counter */}
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
