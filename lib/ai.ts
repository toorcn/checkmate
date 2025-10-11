import { bedrock } from "@ai-sdk/amazon-bedrock";

// Centralized AI model helpers for Bedrock

// Normalize credentials/env for Bedrock
if (process.env.APP_ACCESS_KEY_ID && !process.env.AWS_ACCESS_KEY_ID) {
  process.env.AWS_ACCESS_KEY_ID = process.env.APP_ACCESS_KEY_ID;
}
if (process.env.APP_SECRET_ACCESS_KEY && !process.env.AWS_SECRET_ACCESS_KEY) {
  process.env.AWS_SECRET_ACCESS_KEY = process.env.APP_SECRET_ACCESS_KEY;
}
// Resolve model id without importing global config (avoids pulling in unrelated env validation)
const DEFAULT_MODEL_FALLBACK = "amazon.nova-lite-v1:0";
export const defaultTextModelId = process.env.BEDROCK_MODEL_ID || DEFAULT_MODEL_FALLBACK;

// Factory for the text-generation model used across the app
export function textModel(modelId?: string) {
  const resolvedModelId = modelId || defaultTextModelId;
  return bedrock(resolvedModelId);
}

// Optionally expose the provider for advanced cases
export { bedrock };

// Common generation defaults to keep calls consistent
export const DEFAULT_QUERY_MAX_TOKENS = 100;
export const DEFAULT_QUERY_TEMPERATURE = 0.3;

export const DEFAULT_ANALYSIS_MAX_TOKENS = 2000;
export const DEFAULT_ANALYSIS_TEMPERATURE = 0.1;

export const DEFAULT_CLASSIFY_MAX_TOKENS = 100;
export const DEFAULT_CLASSIFY_TEMPERATURE = 0.1;

export const DEFAULT_SCORE_MAX_TOKENS = 10;
export const DEFAULT_SCORE_TEMPERATURE = 0.1;