"use client";

import { useMemo } from "react";

export type TextSegment = { text: string; bold: boolean };

/** Converte `**texto**` em segmentos para negrito real na UI. */
export function parseNyxBoldSegments(text: string): TextSegment[] {
  const out: TextSegment[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      out.push({ text: text.slice(last, match.index), bold: false });
    }
    out.push({ text: match[1]!, bold: true });
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    out.push({ text: text.slice(last), bold: false });
  }

  return out.length > 0 ? out : [{ text, bold: false }];
}

interface NyxRichTextProps {
  text: string;
  className?: string;
}

export function NyxRichText({ text, className = "" }: NyxRichTextProps) {
  const segments = useMemo(() => parseNyxBoldSegments(text), [text]);

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.bold ? (
          <strong key={i} className="font-semibold text-[var(--foreground)]">
            {seg.text}
          </strong>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </span>
  );
}
