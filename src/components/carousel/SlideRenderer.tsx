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

function headlineSize(len: number, sizes: { xl: number; lg: number; md: number; sm: number }): number {
  if (len <= 25) return sizes.xl;
  if (len <= 45) return sizes.lg;
  if (len <= 70) return sizes.md;
  return sizes.sm;
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

    // ── FOOTER — Minimal, near-invisible ──
    const footer = (color: string) => (
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: `0 ${PAD}px ${40}px`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
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

    // ═══════════════════════════════════════════════════════════════════════
    // COVER — MAXIMUM TENSION. Dark. Enormous type. 3-5 words only.
    // This slide must STOP the scroll. Nothing subtle here.
    // ═══════════════════════════════════════════════════════════════════════
    if (slide.type === "cover") {
      const wordCount = slide.headline.split(/\s+/).length;
      // Massive type — scales inversely with word count
      const fontSize = wordCount <= 3 ? 120 : wordCount <= 4 ? 100 : 86;

      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.coverBg }}>
          {/* Subtle grain texture via gradient */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            background: `radial-gradient(ellipse 80% 60% at 30% 70%, ${c.accent}08 0%, transparent 70%)`,
          }} />
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD * 1.2}px ${PAD}px ${PAD * 2}px`,
          }}>
            {/* Small accent dash */}
            <div style={{
              width: 36, height: 2,
              backgroundColor: c.accent, opacity: 0.35,
              marginBottom: 56, borderRadius: 1,
            }} />
            <h1 style={{
              fontFamily: vs.headlineFont,
              fontSize,
              fontWeight: 700,
              lineHeight: 0.95,
              color: c.coverText,
              margin: 0,
              maxWidth: "90%",
              letterSpacing: "-0.04em",
              textTransform: "uppercase" as const,
            }}>
              {slide.headline}
            </h1>
          </div>
          {footer(c.coverText)}
        </div>
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STATEMENT — Bold asymmetric. High contrast. Italic serif.
    // Feels like a pulled quote from a manifesto.
    // ═══════════════════════════════════════════════════════════════════════
    if (slide.type === "statement") {
      const hSize = headlineSize(slide.headline.length, {
        xl: 64, lg: 54, md: 46, sm: 38,
      });

      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bg }}>
          {/* Bold left accent bar */}
          <div style={{
            position: "absolute",
            left: PAD - 28,
            top: "25%", bottom: "25%",
            width: 3,
            backgroundColor: c.accent,
            opacity: 0.5,
            borderRadius: 2,
          }} />
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD}px ${PAD * 1.5}px ${PAD}px ${PAD + 32}px`,
          }}>
            <blockquote style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: 500,
              lineHeight: 1.22,
              color: c.text,
              margin: 0,
              fontStyle: "italic",
              maxWidth: "88%",
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
    // BREATHING — Near-empty. Maximum whitespace. Ghostly text.
    // The carousel NEEDS these pauses. They create rhythm by contrast.
    // ═══════════════════════════════════════════════════════════════════════
    if (slide.type === "breathing") {
      const isDash = slide.headline === "—";
      const hSize = isDash ? 140 : headlineSize(slide.headline.length, {
        xl: 38, lg: 32, md: 28, sm: 24,
      });

      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bgAlt }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            padding: `${PAD * 2}px`,
            textAlign: "center",
          }}>
            {!isDash && (
              <div style={{
                width: 20, height: 1.5,
                backgroundColor: c.accent, opacity: 0.12,
                marginBottom: 48, borderRadius: 1,
              }} />
            )}
            <p style={{
              fontFamily: isDash ? vs.bodyFont : vs.headlineFont,
              fontSize: hSize,
              fontWeight: isDash ? 100 : 400,
              lineHeight: isDash ? 1 : 1.55,
              color: c.text,
              margin: 0,
              maxWidth: "55%",
              fontStyle: isDash ? "normal" : "italic",
              opacity: isDash ? 0.06 : 0.3,
              letterSpacing: isDash ? 0 : "0.01em",
            }}>
              {slide.headline}
            </p>
          </div>
          {footer(c.text)}
        </div>
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EDITORIAL — Clean single idea. Medium weight. Balanced.
    // Alternates bg for visual rhythm.
    // ═══════════════════════════════════════════════════════════════════════
    if (slide.type === "editorial") {
      const hSize = headlineSize(slide.headline.length, vs.headlineSizes);
      const useDarkBg = tension === "heavy";

      const bgColor = useDarkBg ? c.coverBg : c.bg;
      const textColor = useDarkBg ? c.coverText : c.text;
      const mutedColor = useDarkBg ? `${c.coverText}60` : c.textMuted;

      return (
        <div ref={ref} style={{ ...base, backgroundColor: bgColor }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD}px ${PAD}px`,
          }}>
            <div style={{
              width: 32, height: 2,
              backgroundColor: c.accent,
              opacity: useDarkBg ? 0.4 : 0.22,
              marginBottom: 40, borderRadius: 1,
            }} />
            <h2 style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: 600,
              lineHeight: vs.lineHeights.headline + 0.08,
              color: textColor,
              margin: 0,
              maxWidth: "78%",
              letterSpacing: "-0.02em",
            }}>
              {slide.headline}
            </h2>
            {slide.body && (
              <p style={{
                fontSize: vs.bodySize,
                lineHeight: vs.lineHeights.body,
                color: mutedColor,
                margin: `${vs.margins.inner}px 0 0`,
                maxWidth: "68%",
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

    // ═══════════════════════════════════════════════════════════════════════
    // STRUCTURED — Giant numbers. Strong hierarchy. Clear contrast.
    // Numbers should be the first thing you see. Then the text.
    // ═══════════════════════════════════════════════════════════════════════
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
              color: c.accent, letterSpacing: "0.2em",
              textTransform: "uppercase" as const,
              opacity: 0.5, marginBottom: 24,
            }}>
              {slide.label}
            </span>
            <h2 style={{
              fontFamily: vs.headlineFont,
              fontSize: vs.headlineSizes.md - 4,
              fontWeight: 600,
              lineHeight: vs.lineHeights.headline + 0.1,
              color: c.text,
              margin: `0 0 ${vs.margins.inner + 32}px`,
              maxWidth: "76%",
              letterSpacing: "-0.01em",
            }}>
              {slide.headline}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 28 }}>
                  {/* GIANT number — dominant visual element */}
                  <span style={{
                    fontFamily: vs.headlineFont,
                    fontSize: 72,
                    fontWeight: 300,
                    color: c.accent,
                    lineHeight: 0.85,
                    minWidth: 64,
                    opacity: 0.7,
                    letterSpacing: "-0.04em",
                  }}>
                    {i + 1}
                  </span>
                  <p style={{
                    fontSize: vs.bodySize + 1,
                    lineHeight: 1.55,
                    color: c.text,
                    margin: 0,
                    maxWidth: "80%",
                    fontWeight: 400,
                    paddingTop: 8,
                    opacity: 0.7,
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
    // MANIFESTO — ATMOSPHERIC FULL-BLEED PHOTO.
    // Image IS the slide. Text floats on top with cinematic overlays.
    // ═══════════════════════════════════════════════════════════════════════
    if (slide.type === "manifesto") {
      const wordCount = slide.headline.split(/\s+/).length;
      const hSize = wordCount <= 5 ? 88 : wordCount <= 8 ? 72 : 60;
      const hasImage = !!(doctorImageUrl && slide.showImage);

      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.coverBg }}>
          {hasImage ? (
            <>
              {/* FULL-BLEED PHOTO — covers entire slide, off-center crop */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: `url(${doctorImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "55% 10%",
                filter: "contrast(1.1) brightness(0.7) saturate(0.85)",
              }} />
              {/* DIRECTIONAL OVERLAY — heavier on text side, lighter on image */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(110deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.15) 100%)",
              }} />
              {/* VIGNETTE — depth and focus */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 30%, rgba(0,0,0,0.4) 100%)",
              }} />
              {/* BOTTOM GRADIENT — footer legibility */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "35%",
                background: "linear-gradient(0deg, rgba(0,0,0,0.65) 0%, transparent 100%)",
              }} />
              {/* WARM ACCENT GLOW — editorial atmosphere */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: `radial-gradient(ellipse 45% 35% at 20% 60%, ${c.accent}20 0%, transparent 70%)`,
                mixBlendMode: "soft-light" as React.CSSProperties["mixBlendMode"],
              }} />
              {/* GRAIN TEXTURE — subtle editorial noise */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                opacity: 0.04,
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                backgroundSize: "128px 128px",
              }} />
            </>
          ) : (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: `radial-gradient(ellipse 70% 50% at 50% 55%, ${c.accent}12 0%, transparent 70%)`,
            }} />
          )}

          {/* TEXT — bottom-anchored over photo for cinematic feel */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 80,
            display: "flex", flexDirection: "column",
            justifyContent: "flex-end",
            padding: hasImage
              ? `${PAD}px ${PAD * 1.5}px ${PAD * 1.8}px ${PAD}px`
              : `${PAD * 1.3}px ${PAD * 0.7}px`,
            textAlign: hasImage ? "left" : "center",
            alignItems: hasImage ? "flex-start" : "center",
            zIndex: 2,
          }}>
            <div style={{
              width: 36, height: 2,
              backgroundColor: hasImage ? "#ffffff" : c.accent,
              opacity: hasImage ? 0.4 : 0.35,
              marginBottom: 40, borderRadius: 1,
            }} />
            <blockquote style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: 700,
              lineHeight: 1.05,
              color: hasImage ? "#FFFFFF" : c.coverText,
              margin: 0,
              maxWidth: hasImage ? "75%" : "85%",
              letterSpacing: "-0.03em",
              textTransform: "uppercase" as const,
              textShadow: hasImage
                ? "0 2px 30px rgba(0,0,0,0.6), 0 0 80px rgba(0,0,0,0.3)"
                : "none",
            }}>
              {slide.headline}
            </blockquote>
          </div>
          {footer(hasImage ? "#FFFFFF" : c.coverText)}
        </div>
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SIGNATURE — EDITORIAL CLOSING. Portrait integrated, not boxed.
    // Image bleeds off-frame with soft gradients. Brand presence.
    // ═══════════════════════════════════════════════════════════════════════
    if (slide.type === "signature") {
      const hSize = headlineSize(slide.headline.length, {
        xl: 44, lg: 38, md: 32, sm: 28,
      });
      const hasImage = !!doctorImageUrl;

      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bgAlt }}>
          {hasImage && (
            <>
              {/* PORTRAIT — off-center, bleeds beyond frame edges */}
              <div style={{
                position: "absolute",
                top: -40, right: -20, bottom: -40,
                width: "58%",
                backgroundImage: `url(${doctorImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center 12%",
                filter: "grayscale(18%) contrast(1.05) brightness(0.95)",
              }} />
              {/* LEFT GRADIENT MASK — smooth blend into background */}
              <div style={{
                position: "absolute", top: -40, left: 0, bottom: -40,
                width: "62%",
                background: `linear-gradient(90deg, ${c.bgAlt} 50%, ${c.bgAlt}EE 62%, ${c.bgAlt}AA 74%, ${c.bgAlt}44 86%, transparent 100%)`,
                zIndex: 1,
              }} />
              {/* TOP FADE */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "20%",
                background: `linear-gradient(180deg, ${c.bgAlt} 0%, ${c.bgAlt}88 40%, transparent 100%)`,
                zIndex: 1,
              }} />
              {/* BOTTOM FADE */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: "18%",
                background: `linear-gradient(0deg, ${c.bgAlt} 0%, ${c.bgAlt}CC 40%, transparent 100%)`,
                zIndex: 1,
              }} />
              {/* DEPTH SHADOW around portrait */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: `radial-gradient(ellipse 80% 80% at 72% 45%, transparent 30%, ${c.bgAlt}50 100%)`,
                zIndex: 1,
              }} />
              {/* SOFT ACCENT GLOW */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: `radial-gradient(ellipse 40% 30% at 30% 65%, ${c.accent}12 0%, transparent 70%)`,
                zIndex: 1,
                mixBlendMode: "multiply" as React.CSSProperties["mixBlendMode"],
              }} />
            </>
          )}

          {/* TEXT — left-anchored, interdependent with portrait */}
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
              width: 36, height: 2,
              backgroundColor: c.accent, opacity: 0.3,
              marginBottom: 44, borderRadius: 1,
            }} />
            <h2 style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: 500,
              lineHeight: 1.25,
              color: c.text,
              margin: 0,
              maxWidth: hasImage ? "46%" : "72%",
              letterSpacing: "-0.01em",
            }}>
              {slide.headline}
            </h2>
            <p style={{
              marginTop: 32,
              fontSize: vs.bodySize - 3,
              fontWeight: 400,
              lineHeight: 1.6,
              color: c.textMuted,
              maxWidth: hasImage ? "40%" : "56%",
            }}>
              Agende sua avaliação pelo link na bio
            </p>
            {/* Brand signature */}
            <div style={{
              marginTop: 48,
              display: "flex", flexDirection: "column",
              alignItems: hasImage ? "flex-start" : "center", gap: 6,
            }}>
              <span style={{
                fontSize: 13, fontWeight: 700, color: c.text,
                letterSpacing: "0.2em", textTransform: "uppercase" as const, opacity: 0.3,
              }}>
                {name}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 400, color: c.accent,
                letterSpacing: "0.04em", opacity: 0.4,
              }}>
                {handle}
              </span>
            </div>
          </div>

          {/* Centered final counter */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: `0 ${PAD}px ${40}px`,
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 2,
          }}>
            <span style={{
              fontSize: 10, fontWeight: 400, color: c.text,
              letterSpacing: "0.12em", opacity: 0.12,
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
