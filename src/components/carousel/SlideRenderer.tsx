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
  showImage?: boolean; // Whether this slide should show the doctor image
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

// ─── DIRECTION MODIFIERS ──────────────────────────────────────────────────

interface DirectionModifiers {
  padScale: number;
  headlineWeight: number;
  bodyOpacity: number;
  accentThickness: number;
  coverAlign: "flex-start" | "center";
  breathingItalic: boolean;
  asymmetricOffset: number;
}

function getDirectionModifiers(contentType?: string): DirectionModifiers {
  const dir = getCreativeDirection(contentType);
  const weightMap = { light: 400, medium: 600, heavy: 700 };

  return {
    padScale: dir.spacingScale,
    headlineWeight: weightMap[dir.typographyWeight] || 600,
    bodyOpacity: dir.typographyWeight === "light" ? 0.45 : 0.55,
    accentThickness: 1.5,
    coverAlign: dir.coverTone === "warm" ? "center" : "flex-start",
    breathingItalic: dir.coverTone !== "sharp",
    asymmetricOffset: dir.coverTone === "bold" ? 40 : dir.coverTone === "warm" ? 0 : 20,
  };
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

function headlineSize(len: number, sizes: VisualSystem["headlineSizes"]): number {
  if (len <= 25) return sizes.xl;
  if (len <= 45) return sizes.lg;
  if (len <= 70) return sizes.md;
  return sizes.sm;
}

const SlideRenderer = React.forwardRef<HTMLDivElement, SlideRendererProps>(
  ({ slide, visualSystem = "editorial-premium", brandName, brandHandle, brandColors, contentType, doctorImageUrl }, ref) => {
    const vs = VISUAL_SYSTEMS[visualSystem];
    const mod = getDirectionModifiers(contentType);
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

    const PAD = Math.round(vs.margins.page * mod.padScale);
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

    // ── BOTTOM ANCHOR — Every slide gets this footer ──
    const bottomAnchor = (color: string, dividerColor?: string) => (
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: `0 ${PAD}px ${44}px`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Subtle top divider */}
        <div style={{
          position: "absolute", top: 0, left: PAD, right: PAD,
          height: 1, backgroundColor: dividerColor || color, opacity: 0.06,
        }} />
        {/* Handle */}
        <span style={{
          fontSize: 11, fontWeight: 500, color,
          letterSpacing: "0.04em", fontFamily: vs.bodyFont,
          opacity: 0.25,
        }}>
          {handle}
        </span>
        {/* Slide counter */}
        <span style={{
          fontSize: 11, fontWeight: 400, color,
          letterSpacing: "0.12em", fontFamily: vs.bodyFont,
          opacity: 0.2,
        }}>
          {String(slide.slideNumber).padStart(2, "0")}/{String(slide.totalSlides).padStart(2, "0")}
        </span>
      </div>
    );

    const accentLine = (width: number, opacity = 0.3) => (
      <div style={{
        width, height: mod.accentThickness,
        backgroundColor: c.accent, opacity, borderRadius: 1,
      }} />
    );

    // ─── COVER — Campaign headline. Tension. No resolution. ──────────────
    if (slide.type === "cover") {
      const hSize = headlineSize(slide.headline.length, {
        xl: vs.headlineSizes.xl + 16,
        lg: vs.headlineSizes.lg + 12,
        md: vs.headlineSizes.md + 8,
        sm: vs.headlineSizes.sm + 4,
      });
      const isCentered = mod.coverAlign === "center";

      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.coverBg }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            alignItems: isCentered ? "center" : "flex-start",
            padding: isCentered
              ? `${PAD}px ${PAD}px ${PAD * 1.5}px`
              : `${PAD}px ${PAD}px ${PAD * 1.8}px`,
            textAlign: isCentered ? "center" : "left",
          }}>
            {!isCentered && (
              <div style={{ marginBottom: 44 }}>
                {accentLine(44, 0.2)}
              </div>
            )}
            <h1 style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: mod.headlineWeight,
              lineHeight: vs.lineHeights.headline,
              color: c.coverText,
              margin: 0,
              maxWidth: isCentered ? "72%" : "82%",
              letterSpacing: "-0.03em",
            }}>
              {slide.headline}
            </h1>
          </div>
          {bottomAnchor(c.coverText, c.coverText)}
        </div>
      );
    }

    // ─── STATEMENT — Tension slide. Asymmetric. Bold. ────────────────────
    if (slide.type === "statement") {
      const hSize = headlineSize(slide.headline.length, {
        xl: 60, lg: 50, md: 42, sm: 36,
      });
      const isEditorial = visualSystem === "editorial-premium";

      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bg }}>
          {/* Vertical accent bar */}
          <div style={{
            position: "absolute",
            left: PAD - 20,
            top: "32%", bottom: "32%",
            width: mod.accentThickness,
            backgroundColor: c.accent,
            opacity: 0.18,
            borderRadius: 1,
          }} />
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            bottom: 100, // leave room for anchor
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD}px ${PAD * 1.3}px ${PAD}px ${PAD + mod.asymmetricOffset}px`,
          }}>
            <blockquote style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: isEditorial ? 500 : mod.headlineWeight,
              lineHeight: 1.28,
              color: c.text,
              margin: 0,
              fontStyle: isEditorial ? "italic" : "normal",
              maxWidth: "84%",
              letterSpacing: "-0.01em",
            }}>
              {slide.headline}
            </blockquote>
          </div>
          {bottomAnchor(c.text)}
        </div>
      );
    }

    // ─── BREATHING — Emotional pause. Almost empty. ──────────────────────
    if (slide.type === "breathing") {
      const isDash = slide.headline === "—";
      const hSize = isDash ? 120 : headlineSize(slide.headline.length, {
        xl: 48, lg: 40, md: 34, sm: 30,
      });

      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bgAlt }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            bottom: 100,
            display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            padding: `${PAD * 1.5}px ${PAD * 1.3}px`,
            textAlign: "center",
          }}>
            {!isDash && (
              <div style={{ marginBottom: 52 }}>
                {accentLine(24, 0.15)}
              </div>
            )}
            <p style={{
              fontFamily: isDash ? vs.bodyFont : vs.headlineFont,
              fontSize: hSize,
              fontWeight: isDash ? 200 : (mod.breathingItalic ? 400 : 500),
              lineHeight: isDash ? 1 : 1.45,
              color: c.text,
              margin: 0,
              maxWidth: "65%",
              fontStyle: (mod.breathingItalic && !isDash) ? "italic" : "normal",
              opacity: isDash ? 0.12 : 0.6,
            }}>
              {slide.headline}
            </p>
          </div>
          {bottomAnchor(c.text)}
        </div>
      );
    }

    // ─── EDITORIAL — Single idea. Clean hierarchy. ───────────────────────
    if (slide.type === "editorial") {
      const hSize = headlineSize(slide.headline.length, vs.headlineSizes);
      const isMinimalTension = tension === "minimal";
      const isOddSlide = slide.slideNumber % 2 === 1;

      return (
        <div ref={ref} style={{ ...base, backgroundColor: isMinimalTension ? c.bgAlt : c.bg }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            bottom: 100,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD}px ${PAD}px`,
          }}>
            {isOddSlide && (
              <div style={{ marginBottom: 36 }}>
                {accentLine(36, 0.2)}
              </div>
            )}
            <h2 style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize - 4,
              fontWeight: mod.headlineWeight,
              lineHeight: vs.lineHeights.headline + 0.1,
              color: c.text,
              margin: 0,
              maxWidth: "80%",
              letterSpacing: "-0.015em",
            }}>
              {slide.headline}
            </h2>
            {slide.body && (
              <>
                <div style={{ margin: `${vs.margins.inner}px 0` }}>
                  {accentLine(32, 0.18)}
                </div>
                <p style={{
                  fontSize: vs.bodySize,
                  lineHeight: vs.lineHeights.body,
                  color: c.textMuted,
                  margin: 0,
                  maxWidth: "70%",
                  fontWeight: 400,
                  letterSpacing: "0.005em",
                }}>
                  {slide.body}
                </p>
              </>
            )}
          </div>
          {bottomAnchor(c.text)}
        </div>
      );
    }

    // ─── STRUCTURED — Minimal items. Clean numbering. ────────────────────
    if (slide.type === "structured") {
      const items = (slide.items || []).slice(0, 3);
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bg }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            bottom: 100,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD}px ${PAD}px`,
          }}>
            <h2 style={{
              fontFamily: vs.headlineFont,
              fontSize: vs.headlineSizes.md,
              fontWeight: mod.headlineWeight,
              lineHeight: vs.lineHeights.headline + 0.1,
              color: c.text,
              margin: `0 0 ${vs.margins.inner + 20}px`,
              maxWidth: "76%",
              letterSpacing: "-0.01em",
            }}>
              {slide.headline}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
                  <span style={{
                    fontFamily: vs.bodyFont,
                    fontSize: 13,
                    fontWeight: 600,
                    color: c.accent,
                    minWidth: 28,
                    marginTop: 6,
                    letterSpacing: "0.08em",
                    opacity: 0.4,
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p style={{
                    fontSize: vs.bodySize,
                    lineHeight: 1.6,
                    color: c.textMuted,
                    margin: 0,
                    maxWidth: "82%",
                    fontWeight: 400,
                    letterSpacing: "0.005em",
                  }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {bottomAnchor(c.text)}
        </div>
      );
    }

    // ─── MANIFESTO — HERO slide. Optional doctor image as background. ────
    if (slide.type === "manifesto") {
      const hSize = headlineSize(slide.headline.length, {
        xl: 68, lg: 56, md: 48, sm: 40,
      });
      const hasImage = !!(doctorImageUrl && slide.showImage);

      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.coverBg }}>
          {/* Optional doctor image — subtle, low opacity background */}
          {hasImage && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: `url(${doctorImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center 20%",
              opacity: 0.12,
              filter: "grayscale(100%)",
            }} />
          )}
          {/* Dark overlay for text readability when image present */}
          {hasImage && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: `linear-gradient(180deg, ${c.coverBg}E6 0%, ${c.coverBg}CC 50%, ${c.coverBg}F0 100%)`,
            }} />
          )}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            bottom: 100,
            display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            padding: `${PAD}px ${PAD * 0.8}px`,
            textAlign: "center",
            zIndex: 1,
          }}>
            <blockquote style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: mod.headlineWeight >= 700 ? 700 : 600,
              lineHeight: 1.2,
              color: c.coverText,
              margin: 0,
              fontStyle: "normal",
              maxWidth: "82%",
              letterSpacing: "-0.02em",
              textTransform: "uppercase" as const,
            }}>
              {slide.headline}
            </blockquote>
          </div>
          {bottomAnchor(c.coverText, c.coverText)}
        </div>
      );
    }

    // ─── SIGNATURE — Final slide. Brand. Soft CTA. Conclusive. ───────────
    if (slide.type === "signature") {
      const hSize = headlineSize(slide.headline.length, {
        xl: 46, lg: 40, md: 34, sm: 30,
      });
      const hasImage = !!doctorImageUrl;

      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bgAlt }}>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            bottom: 100,
            display: "flex", flexDirection: hasImage ? "row" : "column",
            justifyContent: "center", alignItems: hasImage ? "flex-end" : "center",
            padding: hasImage ? `${PAD}px ${PAD}px ${PAD}px ${PAD}px` : `${PAD}px`,
            textAlign: hasImage ? "left" : "center",
            gap: hasImage ? 0 : undefined,
          }}>
            {/* Text column */}
            <div style={{
              display: "flex", flexDirection: "column",
              justifyContent: "center",
              alignItems: hasImage ? "flex-start" : "center",
              flex: hasImage ? "1 1 55%" : undefined,
              zIndex: 1,
            }}>
              {/* Accent divider */}
              <div style={{ marginBottom: 48 }}>
                {accentLine(40, 0.2)}
              </div>
              <h2 style={{
                fontFamily: vs.headlineFont,
                fontSize: hSize,
                fontWeight: mod.headlineWeight >= 700 ? 600 : 500,
                lineHeight: 1.25,
                color: c.text,
                margin: 0,
                maxWidth: hasImage ? "95%" : "74%",
                letterSpacing: "-0.01em",
              }}>
                {slide.headline}
              </h2>
              {/* Soft CTA */}
              <p style={{
                marginTop: 40,
                fontSize: vs.bodySize - 2,
                fontWeight: 400,
                lineHeight: 1.6,
                color: c.textMuted,
                maxWidth: hasImage ? "90%" : "60%",
                letterSpacing: "0.01em",
              }}>
                Agende sua avaliação pelo link na bio
              </p>
              {/* Brand signature */}
              <div style={{
                marginTop: 48,
                display: "flex", flexDirection: "column",
                alignItems: hasImage ? "flex-start" : "center", gap: 6,
              }}>
                <div style={{
                  fontSize: 14, fontWeight: 700, color: c.text,
                  letterSpacing: "0.18em", textTransform: "uppercase" as const, opacity: 0.35,
                }}>
                  {name}
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 400, color: c.accent,
                  letterSpacing: "0.04em", opacity: 0.4,
                }}>
                  {handle}
                </div>
              </div>
            </div>

            {/* Doctor image — right side, clean crop */}
            {hasImage && (
              <div style={{
                flex: "0 0 40%",
                position: "relative",
                height: "100%",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                overflow: "hidden",
              }}>
                <img
                  src={doctorImageUrl}
                  alt=""
                  style={{
                    height: "85%",
                    width: "auto",
                    maxWidth: "100%",
                    objectFit: "cover",
                    objectPosition: "center top",
                    filter: "grayscale(20%)",
                    borderRadius: "4px 4px 0 0",
                  }}
                />
                {/* Subtle gradient fade at bottom */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: 80,
                  background: `linear-gradient(180deg, transparent, ${c.bgAlt})`,
                }} />
              </div>
            )}
          </div>
          {/* Final slide anchor */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: `0 ${PAD}px ${44}px`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontSize: 10, fontWeight: 500, color: c.text,
              letterSpacing: "0.12em", fontFamily: vs.bodyFont, opacity: 0.15,
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
