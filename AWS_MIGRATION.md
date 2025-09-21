# AWS Migration: Bedrock Provider Switch

This app uses the Vercel AI SDK (`ai`) with the OpenAI provider. To move LLM usage to AWS Bedrock with minimal changes, replace `@ai-sdk/openai` with `@ai-sdk/amazon-bedrock` in LLM call sites. Keep everything else the same. Speech‑to‑text (Whisper) can remain as‑is for now, or be migrated to Amazon Transcribe later.

## What to Install
- Add: `@ai-sdk/amazon-bedrock`
- Keep: `ai`
- Keep: `@ai-sdk/openai` if you still use Whisper via `openai.transcription('whisper-1')` in `tools/helpers.ts`.

Example:
```bash
npm i @ai-sdk/amazon-bedrock
# Do NOT remove @ai-sdk/openai yet if helpers.ts uses Whisper
```

## Environment Setup
- AWS credentials for Bedrock (Amplify/SSR role or local AWS_PROFILE)
- `AWS_REGION` (e.g., `us-east-1`)
- Optional: `BEDROCK_MODEL_ID` (e.g., `anthropic.claude-3-haiku-20240307-v1:0`)

## Code Changes (find-and-replace pattern)
Change imports and model calls where OpenAI is used for text generation:

1) `tools/fact-checking/web-research.ts`
- Before:
```ts
import { openai } from "@ai-sdk/openai";
...
const { text } = await generateText({ model: openai("gpt-4o-mini"), ... });
```
- After:
```ts
import { bedrock } from "@ai-sdk/amazon-bedrock";
...
const { text } = await generateText({
  model: bedrock(process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0"),
  ...
});
```

2) `tools/fact-checking/domain-credibility.ts`
- Before: `import { openai } from "@ai-sdk/openai";` and `model: openai("gpt-4o-mini")`
- After: `import { bedrock } from "@ai-sdk/amazon-bedrock";` and `model: bedrock(process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0")`

3) `tools/fact-checking/verification-analysis.ts` (same change if it calls OpenAI)

No other code changes are required for LLM migration. The rest of your AI SDK code (`generateText`, `tool`, schemas) remains unchanged.

## Transcription (Optional later step)
`tools/helpers.ts` uses `experimental_transcribe({ model: openai.transcription("whisper-1") })`.
- Minimal LLM migration does not change this. Keep `@ai-sdk/openai` installed.
- To fully move off OpenAI, replace Whisper with Amazon Transcribe in a future change.

## Validation
- Run: `npm run lint && npm run build`
- Exercise flows that call LLMs (fact‑check, domain credibility). Ensure AWS credentials and region are configured.

## Notes
- Bedrock model IDs vary by region and account access; Claude 3 Haiku is a low‑latency default.
- If you later remove OpenAI entirely, first migrate `tools/helpers.ts` (transcription) to Amazon Transcribe.

---

# Broader AWS Migration (Beyond LLMs)

This section summarizes how to move other services (auth, data, hosting, scraping, etc.) from current providers to AWS.

## Service Mapping
- Hosting/SSR: Vercel → AWS Amplify Hosting (SSR) or CloudFront + Lambda@Edge.
- Auth: Clerk → Amazon Cognito (User Pool + Hosted UI; verify JWTs in `middleware.ts`).
- DB/Realtime: Convex → DynamoDB (+ Streams) with Lambda/API Gateway; real‑time via AppSync or API Gateway WebSocket.
- Static assets: `public/` → S3 + CloudFront.
- Speech‑to‑Text: Whisper → Amazon Transcribe (batch or streaming).
- Web Scraping: Firecrawl → Lambda (Node) + `fetch`/`cheerio` (or Playwright); cache in S3/DynamoDB.
- Web Search: Exa → Amazon Kendra/OpenSearch over curated sources.
- Secrets/Logs: AWS Secrets Manager/SSM; CloudWatch Logs.

## Code Changes (by path)
- `tools/helpers.ts`
  - Transcription: replace Whisper with Amazon Transcribe (optional now; required before removing `@ai-sdk/openai`).
  - Scraping: replace Firecrawl with your own fetch/cheerio helper or call a Lambda endpoint.
- `tools/fact-checking/web-research.ts`
  - Already switched LLM to Bedrock (see above). For search, swap Exa calls for Kendra/OpenSearch queries or a curated source list.
- `tools/fact-checking/*`
  - Any other `openai("…")` calls → `bedrock("…")` as shown above.
- `convex/*` and `lib/hooks/*`
  - Port Convex data operations to DynamoDB using `@aws-sdk/lib-dynamodb` (`GetCommand`, `PutCommand`, `QueryCommand`).
- `app/api/*`
  - Keep Next.js routes and call AWS SDKs directly, or proxy to API Gateway + Lambda microservices.
- `middleware.ts`
  - Replace Clerk verification with Cognito JWT validation against the User Pool JWKS.

## Packages to Add/Remove
```bash
# Add AWS SDK clients you plan to use
npm i @aws-sdk/client-cognito-identity-provider @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-s3 @aws-sdk/client-transcribe @aws-sdk/client-opensearch @aws-sdk/client-kendra

# Keep AI SDKs per the Bedrock switch above
npm i @ai-sdk/amazon-bedrock

# Remove vendor libs once migrated
npm remove @mendable/firecrawl-js    # after scraping is replaced
npm remove exa                       # if used directly; remove Exa usage in code first
# npm remove @ai-sdk/openai           # ONLY after moving transcription off Whisper
```

## Minimal Code Patterns
- Bedrock (text generation):
```ts
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { generateText } from "ai";
const { text } = await generateText({
  model: bedrock(process.env.BEDROCK_MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0"),
  prompt,
  maxTokens: 512,
  temperature: 0.3,
});
```
- Transcribe (batch, via SDK):
```ts
import { TranscribeClient, StartTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
const tx = new TranscribeClient({ region: process.env.AWS_REGION });
await tx.send(new StartTranscriptionJobCommand({
  TranscriptionJobName: `job-${Date.now()}`,
  LanguageCode: "en-US",
  Media: { MediaFileUri: s3Uri },
  OutputBucketName: process.env.S3_BUCKET,
}));
```

## Environment Variables
- Core: `AWS_REGION`
- Cognito: `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_DOMAIN`
- Bedrock: `BEDROCK_MODEL_ID`
- S3: `S3_BUCKET`
- DynamoDB: `DDB_TABLE_ANALYSES`, `DDB_TABLE_CREATORS`, etc.
- API endpoints if using API Gateway/AppSync.

Remove once migrated: `FIRECRAWL_API_KEY`, `EXA_API_KEY`, and eventually `OPENAI_API_KEY`.

## Data & Feature Migration
- DynamoDB tables per entity (from `convex`): users, creators, analyses, comments. Add GSIs for access patterns used in `lib/hooks/*`.
- Real‑time updates: AppSync subscriptions or API Gateway WebSocket + DynamoDB Streams.
- Media: uploads and generated artifacts in S3; serve via CloudFront.
- Scraping: deploy a small Lambda (Node + `cheerio`) and call it from API routes.

## Deployment
- Prefer AWS Amplify Hosting for Next.js SSR with env vars and CI.
- Alternative: CloudFront + Lambda@Edge/SST/CDK; APIs via API Gateway + Lambda.
- Observability: CloudWatch Logs/Alarms, X‑Ray (Lambda), and AWS WAF on CloudFront.

## Checklist
1) Provision Cognito, DynamoDB, S3, Bedrock access, (Kendra/OpenSearch optional), API Gateway/Lambda if needed.
2) Configure IAM roles and least‑privilege policies.
3) Implement Bedrock provider switch (this doc, top section).
4) Replace Firecrawl/Exa usages.
5) Port Convex calls to DynamoDB in `lib/hooks/*`.
6) Update middleware to Cognito.
7) Set env vars; run `npm run lint && npm run build`.
8) Deploy via Amplify; verify end‑to‑end flows.
