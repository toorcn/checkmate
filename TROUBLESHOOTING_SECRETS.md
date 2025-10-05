# Troubleshooting Secrets Manager Issues

## Current Issue: Exa API "400 Bad Request"

The error you're seeing suggests the Exa API key is either:
1. Not stored in Secrets Manager correctly
2. Has the wrong format/value
3. Is expired or invalid

---

## 🔍 Step 1: Check Your Secrets in AWS Console

### Navigate to Secrets Manager

1. Go to AWS Console → Secrets Manager
2. Look for these secrets:
   - `checkmate-dev/exa_api_key`
   - `checkmate-dev/firecrawl_api_key`
   - `checkmate-dev/auth_secret`
   - `rds!db-663b916d-667d-420b-930f-bbdbf25c9eb8`

### Check Exa API Key Secret

Click on `checkmate-dev/exa_api_key` and view the secret value. It should be stored as:

**Option A: Plain String (Recommended)**
```
your-actual-exa-api-key-here
```

**Option B: JSON Format**
```json
{
  "key": "your-actual-exa-api-key-here"
}
```

Or:
```json
{
  "apiKey": "your-actual-exa-api-key-here"
}
```

Our code handles both formats automatically.

---

## 🔍 Step 2: Verify Secret Format

### Check if Secret is JSON or Plain Text

In AWS Secrets Manager console:
1. Click "Retrieve secret value"
2. Look at the format:
   - If it shows just the key → Good (plain text)
   - If it shows `{"key": "..."}` → Good (JSON)
   - If it's empty or malformed → **FIX THIS**

### Expected Format for Each Secret

| Secret Name | Expected Format | Example |
|------------|----------------|---------|
| `checkmate-dev/exa_api_key` | Plain text string | `abcd1234...` |
| `checkmate-dev/firecrawl_api_key` | Plain text string | `fc-abcd1234...` |
| `checkmate-dev/auth_secret` | JSON | `{"secret": "long-random-string"}` |
| `rds!db-...` | JSON (auto-generated) | `{"username": "postgres", "password": "..."}` |

---

## 🔍 Step 3: Test API Key Validity

### Test Exa API Key Manually

```bash
# Replace with your actual key
curl -X POST https://api.exa.ai/search \
  -H "x-api-key: YOUR_EXA_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test query",
    "numResults": 1
  }'
```

**Expected Response:**
- ✅ Success: JSON with search results
- ❌ 400 Bad Request: Key is invalid or malformed
- ❌ 401 Unauthorized: Key is incorrect

### Test Firecrawl API Key Manually

```bash
# Replace with your actual key
curl https://api.firecrawl.dev/v0/scrape \
  -H "Authorization: Bearer YOUR_FIRECRAWL_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com"
  }'
```

---

## 🔧 Step 4: Fix Secret Storage

### If Secret is Missing or Wrong

#### Option A: Update via AWS Console

1. Go to AWS Secrets Manager
2. Click on the secret (e.g., `checkmate-dev/exa_api_key`)
3. Click "Retrieve secret value"
4. Click "Edit"
5. Select "Plaintext" tab
6. Paste your API key (just the key, no quotes unless JSON)
7. Click "Save"

#### Option B: Update via AWS CLI

```bash
# Update Exa API key (plain text)
aws secretsmanager put-secret-value \
  --secret-id checkmate-dev/exa_api_key \
  --secret-string "your-actual-exa-api-key"

# Update Firecrawl API key (plain text)
aws secretsmanager put-secret-value \
  --secret-id checkmate-dev/firecrawl_api_key \
  --secret-string "your-actual-firecrawl-api-key"

# Update Auth secret (JSON)
aws secretsmanager put-secret-value \
  --secret-id checkmate-dev/auth_secret \
  --secret-string '{"secret":"your-auth-secret-here"}'
```

---

## 🔍 Step 5: Test Local vs Production

### Test with Local .env.local (Bypass Secrets Manager)

1. Update your `.env.local`:
   ```bash
   USE_SECRETS_MANAGER=false
   EXA_API_KEY=your-actual-exa-key-here
   FIRECRAWL_API_KEY=your-actual-firecrawl-key-here
   ```

2. Restart your dev server:
   ```bash
   npm run dev
   ```

3. Test the API again
   - ✅ Works: Secret Manager secret is wrong
   - ❌ Still fails: API key itself is invalid

### Test with Secrets Manager Enabled

1. Update your `.env.local`:
   ```bash
   USE_SECRETS_MANAGER=true
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   APP_REGION=us-east-1
   DB_HOST=checkmate-db-instance.c2f2oys8o2re.us-east-1.rds.amazonaws.com
   DB_PORT=5432
   DB_NAME=checkmate
   ```

2. Restart dev server and test

---

## 🔍 Step 6: Check IAM Permissions

Make sure your AWS credentials have these permissions:

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
        "arn:aws:secretsmanager:us-east-1:*:secret:rds!db-*"
      ]
    }
  ]
}
```

---

## 🐛 Common Issues & Solutions

### Issue: "400 Bad Request" from Exa API

**Causes:**
- API key is invalid
- API key has wrong format (extra quotes, spaces, newlines)
- API key is expired
- Secret stores wrong value

**Solutions:**
1. Get a fresh API key from https://exa.ai
2. Store it in Secrets Manager as plain text (no extra characters)
3. Test the key manually with curl first
4. Clear your browser cache and restart server

### Issue: "Could not load credentials"

**Causes:**
- AWS credentials not configured
- IAM role doesn't have Secrets Manager permissions

**Solutions:**
1. Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in `.env.local`
2. Or use AWS CLI profile: `aws configure`
3. Verify permissions with: `aws secretsmanager list-secrets`

### Issue: "Secret not found"

**Causes:**
- Secret doesn't exist in Secrets Manager
- Wrong region configured
- Typo in secret name

**Solutions:**
1. Verify secret exists: `aws secretsmanager list-secrets --region us-east-1`
2. Check region matches: `APP_REGION=us-east-1`
3. Check secret name spelling

---

## 📊 Quick Diagnostic Checklist

Run through this checklist:

- [ ] Secret exists in AWS Secrets Manager
- [ ] Secret value is not empty
- [ ] Secret format is correct (plain text or proper JSON)
- [ ] API key is valid (test with curl)
- [ ] AWS credentials configured locally
- [ ] IAM permissions include Secrets Manager read
- [ ] Region is set correctly (`us-east-1`)
- [ ] `USE_SECRETS_MANAGER=true` in environment
- [ ] Server restarted after changes

---

## 🚀 Next Steps

1. **First, test with local env vars** to confirm API key itself works
2. **Then, verify secret format** in AWS Secrets Manager console
3. **Update secret if needed** with correct format
4. **Test again** with Secrets Manager enabled

If you continue to have issues, check:
- CloudWatch Logs for detailed errors
- Network connectivity to AWS services
- API key quotas/limits on Exa/Firecrawl side

---

## 📝 Example Working Configuration

### .env.local (Testing Secrets Manager)
```bash
USE_SECRETS_MANAGER=true
NODE_ENV=development

# AWS Credentials
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
APP_REGION=us-east-1

# Database connection (non-sensitive)
DB_HOST=checkmate-db-instance.c2f2oys8o2re.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=checkmate

# Other configs
S3_BUCKET=your-bucket
BEDROCK_MODEL_ID=us.amazon.nova-lite-v1:0
```

### Secrets in AWS Secrets Manager

**checkmate-dev/exa_api_key**:
```
abc123def456ghi789  (just the key, plain text)
```

**checkmate-dev/firecrawl_api_key**:
```
fc-1234567890abcdef  (just the key, plain text)
```

**checkmate-dev/auth_secret**:
```json
{
  "secret": "your-long-random-auth-secret-here-minimum-32-chars"
}
```

---

Need help? Check the specific error message in your terminal for more clues!

