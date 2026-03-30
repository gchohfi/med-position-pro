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
    bodySize: 21,
    lineHeights: { headline: 1.05, body: 1.7 },
    margins: { page: 130, inner: 64 },
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
    bodySize: 20,
    lineHeights: { headline: 1.1, body: 1.65 },
    margins: { page: 120, inner: 56 },
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
    bodySize: 21,
    lineHeights: { headline: 1.08, body: 1.75 },
    margins: { page: 126, inner: 60 },
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
  /** Asymmetric offset for editorial tension */
  asymmetricOffset: number;
}

function getDirectionModifiers(contentType?: string): DirectionModifiers {
  const dir = getCreativeDirection(contentType);
  const weightMap = { light: 400, medium: 600, heavy: 700 };

  return {
    padScale: dir.spacingScale,
    headlineWeight: weightMap[dir.typographyWeight] || 600,
    bodyOpacity: dir.typographyWeight === "light" ? 0.4 : 0.5,
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
  brandColors?: { bg: string; text: string; accent: string; bgAlt?: string };
  contentType?: string;
}

/** 
 * Pick headline font size — DRAMATICALLY larger for short text.
 * Short headlines (cover, breathing) should dominate the canvas.
 */
function headlineSize(len: number, sizes: VisualSystem["headlineSizes"]): number {
  if (len <= 25) return sizes.xl;
  if (len <= 45) return sizes.lg;
  if (len <= 70) return sizes.md;
  return sizes.sm;
}

const SlideRenderer = React.forwardRef<HTMLDivElement, SlideRendererProps>(
  ({ slide, visualSystem = "editorial-premium", brandName, brandColors, contentType }, ref) => {
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

    const base: React.CSSProperties = {
      width: 1080,
      height: 1350,
      boxSizing: "border-box",
      fontFamily: vs.bodyFont,
      position: "relative",
      overflow: "hidden",
    };

    // ── Minimal decorators — barely visible ──

    const slideNum = (color: string) => (
      <div style={{
        position: "absolute", top: 56, right: PAD,
        fontSize: 10, fontWeight: 400, color, letterSpacing: "0.2em",
        fontFamily: vs.bodyFont, opacity: 0.15,
      }}>
        {String(slide.slideNumber).padStart(2, "0")}
      </div>
    );

    const watermark = (color: string) => brandName ? (
      <div style={{
        position: "absolute", bottom: 48, right: PAD,
        fontSize: 9, fontWeight: 500, color, opacity: 0.08,
        letterSpacing: "0.16em", fontFamily: vs.bodyFont,
        textTransform: "uppercase" as const,
      }}>
        {brandName}
      </div>
    ) : null;

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
          {slideNum(`${c.coverText}20`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: isCentered ? "center" : "flex-end",
            alignItems: isCentered ? "center" : "flex-start",
            padding: isCentered
              ? `${PAD * 2}px ${PAD}px`
              : `${PAD}px ${PAD}px ${PAD * 2.2}px`,
            textAlign: isCentered ? "center" : "left",
          }}>
            {!isCentered && (
              <div style={{ marginBottom: 48 }}>
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
              maxWidth: isCentered ? "70%" : "80%",
              letterSpacing: "-0.03em",
            }}>
              {slide.headline}
            </h1>
          </div>
          {watermark(c.coverText)}
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
          {slideNum(`${c.text}15`)}
          {/* Subtle vertical accent — asymmetric position */}
          <div style={{
            position: "absolute",
            left: PAD - 20,
            top: "35%", bottom: "35%",
            width: mod.accentThickness,
            backgroundColor: c.accent,
            opacity: 0.2,
            borderRadius: 1,
          }} />
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD}px ${PAD * 1.5}px ${PAD}px ${PAD + mod.asymmetricOffset}px`,
          }}>
            <blockquote style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: isEditorial ? 500 : mod.headlineWeight,
              lineHeight: 1.25,
              color: c.text,
              margin: 0,
              fontStyle: isEditorial ? "italic" : "normal",
              maxWidth: "82%",
              letterSpacing: "-0.01em",
            }}>
              {slide.headline}
            </blockquote>
          </div>
          {watermark(c.text)}
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
          {slideNum(`${c.text}10`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            padding: `${PAD * 2}px ${PAD * 1.5}px`,
            textAlign: "center",
          }}>
            {!isDash && (
              <div style={{ marginBottom: 56 }}>
                {accentLine(24, 0.15)}
              </div>
            )}
            <p style={{
              fontFamily: isDash ? vs.bodyFont : vs.headlineFont,
              fontSize: hSize,
              fontWeight: isDash ? 200 : (mod.breathingItalic ? 400 : 500),
              lineHeight: isDash ? 1 : 1.4,
              color: c.text,
              margin: 0,
              maxWidth: "65%",
              fontStyle: (mod.breathingItalic && !isDash) ? "italic" : "normal",
              opacity: isDash ? 0.15 : 0.65,
            }}>
              {slide.headline}
            </p>
          </div>
          {watermark(c.text)}
        </div>
      );
    }

    // ─── EDITORIAL — Single idea. Clean hierarchy. ───────────────────────
    if (slide.type === "editorial") {
      const hSize = headlineSize(slide.headline.length, vs.headlineSizes);
      const isMinimalTension = tension === "minimal";
      // Alternate alignment for visual variation
      const isOddSlide = slide.slideNumber % 2 === 1;

      return (
        <div ref={ref} style={{ ...base, backgroundColor: isMinimalTension ? c.bgAlt : c.bg }}>
          {slideNum(`${c.text}15`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: isOddSlide ? "center" : "flex-end",
            padding: isOddSlide
              ? `${PAD}px ${PAD}px`
              : `${PAD}px ${PAD}px ${PAD * 2}px`,
          }}>
            {isOddSlide && (
              <div style={{ marginBottom: 40 }}>
                {accentLine(36, 0.2)}
              </div>
            )}
            <h2 style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize - 4,
              fontWeight: mod.headlineWeight,
              lineHeight: vs.lineHeights.headline + 0.08,
              color: c.text,
              margin: 0,
              maxWidth: "78%",
              letterSpacing: "-0.015em",
            }}>
              {slide.headline}
            </h2>
            {slide.body && (
              <>
                <div style={{ margin: `${vs.margins.inner}px 0` }}>
                  {accentLine(32, 0.2)}
                </div>
                <p style={{
                  fontSize: vs.bodySize,
                  lineHeight: vs.lineHeights.body,
                  color: c.textMuted,
                  margin: 0,
                  maxWidth: "68%",
                  fontWeight: 400,
                }}>
                  {slide.body}
                </p>
              </>
            )}
          </div>
          {watermark(c.text)}
        </div>
      );
    }

    // ─── STRUCTURED — Minimal items. Clean numbering. ────────────────────
    if (slide.type === "structured") {
      const items = (slide.items || []).slice(0, 3);
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bg }}>
          {slideNum(`${c.text}15`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD}px ${PAD}px`,
          }}>
            <h2 style={{
              fontFamily: vs.headlineFont,
              fontSize: vs.headlineSizes.md - 2,
              fontWeight: mod.headlineWeight,
              lineHeight: vs.lineHeights.headline + 0.08,
              color: c.text,
              margin: `0 0 ${vs.margins.inner + 24}px`,
              maxWidth: "75%",
              letterSpacing: "-0.01em",
            }}>
              {slide.headline}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 52 }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 28 }}>
                  <span style={{
                    fontFamily: vs.bodyFont,
                    fontSize: 12,
                    fontWeight: 500,
                    color: c.accent,
                    minWidth: 28,
                    marginTop: 5,
                    letterSpacing: "0.1em",
                    opacity: 0.45,
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p style={{
                    fontSize: vs.bodySize,
                    lineHeight: 1.55,
                    color: c.textMuted,
                    margin: 0,
                    maxWidth: "80%",
                    fontWeight: 400,
                  }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {watermark(c.text)}
        </div>
      );
    }

    // ─── MANIFESTO — Single belief. Apple-style. ─────────────────────────
    if (slide.type === "manifesto") {
      const hSize = headlineSize(slide.headline.length, {
        xl: 54, lg: 46, md: 40, sm: 34,
      });

      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.coverBg }}>
          {slideNum(`${c.coverText}10`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            padding: `${PAD * 2}px ${PAD * 1.2}px`,
            textAlign: "center",
          }}>
            <blockquote style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: mod.headlineWeight >= 700 ? 600 : 500,
              lineHeight: 1.3,
              color: c.coverText,
              margin: 0,
              fontStyle: "italic",
              maxWidth: "72%",
              letterSpacing: "-0.01em",
            }}>
              {slide.headline}
            </blockquote>
            <div style={{ marginTop: 72 }}>
              {accentLine(32, 0.15)}
            </div>
          </div>
          {watermark(c.coverText)}
        </div>
      );
    }

    // ─── SIGNATURE — Conclusive. Calm. Authoritative. ────────────────────
    if (slide.type === "signature") {
      const hSize = headlineSize(slide.headline.length, {
        xl: 48, lg: 42, md: 36, sm: 32,
      });

      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bgAlt }}>
          {slideNum(`${c.text}10`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            padding: `${PAD * 1.5}px`, textAlign: "center",
          }}>
            <h2 style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: mod.headlineWeight >= 700 ? 600 : 500,
              lineHeight: 1.2,
              color: c.text,
              margin: 0,
              maxWidth: "72%",
              letterSpacing: "-0.01em",
            }}>
              {slide.headline}
            </h2>
            {/* Brand signature — subtle, final */}
            <div style={{
              marginTop: 88,
              fontSize: 10,
              fontWeight: 500,
              color: c.accent,
              letterSpacing: "0.24em",
              textTransform: "uppercase" as const,
              opacity: 0.2,
            }}>
              {brandName || "MEDSHIFT"}
            </div>
          </div>
          {watermark(c.text)}
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
