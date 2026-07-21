import OpenAI from "openai";

let client: OpenAI | null = null;

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAIClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY não configurada");
  }
  if (!client) {
    client = new OpenAI({
      apiKey: key,
      timeout: 25_000,
      maxRetries: 1,
    });
  }
  return client;
}

export const NYX_OPENAI_MODEL = "gpt-4o-mini" as const;
