import React from "react";

export interface SlideData {
  type: "cover" | "statement" | "editorial" | "structured" | "manifesto" | "signature";
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
      bg: "#F8F6F2", bgAlt: "#EFECE6", text: "#2A2A2A", textMuted: "#2A2A2A88",
      accent: "#B8A07E", coverBg: "#2A2A2A", coverText: "#F8F6F2",
    },
    headlineFont: SERIF,
    bodyFont: SANS,
    headlineSizes: { xl: 60, lg: 48, md: 40, sm: 34 },
    bodySize: 19,
    lineHeights: { headline: 1.15, body: 1.75 },
    margins: { page: 108, inner: 44 },
  },
  "clinical-structured": {
    label: "Clínico Estruturado",
    description: "Limpo, técnico, alta clareza",
    colors: {
      bg: "#F4F6F8", bgAlt: "#EDF0F3", text: "#1E2A3A", textMuted: "#1E2A3A80",
      accent: "#5A7B9A", coverBg: "#1E2A3A", coverText: "#F4F6F8",
    },
    headlineFont: SANS,
    bodyFont: SANS,
    headlineSizes: { xl: 52, lg: 44, md: 38, sm: 32 },
    bodySize: 18,
    lineHeights: { headline: 1.2, body: 1.7 },
    margins: { page: 96, inner: 40 },
  },
  "humanized": {
    label: "Humanizado",
    description: "Caloroso, acessível, próximo",
    colors: {
      bg: "#FBF8F4", bgAlt: "#F5EFE8", text: "#3A3028", textMuted: "#3A302880",
      accent: "#C4956A", coverBg: "#3A3028", coverText: "#FBF8F4",
    },
    headlineFont: SERIF,
    bodyFont: SANS,
    headlineSizes: { xl: 54, lg: 44, md: 38, sm: 32 },
    bodySize: 20,
    lineHeights: { headline: 1.22, body: 1.8 },
    margins: { page: 100, inner: 48 },
  },
};

// Legacy theme compatibility
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

// ─── RENDERER ─────────────────────────────────────────────────────────────

interface SlideRendererProps {
  slide: SlideData;
  visualSystem?: ArchetypeStyle;
  brandName?: string;
  // Legacy support
  brandColors?: { bg: string; text: string; accent: string; bgAlt?: string };
}

/** Truncate to max chars at word boundary */
function truncate(text: string | undefined, max: number): string | undefined {
  if (!text) return undefined;
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

/** Pick headline font size based on length */
function headlineSize(len: number, sizes: VisualSystem["headlineSizes"]): number {
  if (len <= 40) return sizes.xl;
  if (len <= 70) return sizes.lg;
  if (len <= 110) return sizes.md;
  return sizes.sm;
}

const SlideRenderer = React.forwardRef<HTMLDivElement, SlideRendererProps>(
  ({ slide, visualSystem = "editorial-premium", brandName, brandColors }, ref) => {
    const vs = VISUAL_SYSTEMS[visualSystem];
    // Allow legacy brandColors override
    const c = brandColors
      ? { ...vs.colors, bg: brandColors.bg, text: brandColors.text, accent: brandColors.accent, bgAlt: brandColors.bgAlt || vs.colors.bgAlt, textMuted: `${brandColors.text}88`, coverBg: brandColors.text, coverText: brandColors.bg }
      : vs.colors;

    const PAD = vs.margins.page;

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
        position: "absolute", top: 56, right: 72,
        fontSize: 12, fontWeight: 500, color, letterSpacing: "0.14em",
        fontFamily: vs.bodyFont, opacity: 0.35,
      }}>
        {slide.slideNumber}/{slide.totalSlides}
      </div>
    );

    const watermark = (color: string) => brandName ? (
      <div style={{
        position: "absolute", bottom: 48, right: 72,
        fontSize: 10, fontWeight: 600, color, opacity: 0.2,
        letterSpacing: "0.1em", fontFamily: vs.bodyFont,
        textTransform: "uppercase" as const,
      }}>
        {brandName}
      </div>
    ) : null;

    const sectionLabel = (color: string) => (
      <div style={{
        position: "absolute", bottom: 48, left: PAD,
        fontSize: 9, fontWeight: 600, color, opacity: 0.3,
        letterSpacing: "0.22em", fontFamily: vs.bodyFont,
        textTransform: "uppercase" as const,
      }}>
        {slide.label}
      </div>
    );

    const accentLine = (width: number, opacity = 0.6) => (
      <div style={{ width, height: 2, backgroundColor: c.accent, opacity }} />
    );

    // ─── LAYOUT 1: COVER ─────────────────────────────────────────────────
    // Full headline, minimal, high contrast, dark bg
    if (slide.type === "cover") {
      const hSize = headlineSize(slide.headline.length, vs.headlineSizes);
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.coverBg }}>
          {slideNum(`${c.coverText}50`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            padding: `${PAD + 40}px ${PAD}px`, textAlign: "center",
          }}>
            {accentLine(48, 0.5)}
            <h1 style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: 700,
              lineHeight: vs.lineHeights.headline,
              color: c.coverText,
              margin: "48px 0 0",
              maxWidth: "90%",
              letterSpacing: "-0.015em",
            }}>
              {truncate(slide.headline, 120)}
            </h1>
            {slide.body && (
              <p style={{
                fontSize: vs.bodySize - 1,
                lineHeight: vs.lineHeights.body,
                color: `${c.coverText}70`,
                margin: "36px 0 0",
                maxWidth: "74%",
                fontWeight: 400,
              }}>
                {truncate(slide.body, 100)}
              </p>
            )}
          </div>
          {sectionLabel(c.coverText)}
          {watermark(c.coverText)}
        </div>
      );
    }

    // ─── LAYOUT 2: STATEMENT ─────────────────────────────────────────────
    // Single strong sentence, left-aligned with accent bar
    if (slide.type === "statement") {
      const hSize = headlineSize(slide.headline.length, { xl: 48, lg: 40, md: 36, sm: 32 });
      const isEditorial = visualSystem === "editorial-premium";
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bg }}>
          {slideNum(`${c.text}40`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center", padding: `${PAD}px ${PAD}px`,
          }}>
            {/* Accent bar */}
            <div style={{
              position: "absolute", left: PAD - 28, top: "28%", bottom: "28%",
              width: 3, backgroundColor: c.accent, opacity: 0.45,
            }} />
            <blockquote style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: isEditorial ? 500 : 600,
              lineHeight: 1.35,
              color: c.text,
              margin: 0,
              paddingLeft: 36,
              fontStyle: isEditorial ? "italic" : "normal",
              maxWidth: "88%",
            }}>
              {truncate(slide.headline, 200)}
            </blockquote>
          </div>
          {sectionLabel(c.text)}
          {watermark(c.text)}
        </div>
      );
    }

    // ─── LAYOUT 3: EDITORIAL ─────────────────────────────────────────────
    // Headline top + support text bottom, generous whitespace
    if (slide.type === "editorial") {
      const hSize = headlineSize(slide.headline.length, vs.headlineSizes);
      const isClinical = visualSystem === "clinical-structured";
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bg }}>
          {slideNum(`${c.text}40`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center", padding: `${PAD}px ${PAD}px`,
          }}>
            <h2 style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize - 4,
              fontWeight: isClinical ? 700 : 600,
              lineHeight: vs.lineHeights.headline + 0.05,
              color: c.text,
              margin: 0,
              maxWidth: "86%",
              letterSpacing: isClinical ? "0" : "-0.01em",
            }}>
              {truncate(slide.headline, 100)}
            </h2>
            {/* Divider */}
            <div style={{ margin: `${vs.margins.inner}px 0` }}>
              {accentLine(isClinical ? 60 : 44, 0.55)}
            </div>
            {slide.body && (
              <p style={{
                fontSize: vs.bodySize,
                lineHeight: vs.lineHeights.body,
                color: c.textMuted,
                margin: 0,
                maxWidth: "80%",
                fontWeight: 400,
              }}>
                {truncate(slide.body, 160)}
              </p>
            )}
          </div>
          {sectionLabel(c.text)}
          {watermark(c.text)}
        </div>
      );
    }

    // ─── LAYOUT 4: STRUCTURED ────────────────────────────────────────────
    // Headline + max 3 numbered items, clean grid
    if (slide.type === "structured") {
      const items = (slide.items || []).slice(0, 3); // Hard max 3 for readability
      const isClinical = visualSystem === "clinical-structured";
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bg }}>
          {slideNum(`${c.text}40`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center", padding: `${PAD}px ${PAD}px`,
          }}>
            <h2 style={{
              fontFamily: vs.headlineFont,
              fontSize: vs.headlineSizes.md,
              fontWeight: 600,
              lineHeight: vs.lineHeights.headline + 0.05,
              color: c.text,
              margin: `0 0 ${vs.margins.inner + 8}px`,
              maxWidth: "82%",
            }}>
              {truncate(slide.headline, 80)}
            </h2>
            {/* Subtle top divider for clinical */}
            {isClinical && <div style={{ width: "100%", height: 1, backgroundColor: `${c.text}10`, marginBottom: vs.margins.inner }} />}
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
                  <span style={{
                    fontFamily: vs.bodyFont,
                    fontSize: 12,
                    fontWeight: 700,
                    color: c.accent,
                    minWidth: 28,
                    marginTop: 5,
                    letterSpacing: "0.06em",
                  }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p style={{
                    fontSize: vs.bodySize,
                    lineHeight: 1.6,
                    color: c.textMuted,
                    margin: 0,
                    maxWidth: "86%",
                  }}>
                    {truncate(item, 90)}
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

    // ─── LAYOUT 5: MANIFESTO ─────────────────────────────────────────────
    // Dark bg, single strong italic statement, maximum whitespace
    if (slide.type === "manifesto") {
      const hSize = headlineSize(slide.headline.length, { xl: 44, lg: 38, md: 34, sm: 30 });
      const isHumanized = visualSystem === "humanized";
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.coverBg }}>
          {slideNum(`${c.coverText}30`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            padding: `${PAD + 20}px ${PAD}px`, textAlign: "center",
          }}>
            {/* Opening quote */}
            <div style={{
              fontFamily: vs.headlineFont,
              fontSize: 100,
              color: c.accent,
              opacity: 0.25,
              lineHeight: 0.5,
              marginBottom: 32,
            }}>
              &ldquo;
            </div>
            <blockquote style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: isHumanized ? 400 : 500,
              lineHeight: 1.4,
              color: c.coverText,
              margin: 0,
              fontStyle: "italic",
              maxWidth: "84%",
            }}>
              {truncate(slide.headline, 220)}
            </blockquote>
            <div style={{ marginTop: 48 }}>
              {accentLine(48, 0.4)}
            </div>
          </div>
          {sectionLabel(c.coverText)}
          {watermark(c.coverText)}
        </div>
      );
    }

    // ─── LAYOUT 6: SIGNATURE ─────────────────────────────────────────────
    // Warm closing slide, centered, conclusive
    if (slide.type === "signature") {
      const hSize = headlineSize(slide.headline.length, { xl: 44, lg: 38, md: 34, sm: 30 });
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bgAlt }}>
          {slideNum(`${c.text}30`)}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", flexDirection: "column",
            justifyContent: "center", alignItems: "center",
            padding: `${PAD}px ${PAD}px`, textAlign: "center",
          }}>
            <h2 style={{
              fontFamily: vs.headlineFont,
              fontSize: hSize,
              fontWeight: 600,
              lineHeight: 1.25,
              color: c.text,
              margin: 0,
              maxWidth: "82%",
            }}>
              {truncate(slide.headline, 100)}
            </h2>
            {slide.body && (
              <>
                <div style={{ margin: "40px 0" }}>{accentLine(36, 0.5)}</div>
                <p style={{
                  fontSize: vs.bodySize - 1,
                  lineHeight: vs.lineHeights.body,
                  color: c.textMuted,
                  margin: 0,
                  maxWidth: "70%",
                  fontWeight: 400,
                }}>
                  {truncate(slide.body, 110)}
                </p>
              </>
            )}
            {/* Brand signature */}
            <div style={{
              marginTop: 60,
              fontSize: 11,
              fontWeight: 600,
              color: c.accent,
              letterSpacing: "0.2em",
              textTransform: "uppercase" as const,
              opacity: 0.5,
            }}>
              {brandName || "MEDSHIFT"}
            </div>
          </div>
          {sectionLabel(c.text)}
        </div>
      );
    }

    // Fallback
    return (
      <div ref={ref} style={{ ...base, backgroundColor: c.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: `${PAD}px` }}>
        <p style={{ fontSize: 20, lineHeight: 1.7, color: c.text, textAlign: "center" }}>{slide.headline}</p>
      </div>
    );
  }
);

SlideRenderer.displayName = "SlideRenderer";

export default SlideRenderer;
