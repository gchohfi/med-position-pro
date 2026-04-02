import React from "react";

interface SimpleMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Lightweight markdown renderer — no extra dependencies required.
 * Handles: ## headings, ### headings, **bold**, *italic*, `code`,
 *          - list items, blank-line paragraph breaks.
 */
const SimpleMarkdown: React.FC<SimpleMarkdownProps> = ({ content, className = "" }) => {
  const renderInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Match **bold**, *italic*, or `code` spans
    const inlineRegex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = inlineRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      if (match[2] !== undefined) {
        parts.push(<strong key={match.index}>{match[2]}</strong>);
      } else if (match[3] !== undefined) {
        parts.push(<em key={match.index}>{match[3]}</em>);
      } else if (match[4] !== undefined) {
        parts.push(
          <code
            key={match.index}
            className="bg-muted px-1 py-0.5 rounded text-sm font-mono"
          >
            {match[4]}
          </code>,
        );
      }
      lastIndex = inlineRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const renderBlocks = (): React.ReactNode[] => {
    const lines = content.split("\n");
    const nodes: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    let key = 0;

    const flushList = () => {
      if (listItems.length > 0) {
        nodes.push(
          <ul key={key++} className="list-disc pl-5 space-y-1 my-2">
            {listItems}
          </ul>,
        );
        listItems = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // H2
      if (/^## /.test(line)) {
        flushList();
        nodes.push(
          <h2 key={key++} className="text-xl font-bold mt-6 mb-2 text-foreground">
            {renderInline(line.slice(3))}
          </h2>,
        );
        continue;
      }

      // H3
      if (/^### /.test(line)) {
        flushList();
        nodes.push(
          <h3 key={key++} className="text-lg font-semibold mt-4 mb-1 text-foreground">
            {renderInline(line.slice(4))}
          </h3>,
        );
        continue;
      }

      // H4
      if (/^#### /.test(line)) {
        flushList();
        nodes.push(
          <h4 key={key++} className="text-base font-semibold mt-3 mb-1 text-foreground">
            {renderInline(line.slice(5))}
          </h4>,
        );
        continue;
      }

      // List item (- or *)
      if (/^[-*] /.test(line)) {
        listItems.push(
          <li key={key++} className="text-sm leading-relaxed">
            {renderInline(line.slice(2))}
          </li>,
        );
        continue;
      }

      // Numbered list item
      if (/^\d+\. /.test(line)) {
        const content = line.replace(/^\d+\. /, "");
        listItems.push(
          <li key={key++} className="text-sm leading-relaxed">
            {renderInline(content)}
          </li>,
        );
        continue;
      }

      // Blank line
      if (line.trim() === "") {
        flushList();
        continue;
      }

      // Regular paragraph line
      flushList();
      nodes.push(
        <p key={key++} className="text-sm leading-relaxed my-1">
          {renderInline(line)}
        </p>,
      );
    }

    flushList();
    return nodes;
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {renderBlocks()}
    </div>
  );
};

export default SimpleMarkdown;
