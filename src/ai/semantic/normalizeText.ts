import type { NormalizedText } from "./types";

/** Lowercase, trim, colapsa espaços, remove emojis. */
export function normalizeText(input: string): string {
  const noEmoji = input.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim();
  return noEmoji.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Versão ASCII para matching (sem acentos). */
export function normalizeForMatch(s: string): string {
  return normalizeText(s)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");
}

export function normalizeToken(s: string): string {
  return normalizeForMatch(s).replace(/[^a-z0-9-]/g, "").trim();
}

export function bundleNormalized(original: string): NormalizedText {
  const lower = normalizeText(original);
  return { original, lower, ascii: normalizeForMatch(lower) };
}
