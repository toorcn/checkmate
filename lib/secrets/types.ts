/**
 * Type definitions for AWS Secrets Manager secrets
 */

/**
 * RDS database credentials from auto-generated RDS secret
 */
export interface RDSCredentials {
  username: string;
  password: string;
  engine?: string;
  host?: string;
  port?: number;
  dbname?: string;
}

/**
 * Authentication secret for JWT signing
 */
export interface AuthSecret {
  secret: string;
  adminEmail?: string;
  adminPassword?: string;
}

/**
 * API keys for third-party services
 */
export interface APIKeys {
  firecrawl: string;
  exa: string;
}

/**
 * Redis password (optional, for when Redis is configured)
 */
export interface RedisSecret {
  password?: string;
  url?: string;
}

/**
 * All application secrets structure
 */
export interface AppSecrets {
  database?: RDSCredentials;
  auth?: AuthSecret;
  apiKeys?: APIKeys;
  redis?: RedisSecret;
}

/**
 * Secret names mapping
 */
export const SECRET_NAMES = {
  RDS_CREDENTIALS: "rds!db-663b916d-667d-420b-930f-bbdbf25c9eb8",
  AUTH_SECRET: "checkmate-dev/auth_secret",
  FIRECRAWL_API_KEY: "checkmate-dev/firecrawl_api_key",
  EXA_API_KEY: "checkmate-dev/exa_api_key",
  REDIS_PASSWORD: "checkmate-dev/redis_password",
} as const;

/**
 * Secret cache entry with TTL
 */
export interface CachedSecret<T = unknown> {
  value: T;
  expiresAt: number;
}

