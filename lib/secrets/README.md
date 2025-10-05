# Secrets Manager Module

This module provides a centralized, secure way to manage application secrets using AWS Secrets Manager with support for local development fallbacks.

## Features

- ✅ **AWS Secrets Manager Integration**: Fetch secrets from AWS Secrets Manager in production
- ✅ **Local Development Support**: Automatic fallback to `.env.local` variables
- ✅ **Caching**: In-memory caching with TTL to reduce API calls (5-minute default)
- ✅ **Type Safety**: Full TypeScript support with typed secret interfaces
- ✅ **Error Handling**: Comprehensive error handling with helpful messages
- ✅ **Flexible Authentication**: Works with IAM roles (production) or AWS credentials (local)

## Environment Detection

The module automatically determines whether to use Secrets Manager or environment variables:

```typescript
// Uses Secrets Manager if:
// 1. USE_SECRETS_MANAGER=true (explicit)
// 2. NODE_ENV=production (default behavior)

// Uses .env.local if:
// 1. USE_SECRETS_MANAGER=false (explicit)
// 2. NODE_ENV=development (default behavior)
```

## Usage

### Basic Usage

```typescript
import { getSecret, getSecretString } from '@/lib/secrets';
import { RDSCredentials } from '@/lib/secrets/types';

// Get parsed JSON secret
const dbCreds = await getSecret<RDSCredentials>('rds!db-...');
console.log(dbCreds.username, dbCreds.password);

// Get raw string secret
const apiKey = await getSecretString('checkmate-dev/api_key');
```

### Helper Functions

Use convenience helpers for common secrets:

```typescript
import {
  getRDSCredentials,
  getAuthSecret,
  getFirecrawlApiKey,
  getExaApiKey,
  getRedisPassword,
} from '@/lib/secrets';

// Get database credentials
const { username, password } = await getRDSCredentials();

// Get auth secret
const { secret } = await getAuthSecret();

// Get API keys
const firecrawlKey = await getFirecrawlApiKey();
const exaKey = await getExaApiKey();

// Get Redis password (optional)
const redisPassword = await getRedisPassword();
```

### Building Database Connection String

```typescript
import { getRDSCredentials } from '@/lib/secrets';

async function buildDatabaseUrl(): Promise<string> {
  const { username, password } = await getRDSCredentials();
  
  const host = process.env.DB_HOST!;
  const port = process.env.DB_PORT || '5432';
  const dbname = process.env.DB_NAME || 'checkmate';
  
  return `postgres://${username}:${encodeURIComponent(password)}@${host}:${port}/${dbname}?sslmode=require`;
}
```

## Secret Names

Pre-defined secret names are available in `SECRET_NAMES`:

```typescript
import { SECRET_NAMES } from '@/lib/secrets';

SECRET_NAMES.RDS_CREDENTIALS // "rds!db-663b916d-667d-420b-930f-bbdbf25c9eb8"
SECRET_NAMES.AUTH_SECRET     // "checkmate-dev/auth_secret"
SECRET_NAMES.FIRECRAWL_API_KEY // "checkmate-dev/firecrawl_api_key"
SECRET_NAMES.EXA_API_KEY     // "checkmate-dev/exa_api_key"
SECRET_NAMES.REDIS_PASSWORD  // "checkmate-dev/redis_password"
```

## Cache Management

The module includes built-in caching to improve performance:

```typescript
import { clearCache, clearAllCache, getCacheStats } from '@/lib/secrets';

// Clear a specific secret from cache
clearCache('checkmate-dev/api_key');

// Clear all cached secrets
clearAllCache();

// Get cache statistics
const stats = getCacheStats();
console.log(`Cache size: ${stats.size}, Keys: ${stats.keys.join(', ')}`);
```

**Cache TTL**: Secrets are cached for 5 minutes by default to balance between performance and freshness.

## Environment Variable Fallbacks

When `USE_SECRETS_MANAGER=false` (local development), the module falls back to environment variables:

| Secret | Environment Variables |
|--------|-----------------------|
| RDS Credentials | `DATABASE_URL` or `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME` |
| Auth Secret | `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` |
| Firecrawl API Key | `FIRECRAWL_API_KEY` |
| Exa API Key | `EXA_API_KEY` |
| Redis Password | `REDIS_PASSWORD`, `REDIS_URL` |

## Production Setup

### 1. Set Environment Variables in Amplify

```bash
USE_SECRETS_MANAGER=true
NODE_ENV=production
DB_HOST=checkmate-db-instance.c2f2oys8o2re.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=checkmate
APP_REGION=us-east-1
```

### 2. Attach IAM Role with Secrets Manager Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:*:secret:checkmate-dev/*",
        "arn:aws:secretsmanager:us-east-1:*:secret:rds!db-663b916d-667d-420b-930f*"
      ]
    }
  ]
}
```

## Local Development Setup

### Option A: Use .env.local (Simpler)

```bash
# .env.local
USE_SECRETS_MANAGER=false
NODE_ENV=development

# Database
DATABASE_URL=postgres://username:password@localhost:5432/checkmate
# OR
DB_HOST=localhost
DB_PORT=5432
DB_NAME=checkmate
DB_USER=postgres
DB_PASSWORD=yourpassword

# Auth
AUTH_SECRET=your-local-auth-secret

# API Keys
FIRECRAWL_API_KEY=your-firecrawl-key
EXA_API_KEY=your-exa-key

# AWS Credentials (for S3, Transcribe, Bedrock)
AWS_ACCESS_KEY_ID=your-dev-key
AWS_SECRET_ACCESS_KEY=your-dev-secret
APP_REGION=us-east-1
```

### Option B: Use AWS Secrets Manager Locally (Advanced)

```bash
# .env.local
USE_SECRETS_MANAGER=true
NODE_ENV=development

# Database connection details
DB_HOST=checkmate-db-instance.c2f2oys8o2re.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=checkmate

# AWS Credentials (to access Secrets Manager)
AWS_ACCESS_KEY_ID=your-dev-key
AWS_SECRET_ACCESS_KEY=your-dev-secret
APP_REGION=us-east-1
```

### Option C: Use AWS CLI Profile (Recommended)

```bash
# ~/.aws/credentials
[default]
aws_access_key_id = YOUR_DEV_KEY
aws_secret_access_key = YOUR_DEV_SECRET

# ~/.aws/config
[default]
region = us-east-1
```

Then in `.env.local`:
```bash
USE_SECRETS_MANAGER=false  # or true to test Secrets Manager locally
DB_HOST=localhost
DB_PORT=5432
DB_NAME=checkmate
```

## Error Handling

```typescript
import { getSecret } from '@/lib/secrets';

try {
  const secret = await getSecret('my-secret');
  // Use secret
} catch (error) {
  console.error('Failed to retrieve secret:', error);
  // Handle error (use defaults, throw, etc.)
}
```

## Best Practices

1. **Always use helper functions** when available for type safety
2. **Cache secrets** - the module does this automatically
3. **Don't log secrets** - be careful with console.log in production
4. **Use IAM roles in production** - never hardcode credentials
5. **Test locally with USE_SECRETS_MANAGER=true** before deploying
6. **Rotate secrets regularly** using AWS Secrets Manager rotation

## Architecture

```
lib/secrets/
├── index.ts       # Main module with getSecret() and helpers
├── types.ts       # TypeScript interfaces for secrets
├── cache.ts       # In-memory caching implementation
└── README.md      # This file
```

## Cost Optimization

The built-in caching reduces Secrets Manager API calls by ~90%+:

- **Without cache**: 1000 requests/minute = ~$0.50/month
- **With cache (5min TTL)**: ~50 requests/minute = ~$0.05/month

## Troubleshooting

### "Failed to retrieve secret: AccessDenied"

**Cause**: IAM role doesn't have Secrets Manager permissions.

**Solution**: Add the required IAM policy to your Amplify/ECS role.

### "No environment variable mapping found"

**Cause**: `USE_SECRETS_MANAGER=false` but required env vars are missing.

**Solution**: Add the required variables to `.env.local`.

### "Could not load credentials from any providers"

**Cause**: AWS credentials not configured for local development.

**Solution**: Set AWS credentials in `.env.local` or use AWS CLI profile.

## Migration Guide

See `SECRETS_MANAGER_MIGRATION_PLAN.md` for the full migration guide from environment variables to Secrets Manager.

