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

export type CarouselTheme = "editorial-light" | "editorial-dark" | "bold-minimal";

export const CAROUSEL_THEMES: Record<CarouselTheme, { label: string; colors: { bg: string; bgAlt: string; text: string; accent: string } }> = {
  "editorial-light": {
    label: "Editorial Claro",
    colors: { bg: "#FAF8F5", bgAlt: "#F0ECE6", text: "#2E2E2E", accent: "#B8A07E" },
  },
  "editorial-dark": {
    label: "Editorial Escuro",
    colors: { bg: "#1A1A1A", bgAlt: "#252525", text: "#F5F0EB", accent: "#D4B896" },
  },
  "bold-minimal": {
    label: "Bold Minimalista",
    colors: { bg: "#FFFFFF", bgAlt: "#F2F2F2", text: "#111111", accent: "#111111" },
  },
};

interface SlideRendererProps {
  slide: SlideData;
  brandColors?: {
    bg: string;
    text: string;
    accent: string;
    bgAlt?: string;
  };
  brandName?: string;
}

const defaultColors = CAROUSEL_THEMES["editorial-light"].colors;

const SERIF = "'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "'Inter', -apple-system, system-ui, sans-serif";

/**
 * Premium editorial slide renderer.
 * 1080×1350 (4:5 Instagram ratio).
 * 6 layout patterns that rotate for visual rhythm.
 */
const SlideRenderer = React.forwardRef<HTMLDivElement, SlideRendererProps>(
  ({ slide, brandColors, brandName }, ref) => {
    const c = { ...defaultColors, ...brandColors };

    // Truncate body text to prevent overcrowding — max ~180 chars
    const truncateBody = (text?: string, max = 180) => {
      if (!text) return undefined;
      if (text.length <= max) return text;
      return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
    };

    const base: React.CSSProperties = {
      width: 1080,
      height: 1350,
      boxSizing: "border-box",
      fontFamily: SANS,
      position: "relative",
      overflow: "hidden",
    };

    // Slide number — top right, subtle
    const slideNum = (color: string) => (
      <div
        style={{
          position: "absolute",
          top: 56,
          right: 72,
          fontSize: 13,
          fontWeight: 500,
          color,
          letterSpacing: "0.12em",
          fontFamily: SANS,
          opacity: 0.4,
        }}
      >
        {slide.slideNumber}/{slide.totalSlides}
      </div>
    );

    // Brand watermark — bottom right, very subtle
    const watermark = (color: string) =>
      brandName ? (
        <div
          style={{
            position: "absolute",
            bottom: 52,
            right: 72,
            fontSize: 11,
            fontWeight: 500,
            color,
            opacity: 0.25,
            letterSpacing: "0.08em",
            fontFamily: SANS,
            textTransform: "uppercase" as const,
          }}
        >
          {brandName}
        </div>
      ) : null;

    // Section label — bottom left
    const sectionLabel = (color: string) => (
      <div
        style={{
          position: "absolute",
          bottom: 52,
          left: 96,
          fontSize: 10,
          fontWeight: 600,
          color,
          opacity: 0.35,
          letterSpacing: "0.2em",
          fontFamily: SANS,
          textTransform: "uppercase" as const,
        }}
      >
        {slide.label}
      </div>
    );

    // ─── LAYOUT 1: COVER — Minimal, headline dominant, centered ───
    if (slide.type === "cover") {
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.text }}>
          {slideNum(`${c.bg}60`)}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "120px 96px",
              textAlign: "center",
            }}
          >
            {/* Thin accent line above headline */}
            <div
              style={{
                width: 48,
                height: 2,
                backgroundColor: c.accent,
                marginBottom: 48,
              }}
            />
            <h1
              style={{
                fontFamily: SERIF,
                fontSize: slide.headline.length > 80 ? 48 : 56,
                fontWeight: 700,
                lineHeight: 1.18,
                color: c.bg,
                margin: 0,
                maxWidth: "92%",
                letterSpacing: "-0.01em",
              }}
            >
              {slide.headline}
            </h1>
            {slide.body && (
              <p
                style={{
                  fontSize: 20,
                  lineHeight: 1.65,
                  color: `${c.bg}88`,
                  margin: "40px 0 0",
                  maxWidth: "78%",
                  fontWeight: 400,
                }}
              >
                {truncateBody(slide.body, 120)}
              </p>
            )}
          </div>
          {sectionLabel(c.bg)}
          {watermark(c.bg)}
        </div>
      );
    }

    // ─── LAYOUT 2: STATEMENT — Single strong sentence, centered ───
    if (slide.type === "statement") {
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bg }}>
          {slideNum(`${c.text}50`)}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "120px 96px",
            }}
          >
            {/* Left accent border */}
            <div
              style={{
                position: "absolute",
                left: 72,
                top: "30%",
                bottom: "30%",
                width: 3,
                backgroundColor: c.accent,
                opacity: 0.5,
              }}
            />
            <blockquote
              style={{
                fontFamily: SERIF,
                fontSize: slide.headline.length > 120 ? 36 : 44,
                fontWeight: 500,
                lineHeight: 1.35,
                color: c.text,
                margin: 0,
                paddingLeft: 48,
                fontStyle: "italic",
                maxWidth: "90%",
              }}
            >
              {slide.headline}
            </blockquote>
          </div>
          {sectionLabel(c.text)}
          {watermark(c.text)}
        </div>
      );
    }

    // ─── LAYOUT 3: EDITORIAL — Headline + body, split vertical ───
    if (slide.type === "editorial") {
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bg }}>
          {slideNum(`${c.text}50`)}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "120px 96px",
              gap: 0,
            }}
          >
            <h2
              style={{
                fontFamily: SERIF,
                fontSize: slide.headline.length > 60 ? 36 : 42,
                fontWeight: 600,
                lineHeight: 1.22,
                color: c.text,
                margin: 0,
                maxWidth: "88%",
              }}
            >
              {slide.headline}
            </h2>
            {/* Accent divider */}
            <div
              style={{
                width: 44,
                height: 2,
                backgroundColor: c.accent,
                margin: "36px 0",
                opacity: 0.7,
              }}
            />
            {slide.body && (
              <p
                style={{
                  fontSize: 19,
                  lineHeight: 1.75,
                  color: `${c.text}AA`,
                  margin: 0,
                  maxWidth: "82%",
                  fontWeight: 400,
                }}
              >
                {truncateBody(slide.body)}
              </p>
            )}
          </div>
          {sectionLabel(c.text)}
          {watermark(c.text)}
        </div>
      );
    }

    // ─── LAYOUT 4: STRUCTURED — Headline + numbered items ───
    if (slide.type === "structured") {
      const items = (slide.items || []).slice(0, 4); // Max 4 items
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bg }}>
          {slideNum(`${c.text}50`)}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "120px 96px",
            }}
          >
            <h2
              style={{
                fontFamily: SERIF,
                fontSize: 38,
                fontWeight: 600,
                lineHeight: 1.22,
                color: c.text,
                margin: "0 0 44px",
                maxWidth: "85%",
              }}
            >
              {slide.headline}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 20,
                  }}
                >
                  <span
                    style={{
                      fontFamily: SANS,
                      fontSize: 13,
                      fontWeight: 600,
                      color: c.accent,
                      minWidth: 32,
                      marginTop: 4,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p
                    style={{
                      fontSize: 18,
                      lineHeight: 1.6,
                      color: `${c.text}BB`,
                      margin: 0,
                      maxWidth: "88%",
                    }}
                  >
                    {item.length > 100 ? item.slice(0, 100).replace(/\s+\S*$/, "") + "…" : item}
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

    // ─── LAYOUT 5: MANIFESTO — Dark bg, large italic statement ───
    if (slide.type === "manifesto") {
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.text }}>
          {slideNum(`${c.bg}40`)}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "120px 96px",
              textAlign: "center",
            }}
          >
            {/* Large opening quote mark */}
            <div
              style={{
                fontFamily: SERIF,
                fontSize: 120,
                color: c.accent,
                opacity: 0.3,
                lineHeight: 0.6,
                marginBottom: 24,
              }}
            >
              "
            </div>
            <blockquote
              style={{
                fontFamily: SERIF,
                fontSize: slide.headline.length > 140 ? 34 : 40,
                fontWeight: 500,
                lineHeight: 1.4,
                color: c.bg,
                margin: 0,
                fontStyle: "italic",
                maxWidth: "88%",
              }}
            >
              {slide.headline}
            </blockquote>
            <div
              style={{
                width: 48,
                height: 2,
                backgroundColor: c.accent,
                marginTop: 48,
                opacity: 0.5,
              }}
            />
          </div>
          {sectionLabel(c.bg)}
          {watermark(c.bg)}
        </div>
      );
    }

    // ─── LAYOUT 6: SIGNATURE — Closing slide, centered, calm ───
    if (slide.type === "signature") {
      return (
        <div ref={ref} style={{ ...base, backgroundColor: c.bgAlt }}>
          {slideNum(`${c.text}40`)}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "120px 96px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontFamily: SERIF,
                fontSize: slide.headline.length > 80 ? 36 : 44,
                fontWeight: 600,
                lineHeight: 1.25,
                color: c.text,
                margin: 0,
                maxWidth: "85%",
              }}
            >
              {slide.headline}
            </h2>
            {slide.body && (
              <>
                <div
                  style={{
                    width: 36,
                    height: 2,
                    backgroundColor: c.accent,
                    margin: "40px 0",
                    opacity: 0.6,
                  }}
                />
                <p
                  style={{
                    fontSize: 18,
                    lineHeight: 1.65,
                    color: `${c.text}88`,
                    margin: 0,
                    maxWidth: "72%",
                    fontWeight: 400,
                  }}
                >
                  {truncateBody(slide.body, 120)}
                </p>
              </>
            )}
            {/* Subtle signature mark */}
            <div
              style={{
                marginTop: 56,
                fontSize: 12,
                fontWeight: 600,
                color: c.accent,
                letterSpacing: "0.2em",
                textTransform: "uppercase" as const,
                opacity: 0.6,
              }}
            >
              {brandName || "MEDSHIFT"}
            </div>
          </div>
          {sectionLabel(c.text)}
        </div>
      );
    }

    // Fallback
    return (
      <div ref={ref} style={{ ...base, backgroundColor: c.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "96px" }}>
        <p style={{ fontSize: 20, lineHeight: 1.7, color: c.text, textAlign: "center" }}>{slide.headline}</p>
      </div>
    );
  }
);

SlideRenderer.displayName = "SlideRenderer";

export default SlideRenderer;
