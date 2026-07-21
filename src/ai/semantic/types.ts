export type NormalizedText = {
  original: string;
  lower: string;
  ascii: string;
};

export type TemporalExtraction = {
  /** Texto limpo para extração de entidades. */
  remainder: string;
  /** Utilizador indicou data (não só “hoje” implícito). */
  explicit: boolean;
  /** Mês mencionado sem dia (ex.: “em maio”). */
  monthOnly: string | null;
};

export type FinancialIntent = {
  type: "income" | "expense" | "unknown";
};

export type EntityCandidate = {
  text: string;
  normalized: string;
  score: number;
  kind: "brand" | "food" | "place" | "product" | "generic";
};

export type SemanticParseResult = {
  description: string;
  temporal: TemporalExtraction;
};
