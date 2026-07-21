import type { EntityCandidate } from "./types";

/** Escolhe a melhor entidade; desempata por score e tipo. */
function dedupeByNormalized(candidates: EntityCandidate[]): EntityCandidate[] {
  const map = new Map<string, EntityCandidate>();
  for (const c of candidates) {
    const prev = map.get(c.normalized);
    if (!prev || c.score > prev.score) map.set(c.normalized, c);
  }
  return [...map.values()];
}

export function pickBestEntity(candidates: EntityCandidate[]): EntityCandidate | null {
  if (candidates.length === 0) return null;
  const unique = dedupeByNormalized(candidates);

  const kindWeight: Record<EntityCandidate["kind"], number> = {
    brand: 4,
    food: 3,
    place: 3,
    product: 2,
    generic: 1,
  };

  const sorted = [...unique].sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;
    return kindWeight[b.kind] - kindWeight[a.kind];
  });

  const best = sorted[0]!;
  if (best.score < 50 && best.kind === "generic") {
    const better = sorted.find((c) => c.score >= 70);
    return better ?? best;
  }

  return best;
}
