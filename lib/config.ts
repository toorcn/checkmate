import { z } from "zod";

// Environment configuration schema
const baseSchema = z
  .object({
    // API Keys (optional - can be fetched from Secrets Manager)
    FIRECRAWL_API_KEY: z.string().optional(),
    EXA_API_KEY: z.string().optional(),
    // AWS / Bedrock
    APP_REGION: z.string().optional(),
    AWS_REGION: z.string().optional(),
    // Some platforms only allow lowercase keys; support `aws_region` as a source
    aws_region: z.string().optional(),
    // BEDROCK_MODEL_ID: z
    //   .string()
    //   .default("anthropic.claude-3-haiku-20240307-v1:0"),
    // DynamoDB (optional during migration)
    DDB_TABLE_ANALYSES: z.string().optional(),
    DDB_TABLE_CREATORS: z.string().optional(),
    DDB_TABLE_USERS: z.string().optional(),
    DDB_TABLE_COMMENTS: z.string().optional(),
    // Local auth

    // Convex (removed)
    // CONVEX_DEPLOYMENT: z.string().min(1, "Convex deployment is required"),
    // NEXT_PUBLIC_CONVEX_URL: z.string().url("Invalid Convex URL"),

    // App Configuration
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    VERCEL_URL: z.string().optional(),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

    // Timeouts (in milliseconds)
    TRANSCRIPTION_TIMEOUT_MS: z.coerce.number().default(60000), // 1 minute
    FACT_CHECK_TIMEOUT_MS: z.coerce.number().default(120000), // 2 minutes
    WEB_SCRAPE_TIMEOUT_MS: z.coerce.number().default(30000), // 30 seconds

    // Feature Flags
    ENABLE_DETAILED_LOGGING: z.coerce.boolean().default(false),
    ENABLE_CACHE: z.coerce.boolean().default(true),
    ENABLE_MONITORING: z.coerce.boolean().default(true),

    // Storage / Media
    S3_BUCKET: z
      .string()
      .min(1, "S3 bucket (S3_BUCKET) is required for transcription media"),
  })
  .superRefine((obj, ctx) => {
    if (!obj.APP_REGION && !obj.AWS_REGION && !obj.aws_region) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["APP_REGION"],
        message: "APP_REGION or AWS_REGION (or aws_region) is required",
      });
    }
  });

const configSchema = baseSchema.transform((obj) => {
  const resolvedRegion = obj.APP_REGION || obj.AWS_REGION || obj.aws_region;
  return {
    ...obj,
    // Normalize to APP_REGION for downstream consumers
    APP_REGION: resolvedRegion,
  } as typeof obj & { APP_REGION: string };
});

// Parse and validate environment variables
function validateConfig() {
  try {
    return configSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );
      throw new Error(
        `Invalid environment configuration:\n${missingVars.join("\n")}`
      );
    }
    throw error;
  }
}

export const config = validateConfig();
// Ensure AWS SDK/B edrock can discover region even if only lowercase `aws_region` was provided
if (!process.env.AWS_REGION && config.APP_REGION) {
  process.env.AWS_REGION = config.APP_REGION;
}
export type Config = z.infer<typeof configSchema>;

// Helper functions
export const isDevelopment = config.NODE_ENV === "development";
export const isProduction = config.NODE_ENV === "production";
export const isTest = config.NODE_ENV === "test";
