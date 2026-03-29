import React from "react";

export interface SlideData {
  type: "hook" | "quebra" | "explicacao" | "metodo" | "manifesto" | "fechamento";
  label: string;
  content: string;
  slideNumber: number;
  totalSlides: number;
}

interface SlideRendererProps {
  slide: SlideData;
  brandColors?: {
    bg: string;
    text: string;
    accent: string;
  };
  brandName?: string;
}

const defaultColors = {
  bg: "#F8F6F2",
  text: "#2B2B2B",
  accent: "#C6A97A",
};

/**
 * Renders a single carousel slide as a styled HTML div.
 * Dimensions: 1080×1350 (4:5 ratio for Instagram).
 * Rendered at 540×675 in preview, scaled 2× for export.
 */
const SlideRenderer = React.forwardRef<HTMLDivElement, SlideRendererProps>(
  ({ slide, brandColors, brandName }, ref) => {
    const colors = { ...defaultColors, ...brandColors };

    // Split content into paragraphs for structured slides
    const paragraphs = slide.content
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    const baseStyle: React.CSSProperties = {
      width: 1080,
      height: 1350,
      backgroundColor: colors.bg,
      color: colors.text,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "flex-start",
      padding: "100px 90px",
      boxSizing: "border-box",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      position: "relative",
      overflow: "hidden",
    };

    const accentBar: React.CSSProperties = {
      position: "absolute",
      top: 0,
      left: 0,
      width: 6,
      height: "100%",
      backgroundColor: colors.accent,
    };

    const slideNumberStyle: React.CSSProperties = {
      position: "absolute",
      top: 48,
      right: 64,
      fontSize: 14,
      fontWeight: 500,
      color: colors.accent,
      letterSpacing: "0.08em",
      fontFamily: "'Inter', sans-serif",
    };

    const footerStyle: React.CSSProperties = {
      position: "absolute",
      bottom: 48,
      left: 90,
      right: 90,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    };

    const labelStyle: React.CSSProperties = {
      fontSize: 12,
      fontWeight: 600,
      textTransform: "uppercase" as const,
      letterSpacing: "0.15em",
      color: colors.accent,
      fontFamily: "'Inter', sans-serif",
    };

    const brandStyle: React.CSSProperties = {
      fontSize: 13,
      fontWeight: 500,
      color: `${colors.text}44`,
      fontFamily: "'Inter', sans-serif",
      letterSpacing: "0.05em",
    };

    // Divider line
    const divider = (
      <div
        style={{
          width: 60,
          height: 2,
          backgroundColor: colors.accent,
          margin: "32px 0",
          opacity: 0.6,
        }}
      />
    );

    const renderContent = () => {
      switch (slide.type) {
        case "hook":
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <h1
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 64,
                  fontWeight: 700,
                  lineHeight: 1.15,
                  margin: 0,
                  color: colors.text,
                  maxWidth: "95%",
                }}
              >
                {paragraphs[0] || slide.content}
              </h1>
              {paragraphs.length > 1 && (
                <>
                  {divider}
                  <p
                    style={{
                      fontSize: 22,
                      lineHeight: 1.6,
                      color: `${colors.text}99`,
                      margin: 0,
                      maxWidth: "85%",
                    }}
                  >
                    {paragraphs.slice(1).join(" ")}
                  </p>
                </>
              )}
            </div>
          );

        case "quebra":
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <h2
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 48,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  margin: 0,
                  color: colors.text,
                  fontStyle: "italic",
                }}
              >
                {paragraphs[0] || slide.content}
              </h2>
              {paragraphs.length > 1 && (
                <>
                  {divider}
                  <p
                    style={{
                      fontSize: 20,
                      lineHeight: 1.7,
                      color: `${colors.text}88`,
                      margin: 0,
                    }}
                  >
                    {paragraphs.slice(1).join("\n\n")}
                  </p>
                </>
              )}
            </div>
          );

        case "explicacao":
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <h3
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 36,
                  fontWeight: 600,
                  lineHeight: 1.25,
                  margin: 0,
                  color: colors.text,
                }}
              >
                {paragraphs[0] || ""}
              </h3>
              {divider}
              {paragraphs.slice(1).map((p, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 19,
                    lineHeight: 1.7,
                    color: `${colors.text}BB`,
                    margin: 0,
                  }}
                >
                  {p}
                </p>
              ))}
            </div>
          );

        case "metodo":
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 40,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  margin: 0,
                  marginBottom: 8,
                  color: colors.text,
                }}
              >
                {paragraphs[0] || ""}
              </h3>
              {divider}
              {paragraphs.slice(1).map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: colors.accent,
                      fontFamily: "'Inter', sans-serif",
                      minWidth: 28,
                      marginTop: 2,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p
                    style={{
                      fontSize: 18,
                      lineHeight: 1.65,
                      color: `${colors.text}CC`,
                      margin: 0,
                    }}
                  >
                    {p}
                  </p>
                </div>
              ))}
            </div>
          );

        case "manifesto":
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 24,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 3,
                  backgroundColor: colors.accent,
                }}
              />
              <blockquote
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 42,
                  fontWeight: 500,
                  lineHeight: 1.35,
                  margin: 0,
                  color: colors.text,
                  fontStyle: "italic",
                  borderLeft: `4px solid ${colors.accent}`,
                  paddingLeft: 32,
                }}
              >
                {slide.content}
              </blockquote>
            </div>
          );

        case "fechamento":
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                width: "100%",
                gap: 32,
              }}
            >
              <h2
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 44,
                  fontWeight: 700,
                  lineHeight: 1.25,
                  margin: 0,
                  color: colors.text,
                  maxWidth: "90%",
                }}
              >
                {paragraphs[0] || slide.content}
              </h2>
              {paragraphs.length > 1 && (
                <>
                  <div
                    style={{
                      width: 60,
                      height: 2,
                      backgroundColor: colors.accent,
                    }}
                  />
                  <p
                    style={{
                      fontSize: 20,
                      lineHeight: 1.6,
                      color: `${colors.text}88`,
                      margin: 0,
                      maxWidth: "80%",
                    }}
                  >
                    {paragraphs.slice(1).join(" ")}
                  </p>
                </>
              )}
              <div
                style={{
                  marginTop: 16,
                  padding: "14px 40px",
                  border: `2px solid ${colors.accent}`,
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  color: colors.accent,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.1em",
                }}
              >
                Saiba mais
              </div>
            </div>
          );

        default:
          return (
            <p style={{ fontSize: 20, lineHeight: 1.7 }}>{slide.content}</p>
          );
      }
    };

    return (
      <div ref={ref} style={baseStyle}>
        <div style={accentBar} />
        <div style={slideNumberStyle}>
          {slide.slideNumber}/{slide.totalSlides}
        </div>
        {renderContent()}
        <div style={footerStyle}>
          <span style={labelStyle}>{slide.label}</span>
          {brandName && <span style={brandStyle}>{brandName}</span>}
        </div>
      </div>
    );
  }
);

SlideRenderer.displayName = "SlideRenderer";

export default SlideRenderer;
