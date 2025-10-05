/**
 * AWS Secrets Manager client for Next.js application
 * 
 * This module provides a centralized way to fetch secrets from AWS Secrets Manager
 * with built-in caching, error handling, and fallback to environment variables for local development.
 * 
 * Usage:
 * ```typescript
 * import { getSecret, getSecretString } from '@/lib/secrets';
 * 
 * // Get parsed JSON secret
 * const dbCreds = await getSecret<RDSCredentials>('rds!db-...');
 * 
 * // Get raw string secret
 * const apiKey = await getSecretString('checkmate-dev/api_key');
 * ```
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
  GetSecretValueCommandOutput,
} from "@aws-sdk/client-secrets-manager";
import { getCache, setCache } from "./cache";
import { SECRET_NAMES, RDSCredentials, AuthSecret } from "./types";

/**
 * Map APP_* credentials to AWS_* for SDK compatibility
 * Some environments use APP_ACCESS_KEY_ID instead of AWS_ACCESS_KEY_ID
 */
if (process.env.APP_ACCESS_KEY_ID && !process.env.AWS_ACCESS_KEY_ID) {
  process.env.AWS_ACCESS_KEY_ID = process.env.APP_ACCESS_KEY_ID;
}
if (process.env.APP_SECRET_ACCESS_KEY && !process.env.AWS_SECRET_ACCESS_KEY) {
  process.env.AWS_SECRET_ACCESS_KEY = process.env.APP_SECRET_ACCESS_KEY;
}

/**
 * Determine if we should use Secrets Manager based on environment
 */
function shouldUseSecretsManager(): boolean {
  const explicitFlag = process.env.USE_SECRETS_MANAGER;
  
  // If explicitly set, honor it
  if (explicitFlag !== undefined) {
    return explicitFlag === "true";
  }
  
  // Default: use Secrets Manager in production, not in development
  return process.env.NODE_ENV === "production";
}

/**
 * Initialize Secrets Manager client
 * Uses default AWS credential chain (env vars, AWS CLI profile, IAM role, etc.)
 */
let secretsClient: SecretsManagerClient | null = null;

function getSecretsClient(): SecretsManagerClient {
  if (!secretsClient) {
    const region = process.env.APP_REGION || process.env.AWS_REGION || "us-east-1";
    
    secretsClient = new SecretsManagerClient({
      region,
      // AWS SDK will automatically use:
      // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
      // 2. AWS CLI profile (~/.aws/credentials)
      // 3. IAM role (in production - Amplify, ECS, Lambda)
    });
  }
  
  return secretsClient;
}

/**
 * Fetch a secret from AWS Secrets Manager with caching
 * @param secretName - Name or ARN of the secret
 * @returns Parsed JSON secret value
 * @throws Error if secret cannot be retrieved
 */
export async function getSecret<T = unknown>(secretName: string): Promise<T> {
  // Check if we should use Secrets Manager
  if (!shouldUseSecretsManager()) {
    return getFallbackFromEnv<T>(secretName);
  }

  // Check cache first
  const cached = getCache<T>(secretName);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const client = getSecretsClient();
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response: GetSecretValueCommandOutput = await client.send(command);

    if (!response.SecretString) {
      throw new Error(`Secret ${secretName} does not contain a string value`);
    }

    // Parse JSON secret
    const secretValue = JSON.parse(response.SecretString) as T;

    // Cache the secret for 5 minutes
    setCache(secretName, secretValue);

    return secretValue;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Secrets Manager] Failed to retrieve secret ${secretName}:`, errorMessage);
    throw new Error(`Failed to retrieve secret ${secretName}: ${errorMessage}`);
  }
}

/**
 * Fetch a secret as a raw string (for non-JSON secrets)
 * @param secretName - Name or ARN of the secret
 * @returns Raw secret string value
 * @throws Error if secret cannot be retrieved
 */
export async function getSecretString(secretName: string): Promise<string> {
  // Check if we should use Secrets Manager
  if (!shouldUseSecretsManager()) {
    const fallback = getFallbackFromEnv<string>(secretName);
    return typeof fallback === 'string' ? fallback : String(fallback);
  }

  // Check cache first
  const cached = getCache<string>(secretName);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const client = getSecretsClient();
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response: GetSecretValueCommandOutput = await client.send(command);

    if (!response.SecretString) {
      throw new Error(`Secret ${secretName} does not contain a string value`);
    }

    // Cache the secret for 5 minutes
    setCache(secretName, response.SecretString);

    return response.SecretString;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Secrets Manager] Failed to retrieve secret ${secretName}:`, errorMessage);
    throw new Error(`Failed to retrieve secret ${secretName}: ${errorMessage}`);
  }
}

/**
 * Fallback to environment variables for local development
 * Maps secret names to corresponding environment variables
 * @param secretName - Name of the secret
 * @returns Secret value from environment variables
 */
function getFallbackFromEnv<T>(secretName: string): T {
  // Map secret names to environment variable names
  const envMapping: Record<string, string | (() => T)> = {
    // RDS credentials - construct from DATABASE_URL or components
    [SECRET_NAMES.RDS_CREDENTIALS]: () => {
      if (process.env.DATABASE_URL) {
        // Parse DATABASE_URL to extract credentials
        try {
          const url = new URL(process.env.DATABASE_URL);
          return {
            username: url.username || "postgres",
            password: decodeURIComponent(url.password || ""),
            host: url.hostname,
            port: parseInt(url.port) || 5432,
            dbname: url.pathname.slice(1), // Remove leading '/'
          } as T;
        } catch {
          return {
            username: process.env.DB_USER || "postgres",
            password: process.env.DB_PASSWORD || "",
            host: process.env.DB_HOST || "localhost",
            port: parseInt(process.env.DB_PORT || "5432"),
            dbname: process.env.DB_NAME || "checkmate",
          } as T;
        }
      }
      
      // Fallback to component-based
      const username = process.env.DB_USER || "postgres";
      const password = process.env.DB_PASSWORD || "";
      
      if (!username || !password) {
        throw new Error(
          "Database credentials not found. Set DATABASE_URL or DB_USER/DB_PASSWORD in .env.local, " +
          "or enable USE_SECRETS_MANAGER=true to fetch from AWS Secrets Manager"
        );
      }
      
      return {
        username,
        password,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
        dbname: process.env.DB_NAME,
      } as T;
    },

    // Auth secret
    [SECRET_NAMES.AUTH_SECRET]: () => ({
      secret: process.env.AUTH_SECRET || "dev-insecure-secret-change",
      adminEmail: process.env.ADMIN_EMAIL,
      adminPassword: process.env.ADMIN_PASSWORD,
    } as T),

    // Firecrawl API key (string value)
    [SECRET_NAMES.FIRECRAWL_API_KEY]: process.env.FIRECRAWL_API_KEY || "",

    // Exa API key (string value)
    [SECRET_NAMES.EXA_API_KEY]: process.env.EXA_API_KEY || "",

    // Redis password
    [SECRET_NAMES.REDIS_PASSWORD]: () => ({
      password: process.env.REDIS_PASSWORD,
      url: process.env.REDIS_URL,
    } as T),
  };

  const mapped = envMapping[secretName];

  if (mapped === undefined) {
    throw new Error(
      `No environment variable mapping found for secret: ${secretName}. ` +
      `Add mapping in getFallbackFromEnv() or set USE_SECRETS_MANAGER=true`
    );
  }

  // If it's a function, call it to get the value
  if (typeof mapped === "function") {
    return mapped();
  }

  // Return the string value as-is
  return mapped as T;
}

/**
 * Helper: Get RDS database credentials
 */
export async function getRDSCredentials(): Promise<RDSCredentials> {
  return getSecret<RDSCredentials>(SECRET_NAMES.RDS_CREDENTIALS);
}

/**
 * Helper: Get auth secret
 */
export async function getAuthSecret(): Promise<AuthSecret> {
  const result = await getSecret<any>(SECRET_NAMES.AUTH_SECRET);
  
  // Handle different secret formats:
  // 1. AWS Secrets Manager Key/Value: {"AUTH_SECRET": "value"}
  // 2. Standard format: {"secret": "value"}
  // 3. Direct string (shouldn't happen but handle it)
  
  if (typeof result === 'string') {
    return { secret: result };
  }
  
  // AWS Secrets Manager Key/Value format
  if (result.AUTH_SECRET) {
    return {
      secret: result.AUTH_SECRET,
      adminEmail: result.ADMIN_EMAIL,
      adminPassword: result.ADMIN_PASSWORD,
    };
  }
  
  // Standard format
  return result as AuthSecret;
}

/**
 * Helper: Get Firecrawl API key
 */
export async function getFirecrawlApiKey(): Promise<string> {
  const result = await getSecretString(SECRET_NAMES.FIRECRAWL_API_KEY);
  // Handle different secret formats:
  // 1. AWS Secrets Manager Key/Value: {"FIRECRAWL_API_KEY": "value"}
  // 2. Plain text: "value"
  // 3. JSON with standard fields: {"key": "value"} or {"apiKey": "value"}
  try {
    const parsed = JSON.parse(result);
    // AWS Secrets Manager Key/Value format
    if (parsed.FIRECRAWL_API_KEY) return parsed.FIRECRAWL_API_KEY;
    // Standard JSON formats
    return parsed.key || parsed.apiKey || parsed.firecrawl || result;
  } catch {
    // Plain text format
    return result;
  }
}

/**
 * Helper: Get Exa API key
 */
export async function getExaApiKey(): Promise<string> {
  const result = await getSecretString(SECRET_NAMES.EXA_API_KEY);
  // Handle different secret formats:
  // 1. AWS Secrets Manager Key/Value: {"EXA_API_KEY": "value"}
  // 2. Plain text: "value"
  // 3. JSON with standard fields: {"key": "value"} or {"apiKey": "value"}
  try {
    const parsed = JSON.parse(result);
    // AWS Secrets Manager Key/Value format
    if (parsed.EXA_API_KEY) return parsed.EXA_API_KEY;
    // Standard JSON formats
    return parsed.key || parsed.apiKey || parsed.exa || result;
  } catch {
    // Plain text format
    return result;
  }
}

/**
 * Helper: Get Redis password
 */
export async function getRedisPassword(): Promise<string | undefined> {
  try {
    const secret = await getSecret<{ password?: string }>(SECRET_NAMES.REDIS_PASSWORD);
    return secret.password;
  } catch {
    // Redis is optional, return undefined if not configured
    return undefined;
  }
}

// Export cache utilities for manual cache management if needed
export { clearCache, clearAllCache, getCacheStats } from "./cache";
export { SECRET_NAMES } from "./types";

