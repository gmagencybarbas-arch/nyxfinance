import { bundleNormalized } from "./normalizeText";
import { extractTemporalContext } from "./temporalExtraction";
import { extractFinancialIntent } from "./financialIntent";
import { extractEntities, formatEntityLabel } from "./entityExtraction";
import { pickBestEntity } from "./semanticRanking";
import type { SemanticParseResult } from "./types";

/**
 * Pipeline semântico determinístico:
 * normalize → temporal → intent → entities → rank → título final.
 */
export function runSemanticDescriptionPipeline(
  raw: string,
  transactionType: "income" | "expense"
): SemanticParseResult {
  const norm = bundleNormalized(raw);
  const temporal = extractTemporalContext(norm.original, norm.lower);
  extractFinancialIntent(norm.ascii);

  const entities = extractEntities(temporal.remainder, transactionType);
  const best = pickBestEntity(entities);

  const description = best ? formatEntityLabel(best) : "Transação";

  return { description, temporal };
}

/** API legada usada pelo transactionParser. */
export function extractSemanticDescription(
  raw: string,
  normalized: string,
  transactionType: "income" | "expense"
): string {
  return runSemanticDescriptionPipeline(raw, transactionType).description;
}
