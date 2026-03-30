import React from "react";
import { type ContentIntent, getCreativeDirection, getSlideTension } from "./creativeDirection";

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
      bg: "#F8F6F2", bgAlt: "#EFECE6", text: "#2A2A2A", textMuted: "#2A2A2A70",
      accent: "#B8A07E", coverBg: "#2A2A2A", coverText: "#F8F6F2",
    },
    headlineFont: SERIF,
    bodyFont: SANS,
    headlineSizes: { xl: 72, lg: 58, md: 48, sm: 40 },
    bodySize: 22,
    lineHeights: { headline: 1.1, body: 1.7 },
    margins: { page: 120, inner: 56 },
  },
  "clinical-structured": {
    label: "Clínico Estruturado",
    description: "Limpo, técnico, alta clareza",
    colors: {
      bg: "#F4F6F8", bgAlt: "#EDF0F3", text: "#1E2A3A", textMuted: "#1E2A3A70",
      accent: "#5A7B9A", coverBg: "#1E2A3A", coverText: "#F4F6F8",
    },
    headlineFont: SANS,
    bodyFont: SANS,
    headlineSizes: { xl: 64, lg: 52, md: 44, sm: 38 },
    bodySize: 21,
    lineHeights: { headline: 1.15, body: 1.65 },
    margins: { page: 110, inner: 48 },
  },
  "humanized": {
    label: "Humanizado",
    description: "Caloroso, acessível, próximo",
    colors: {
      bg: "#FBF8F4", bgAlt: "#F5EFE8", text: "#3A3028", textMuted: "#3A302870",
      accent: "#C4956A", coverBg: "#3A3028", coverText: "#FBF8F4",
    },
    headlineFont: SERIF,
    bodyFont: SANS,
    headlineSizes: { xl: 66, lg: 54, md: 46, sm: 38 },
    bodySize: 22,
    lineHeights: { headline: 1.15, body: 1.75 },
    margins: { page: 116, inner: 52 },
  },
};

export type CarouselTheme = ArchetypeStyle;
export const CAROUSEL_THEMES = VISUAL_SYSTEMS;

// ─── ARCHETYPE → STYLE MAPPING ────────────────────────────────────────────

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

// ─── CREATIVE DIRECTION VISUAL MODIFIERS ──────────────────────────────────

interface DirectionModifiers {
  /** Padding multiplier */
  padScale: number;
  /** Headline font weight */
  headlineWeight: number;
  /** Body opacity */
  bodyOpacity: number;
  /** Accent line thickness */
  accentThickness: number;
  /** Cover headline alignment */
  coverAlign: "flex-start" | "center";
  /** Whether to use italic on breathing slides */
  breathingItalic: boolean;
}

function getDirectionModifiers(contentType?: string): DirectionModifiers {
  const dir = getCreativeDirection(contentType);

  const weightMap = { light: 400, medium: 600, heavy: 700 };
  const padMap = { light: 1.15, medium: 1.0, heavy: 0.95 };

  return {
    padScale: dir.spacingScale * (padMap[dir.typographyWeight] || 1),
    headlineWeight: weightMap[dir.typographyWeight] || 600,
    bodyOpacity: dir.typographyWeight === "light" ? 0.55 : 0.65,
    accentThickness: dir.typographyWeight === "heavy" ? 3 : 2,
    coverAlign: dir.coverTone === "warm" ? "center" : "flex-start",
    breathingItalic: dir.coverTone !== "sharp",
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

/** Pick headline font size — larger type for premium feel */
function headlineSize(len: number, sizes: VisualSystem["headlineSizes"]): number {
  if (len <= 30) return sizes.xl;
  if (len <= 55) return sizes.lg;
  if (len <= 85) return sizes.md;
  return sizes.sm;
}

const SlideRenderer = React.forwardRef<HTMLDivElement, SlideRendererProps>(
  ({ slide, visualSystem = "editorial-premium", brandName, brandColors, contentType }, ref) => {
    const vs = VISUAL_SYSTEMS[visualSystem];
    const mod = getDirectionModifiers(contentType);
    const tension = getSlideTension(getCreativeDirection(contentType), slide.slideNumber - 1);

    const c = brandColors
      ? { ...vs.colors, bg: brandColors.bg, text: brandColors.text, accent: brandColors.accent, bgAlt: brandColors.bgAlt || vs.colors.bgAlt, textMuted: `${brandColors.text}70`, coverBg: brandColors.text, coverText: brandColors.bg }
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

    // ── Shared decorators ──

    const slideNum = (color: string) => (
      <div style={{
        position: "absolute", top: 52, right: PAD,
        fontSize: 11, fontWeight: 500, color, letterSpacing: "0.18em",
        fontFamily: vs.bodyFont, opacity: 0.2,
      }}>
        {slide.slideNumber}/{slide.totalSlides}
      </div>
    );

    const watermark = (color: string) => brandName ? (
      <div style={{
        position: "absolute", bottom: 44, right: PAD,
        fontSize: 10, fontWeight: 600, color, opacity: 0.12,
        letterSpacing: "0.14em", fontFamily: vs.bodyFont,
        textTransform: "uppercase" as const,
      }}>
        {brandName}
      </div>
    ) : null;

    const sectionLabel = (color: string) => (
      <div style={{
        position: "absolute", bottom: 44, left: PAD,
        fontSize: 9, fontWeight: 600, color, opacity: 0.18,
        letterSpacing: "0.24em", fontFamily: vs.bodyFont,
        textTransform: "uppercase" as const,
      }}>
        {slide.label}
      </div>
    );

    const accentLine = (width: number, opacity = 0.5) => (
      <div style={{
        width,
        height: mod.accentThickness,
        backgroundColor: c.accent,
        opacity,
        borderRadius: 1,
      }} />
    );

    // Tension-based background selection
    const tensionBg = tension === "minimal" ? c.bgAlt : c.bg;

    // ─── COVER ────────────────────────────────────────────────────────────
    if (slide.type === "cover") {
      const hSize = headlineSize(slide.headline.length, vs.headlineSizes);
      const isCentered = mod.coverAlign === "center";
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.coverBg }}>
          {slideNum(`${c.coverText}30`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            alignItems: isCentered ? "center" : "flex-start",
            padding: `${PAD * 1.5}px ${PAD}px ${PAD}px`,
            textAlign: isCentered ? "center" : "left",
          }}>
            {accentLine(isCentered ? 40 : 56, 0.35)}
            <h1 style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: mod.headlineWeight,
              lineHeight: vs.lineHeights.headline,
              color: c.coverText,
              margin: "56px 0 0",
              maxWidth: isCentered ? "75%" : "85%",
              letterSpacing: "-0.02em",
            }}>
              {slide.headline}
            </h1>
            {slide.body && (
              <p style={{
                fontSize: vs.bodySize,
                lineHeight: vs.lineHeights.body,
                color: `${c.coverText}${Math.round(mod.bodyOpacity * 255 / 1).toString(16).padStart(2, "0")}`,
                margin: "44px 0 0",
                maxWidth: isCentered ? "60%" : "70%",
                fontWeight: 400,
              }}>
                {slide.body}
              </p>
            )}
          </div>
          {sectionLabel(c.coverText)}
          {watermark(c.coverText)}
        </div>
      );
    }

    // ─── STATEMENT ────────────────────────────────────────────────────────
    if (slide.type === "statement") {
      const hSize = headlineSize(slide.headline.length, { xl: 56, lg: 46, md: 40, sm: 36 });
      const isEditorial = visualSystem === "editorial-premium";
      return (
        <div ref={ref} style={{ ...base, backgroundColor: tensionBg }}>
          {slideNum(`${c.text}25`)}
          {/* Vertical accent bar */}
          <div style={{
            position: "absolute", left: PAD - 24, top: "30%", bottom: "30%",
            width: mod.accentThickness, backgroundColor: c.accent, opacity: 0.3, borderRadius: 2,
          }} />
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD}px ${PAD}px ${PAD}px ${PAD + 24}px`,
          }}>
            <blockquote style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: isEditorial ? 500 : mod.headlineWeight,
              lineHeight: 1.3,
              color: c.text,
              margin: 0,
              fontStyle: isEditorial ? "italic" : "normal",
              maxWidth: "85%",
            }}>
              {slide.headline}
            </blockquote>
          </div>
          {sectionLabel(c.text)}
          {watermark(c.text)}
        </div>
      );
    }

    // ─── BREATHING (ultra-minimal) ────────────────────────────────────────
    if (slide.type === "breathing") {
      const hSize = headlineSize(slide.headline.length, { xl: 52, lg: 44, md: 38, sm: 34 });
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bgAlt }}>
          {slideNum(`${c.text}15`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            padding: `${PAD * 1.6}px ${PAD * 1.3}px`,
            textAlign: "center",
          }}>
            <div style={{ marginBottom: 48 }}>
              {accentLine(28, 0.25)}
            </div>
            <p style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: mod.headlineWeight >= 700 ? 500 : 400,
              lineHeight: 1.4,
              color: c.text,
              margin: 0,
              maxWidth: "72%",
              fontStyle: mod.breathingItalic ? "italic" : "normal",
              opacity: 0.8,
            }}>
              {slide.headline}
            </p>
          </div>
          {sectionLabel(c.text)}
          {watermark(c.text)}
        </div>
      );
    }

    // ─── EDITORIAL ────────────────────────────────────────────────────────
    if (slide.type === "editorial") {
      const hSize = headlineSize(slide.headline.length, vs.headlineSizes);
      // Tension-aware: minimal slides get more whitespace
      const extraPad = tension === "minimal" ? 20 : 0;
      return (
        <div ref={ref} style={{ ...base, backgroundColor: tension === "minimal" ? c.bgAlt : c.bg }}>
          {slideNum(`${c.text}25`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD + extraPad}px ${PAD}px`,
          }}>
            <h2 style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize - 6,
              fontWeight: mod.headlineWeight,
              lineHeight: vs.lineHeights.headline + 0.05,
              color: c.text,
              margin: 0,
              maxWidth: "80%",
              letterSpacing: "-0.01em",
            }}>
              {slide.headline}
            </h2>
            {slide.body && (
              <>
                <div style={{ margin: `${vs.margins.inner + 8}px 0` }}>
                  {accentLine(44, 0.35)}
                </div>
                <p style={{
                  fontSize: vs.bodySize,
                  lineHeight: vs.lineHeights.body,
                  color: c.textMuted,
                  margin: 0,
                  maxWidth: "72%",
                  fontWeight: 400,
                  opacity: mod.bodyOpacity + 0.2,
                }}>
                  {slide.body}
                </p>
              </>
            )}
          </div>
          {sectionLabel(c.text)}
          {watermark(c.text)}
        </div>
      );
    }

    // ─── STRUCTURED ───────────────────────────────────────────────────────
    if (slide.type === "structured") {
      const items = (slide.items || []).slice(0, 3);
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bg }}>
          {slideNum(`${c.text}25`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center",
            padding: `${PAD}px ${PAD}px`,
          }}>
            <h2 style={{
              fontFamily: vs.headlineFont,
              fontSize: vs.headlineSizes.md,
              fontWeight: mod.headlineWeight,
              lineHeight: vs.lineHeights.headline + 0.05,
              color: c.text,
              margin: `0 0 ${vs.margins.inner + 16}px`,
              maxWidth: "78%",
            }}>
              {slide.headline}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 44 }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
                  <span style={{
                    fontFamily: vs.bodyFont,
                    fontSize: 13,
                    fontWeight: 700,
                    color: c.accent,
                    minWidth: 32,
                    marginTop: 4,
                    letterSpacing: "0.08em",
                    opacity: 0.6,
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p style={{
                    fontSize: vs.bodySize + 1,
                    lineHeight: 1.55,
                    color: c.textMuted,
                    margin: 0,
                    maxWidth: "82%",
                  }}>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {sectionLabel(c.text)}
          {watermark(c.text)}
        </div>
      );
    }

    // ─── MANIFESTO ────────────────────────────────────────────────────────
    if (slide.type === "manifesto") {
      const hSize = headlineSize(slide.headline.length, { xl: 50, lg: 42, md: 38, sm: 34 });
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.coverBg }}>
          {slideNum(`${c.coverText}15`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            padding: `${PAD * 1.6}px ${PAD}px`, textAlign: "center",
          }}>
            {/* Opening quote */}
            <div style={{
              fontFamily: vs.headlineFont,
              fontSize: 120,
              color: c.accent,
              opacity: 0.15,
              lineHeight: 0.4,
              marginBottom: 52,
            }}>
              &ldquo;
            </div>
            <blockquote style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: mod.headlineWeight === 700 ? 600 : 500,
              lineHeight: 1.35,
              color: c.coverText,
              margin: 0,
              fontStyle: "italic",
              maxWidth: "76%",
            }}>
              {slide.headline}
            </blockquote>
            <div style={{ marginTop: 60 }}>
              {accentLine(40, 0.25)}
            </div>
          </div>
          {sectionLabel(c.coverText)}
          {watermark(c.coverText)}
        </div>
      );
    }

    // ─── SIGNATURE ────────────────────────────────────────────────────────
    if (slide.type === "signature") {
      const hSize = headlineSize(slide.headline.length, { xl: 50, lg: 42, md: 38, sm: 34 });
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bgAlt }}>
          {slideNum(`${c.text}15`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            padding: `${PAD * 1.2}px`, textAlign: "center",
          }}>
            <h2 style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: mod.headlineWeight,
              lineHeight: 1.2,
              color: c.text,
              margin: 0,
              maxWidth: "76%",
            }}>
              {slide.headline}
            </h2>
            {slide.body && (
              <>
                <div style={{ margin: "52px 0" }}>{accentLine(32, 0.35)}</div>
                <p style={{
                  fontSize: vs.bodySize,
                  lineHeight: vs.lineHeights.body,
                  color: c.textMuted,
                  margin: 0,
                  maxWidth: "62%",
                  fontWeight: 400,
                }}>
                  {slide.body}
                </p>
              </>
            )}
            {/* Brand signature */}
            <div style={{
              marginTop: 72,
              fontSize: 11,
              fontWeight: 600,
              color: c.accent,
              letterSpacing: "0.22em",
              textTransform: "uppercase" as const,
              opacity: 0.3,
            }}>
              {brandName || "MEDSHIFT"}
            </div>
          </div>
          {sectionLabel(c.text)}
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
