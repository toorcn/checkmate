# DynamoDB Schema Plan (Convex → DynamoDB)

This document maps `convex/schema.ts` to a single-table DynamoDB design. No data migration in this phase — only table/index structure and item shapes.

## Table
- Name: `checkmate` (placeholder; set via env `DDB_TABLE`)
- Billing: On-demand (`PAY_PER_REQUEST`)
- Keys: `PK` (partition), `SK` (sort)
- Streams: Enabled (later for triggers/analytics)

## Item Types
- User: `type = "USER"`
- Content Creator: `type = "CREATOR"`
- TikTok Analysis: `type = "ANALYSIS"`
- Creator Comment: `type = "COMMENT"`

## Primary Keys
- User: `PK=USER#<userId>`, `SK=PROFILE`
- Creator: `PK=CREATOR#<creatorId>#PLATFORM#<platform>`, `SK=PROFILE`
- Analysis: `PK=USER#<userId>`, `SK=ANALYSIS#<isoTime>#<analysisId>`
- Comment: `PK=CREATOR#<creatorId>#PLATFORM#<platform>`, `SK=COMMENT#<isoTime>#<commentId>`

Notes
- Use ISO 8601 timestamps (or `ts` padded numbers) in SK to support time-range and `desc` lists (reverse client-side).
- `analysisId` and `commentId` can be ULIDs for good sort order.

## Attributes (selected)
- Common: `type`, `createdAt`, `updatedAt`
- USER: `clerkId`, `email`, `firstName`, `lastName`, `imageUrl`, `username`
- CREATOR: `creatorId`, `platform`, `creatorName`, `credibilityRating`, `totalAnalyses`, `totalCredibilityScore`, `lastAnalyzedAt`
- ANALYSIS: `userId`, `videoUrl`, `transcription`, `metadata`, `newsDetection`, `factCheck`, `requiresFactCheck`, `creatorCredibilityRating`, `contentCreatorCK` (creator composite key string), `contentCreatorId` (optional foreign id for reference)
- COMMENT: `creatorId`, `platform`, `userId`, `content`

## GSIs (to mirror Convex indexes)
- GSI1 (Users by Auth Subject): `GSI1PK=AUTH#<provider>#<subject>`, `GSI1SK=USER#<userId>` → find user by identity provider.
  - For Clerk: `AUTH#clerk#<clerkId>`
  - For Cognito: `AUTH#cognito#<sub>`
- GSI2 (Creators by Platform + Last Analyzed): `GSI2PK=PLATFORM#<platform>`, `GSI2SK=LAST#<lastAnalyzedAt>#<creatorId>` → recent creators.
- GSI3 (Creators by Platform + Credibility): `GSI3PK=PLATFORM#<platform>`, `GSI3SK=CRED#<pad(credibilityRating)>#<creatorId>` → top/bottom creators.
- GSI4 (Analyses requiring fact-check): sparse index. Only put attr when `requiresFactCheck=true`.
  - `GSI4PK=RFC`, `GSI4SK=<isoTime>#USER#<userId>#<analysisId>` → newest first by time.
- GSI5 (Analyses by User + Platform): `GSI5PK=USER#<userId>`, `GSI5SK=PLATFORM#<platform>#<isoTime>#<analysisId>`.
- GSI6 (Analyses by Content Creator): `GSI6PK=CREATOR#<creatorId>#PLATFORM#<platform>`, `GSI6SK=<isoTime>#<analysisId>`.
- GSI7 (All analyses by createdAt): `GSI7PK=ANALYSIS`, `GSI7SK=<isoTime>#<userId>#<analysisId>` (optional; used by admin listings).
- GSI8 (Comments by User): `GSI8PK=USER#<userId>`, `GSI8SK=COMMENT#<isoTime>#<commentId>`.
- GSI9 (Analysis by ID): `GSI9PK=ANALYSIS#<id>`, `GSI9SK=USER#<userId>#<isoTime>` → fetch/delete by id fast.

Rationale → Convex indexes
- users.by_clerk_id → GSI1
- contentCreators.by_platform, by_last_analyzed, by_credibility_rating → GSI2, GSI3 (platform-scoped sorting)
- tiktokAnalyses.by_user → table PK design (PK=USER#id)
- tiktokAnalyses.by_created_at → GSI7
- tiktokAnalyses.by_requires_fact_check → GSI4 (sparse)
- tiktokAnalyses.by_user_and_platform → GSI5
- tiktokAnalyses.by_content_creator → GSI6
- creatorComments.by_creator_platform → table PK design
- creatorComments.by_user → GSI8
- creatorComments.by_created_at → can reuse GSI7 with `type=COMMENT` if needed, or add `GSI9PK=COMMENT`, `GSI9SK=<isoTime>#<commentId>` later.

## Example Items
- USER
```json
{
  "PK": "USER#u_123",
  "SK": "PROFILE",
  "type": "USER",
  "authProvider": "cognito",
  "authSubject": "abc-sub-123",
  "clerkId": "clrk_abc",
  "email": "a@b.com",
  "firstName": "A",
  "createdAt": 1710000000000,
  "GSI1PK": "AUTH#cognito#abc-sub-123",
  "GSI1SK": "USER#u_123"
}
```
- CREATOR
```json
{
  "PK": "CREATOR#john#PLATFORM#tiktok",
  "SK": "PROFILE",
  "type": "CREATOR",
  "creatorId": "john",
  "platform": "tiktok",
  "credibilityRating": 7.4,
  "lastAnalyzedAt": 1710000000000,
  "GSI2PK": "PLATFORM#tiktok",
  "GSI2SK": "LAST#1710000000000#john",
  "GSI3PK": "PLATFORM#tiktok",
  "GSI3SK": "CRED#007.4#john"
}
```
- ANALYSIS
```json
{
  "PK": "USER#u_123",
  "SK": "ANALYSIS#2024-09-10T12:34:56.000Z#01JABCDE...",
  "type": "ANALYSIS",
  "userId": "u_123",
  "videoUrl": "https://...",
  "requiresFactCheck": true,
  "contentCreatorCK": "CREATOR#john#PLATFORM#tiktok",
  "GSI4PK": "RFC",
  "GSI4SK": "2024-09-10T12:34:56.000Z#USER#u_123#01JABCDE...",
  "GSI5PK": "USER#u_123",
  "GSI5SK": "PLATFORM#tiktok#2024-09-10T12:34:56.000Z#01JABCDE...",
  "GSI6PK": "CREATOR#john#PLATFORM#tiktok",
  "GSI6SK": "2024-09-10T12:34:56.000Z#01JABCDE...",
  "GSI7PK": "ANALYSIS",
  "GSI7SK": "2024-09-10T12:34:56.000Z#u_123#01JABCDE...",
  "GSI9PK": "ANALYSIS#01JABCDE...",
  "GSI9SK": "USER#u_123#2024-09-10T12:34:56.000Z"
}
```
- COMMENT
```json
{
  "PK": "CREATOR#john#PLATFORM#tiktok",
  "SK": "COMMENT#2024-09-10T12:35:01.000Z#01JXYZ...",
  "type": "COMMENT",
  "userId": "u_123",
  "creatorId": "john",
  "platform": "tiktok",
  "content": "…",
  "GSI8PK": "USER#u_123",
  "GSI8SK": "COMMENT#2024-09-10T12:35:01.000Z#01JXYZ..."
}
```

## IaC Sketch (CloudFormation resource)
- One table with primary keys `PK`/`SK` and eight GSIs named `GSI1`..`GSI8` per above. Start with minimal projections (keys only) and extend as needed.

## Notes & Next Steps
- Keep this schema stable; add GSIs cautiously (write‑amplification). Start with GSI1,2,4,5,6; add GSI3,7,8 if/when needed by UI.
- Implement a thin repository layer to build keys and wrap AWS SDK calls.
- For descending sorts, query ascending and reverse in code, or invert timestamps.
