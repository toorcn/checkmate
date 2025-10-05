# Database Module

This module provides database connectivity using PostgreSQL with Drizzle ORM, integrated with AWS Secrets Manager for secure credential management.

## Features

- ✅ **Hybrid Credentials**: Username/password from Secrets Manager, connection details from env vars
- ✅ **Async Initialization**: Database connection initializes on module load
- ✅ **Backward Compatible**: Existing code continues to work without changes
- ✅ **Type Safe**: Full TypeScript support with Drizzle ORM
- ✅ **Auto SSL**: Enforces SSL connections for security

## Configuration

### Production Setup

```bash
# Amplify Environment Variables
USE_SECRETS_MANAGER=true
DB_HOST=checkmate-db-instance.c2f2oys8o2re.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=checkmate
APP_REGION=us-east-1
```

Credentials (`username`, `password`) are automatically fetched from AWS Secrets Manager:
- Secret: `rds!db-663b916d-667d-420b-930f-bbdbf25c9eb8`

### Local Development

**Option A: Full Connection String** (Easiest)
```bash
# .env.local
USE_SECRETS_MANAGER=false
DATABASE_URL=postgres://username:password@localhost:5432/checkmate?sslmode=require
```

**Option B: Component-Based**
```bash
# .env.local
USE_SECRETS_MANAGER=false
DB_HOST=localhost
DB_PORT=5432
DB_NAME=checkmate
DB_USER=postgres
DB_PASSWORD=yourpassword
```

**Option C: Test with Secrets Manager Locally**
```bash
# .env.local
USE_SECRETS_MANAGER=true
DB_HOST=checkmate-db-instance...
DB_PORT=5432
DB_NAME=checkmate

# AWS credentials (to access Secrets Manager)
AWS_ACCESS_KEY_ID=your-dev-key
AWS_SECRET_ACCESS_KEY=your-dev-secret
APP_REGION=us-east-1
```

## Usage

### Basic Usage (Recommended)

The database client and ORM instance are automatically initialized. Just import and use:

```typescript
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

// API route example
export async function GET(req: NextRequest) {
  // Database is ready, just use it
  const allUsers = await db.select().from(users).limit(10);
  
  return NextResponse.json(allUsers);
}
```

### Async-Safe Usage

For better control, especially in edge cases where you want to ensure the database is fully initialized:

```typescript
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  // Explicitly wait for database initialization
  const database = await getDb();
  
  const allUsers = await database.select().from(users).limit(10);
  
  return NextResponse.json(allUsers);
}
```

### Direct Client Access

If you need the underlying Postgres client:

```typescript
import { getClient } from '@/lib/db';

export async function POST(req: NextRequest) {
  const client = await getClient();
  
  // Use postgres client directly
  const result = await client`SELECT NOW()`;
  
  return NextResponse.json(result);
}
```

## Migration with Drizzle Kit

### Running Migrations

Drizzle Kit works with both approaches:

**With DATABASE_URL:**
```bash
# .env.local
DATABASE_URL=postgres://user:pass@host:5432/dbname

# Run migrations
npx drizzle-kit push
npx drizzle-kit migrate
```

**With Component Variables:**
```bash
# .env.local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=checkmate
DB_USER=postgres
DB_PASSWORD=yourpassword

# Run migrations
npx drizzle-kit push
npx drizzle-kit migrate
```

### Generating Migrations

```bash
# Generate new migration from schema changes
npx drizzle-kit generate

# Apply migrations to database
npx drizzle-kit migrate

# Open Drizzle Studio
npx drizzle-kit studio
```

## Architecture

```
lib/db/
├── index.ts       # Main database client (this file)
├── schema.ts      # Drizzle schema definitions
├── repo.ts        # Data access layer
└── README.md      # This file
```

### How It Works

1. **On Import**: Module immediately starts async initialization
2. **Fetch Credentials**: Gets username/password from Secrets Manager (or env fallback)
3. **Build Connection**: Constructs connection string with credentials + env config
4. **Initialize Client**: Creates Postgres client with SSL
5. **Create ORM**: Wraps client with Drizzle ORM
6. **Export Proxies**: Exports db/client via Proxy for seamless usage

### Proxy Pattern

The exported `db` and `client` use JavaScript Proxies to ensure they're only accessed after initialization:

```typescript
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    if (!dbInstance) {
      throw new Error("Database not yet initialized");
    }
    return (dbInstance as any)[prop];
  },
});
```

This allows existing code to work without changes while maintaining type safety.

## Example Repository Pattern

```typescript
// lib/db/repo.ts
import { db } from './index';
import { users, sessions } from './schema';
import { eq } from 'drizzle-orm';

export async function getUserById(userId: string) {
  const results = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  return results[0] || null;
}

export async function createUser(data: {
  id: string;
  email: string;
  username?: string;
}) {
  await db.insert(users).values({
    id: data.id,
    email: data.email,
    username: data.username ?? null,
    createdAt: new Date(),
  });
}
```

## Troubleshooting

### "Database client not yet initialized"

**Cause**: Trying to access database before async initialization completes.

**Solution**: Use `getDb()` instead of `db` directly, or ensure your code runs in an async context.

```typescript
// ❌ Potential issue
const users = db.select().from(users);  // May fail if called too early

// ✅ Safe
const database = await getDb();
const users = database.select().from(users);
```

### "Failed to retrieve secret: AccessDenied"

**Cause**: IAM role doesn't have Secrets Manager permissions.

**Solution**: Ensure your Amplify service role has the required IAM policy:

```json
{
  "Effect": "Allow",
  "Action": [
    "secretsmanager:GetSecretValue",
    "secretsmanager:DescribeSecret"
  ],
  "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:rds!db-*"
}
```

### "Connection refused" or "timeout"

**Cause**: Database connection details are incorrect or network access is blocked.

**Solutions**:
1. Verify `DB_HOST`, `DB_PORT`, `DB_NAME` are correct
2. Check RDS security group allows inbound traffic on port 5432
3. For Amplify: Ensure VPC configuration if RDS is in private subnet
4. Test connection locally: `psql -h $DB_HOST -p $DB_PORT -U postgres -d checkmate`

### Drizzle Kit can't find DATABASE_URL

**Cause**: Neither `DATABASE_URL` nor component variables are set in `.env.local`.

**Solution**: Set at least one of the following:
- `DATABASE_URL` (full connection string), OR
- `DB_HOST` + `DB_USER` + `DB_PASSWORD` (+ optional `DB_PORT`, `DB_NAME`)

## Best Practices

1. **Use repository pattern** - Centralize data access in `lib/db/repo.ts`
2. **Never log secrets** - Connection string contains credentials
3. **Use transactions** for multi-step operations:
   ```typescript
   await db.transaction(async (tx) => {
     await tx.insert(users).values(userData);
     await tx.insert(sessions).values(sessionData);
   });
   ```
4. **Add indexes** for frequently queried columns
5. **Use prepared statements** for better performance with repeated queries
6. **Handle errors gracefully** - Database operations can fail

## Performance Tips

1. **Connection Pooling**: Configured with `max: 1` for serverless (adjust if needed)
2. **Select Only Needed Columns**: Use `.select({ id: users.id })` instead of `.select()`
3. **Use Pagination**: Always limit results and use offset/cursor pagination
4. **Cache Frequently Accessed Data**: Use Redis or in-memory caching
5. **Batch Operations**: Use `db.insert().values([...])` for bulk inserts

## Security

- ✅ **SSL Required**: All connections use `sslmode=require`
- ✅ **Credentials in Secrets Manager**: Never hardcoded
- ✅ **IAM Role Authentication**: Production uses IAM roles, not user credentials
- ✅ **Connection String Masking**: Debug logs mask sensitive information
- ✅ **Least Privilege**: Database user should have minimal required permissions

## Related Documentation

- [Secrets Manager Migration Plan](../../SECRETS_MANAGER_MIGRATION_PLAN.md)
- [Secrets Module](../secrets/README.md)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [AWS RDS PostgreSQL](https://aws.amazon.com/rds/postgresql/)

