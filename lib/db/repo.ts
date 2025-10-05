import { and, desc, eq } from "drizzle-orm";
import { db } from "./index";
import { analyses, creators, comments, users, sessions } from "./schema";

export async function upsertUser(u: {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  username?: string | null;
}) {
  // Intentionally logging for observability in dev; not considered a lint issue
  console.log("[db] upsertUser", { id: u.id, email: u.email });
  
  // Use getDb() to ensure database is initialized
  const { getDb } = await import("./index");
  const database = await getDb();
  
  await database
    .insert(users)
    .values({
      id: u.id,
      email: u.email,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
      imageUrl: u.imageUrl ?? null,
      username: u.username ?? null,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: u.email,
        firstName: u.firstName ?? null,
        lastName: u.lastName ?? null,
        imageUrl: u.imageUrl ?? null,
        username: u.username ?? null,
        updatedAt: new Date(),
      },
    });
}

export async function createSession(input: {
  id: string;
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt?: Date | null;
}): Promise<boolean> {
  try {
    await db.insert(sessions).values({
      id: input.id,
      userId: input.userId,
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
      expiresAt: input.expiresAt ?? null,
    });
    return true;
  } catch (err: any) {
    // Graceful fallback if sessions table hasn't been migrated yet
    if (
      err?.code === "42P01" ||
      /relation \"sessions\" does not exist/i.test(String(err?.message || ""))
    ) {
      console.warn(
        "[auth] sessions table missing; continuing without DB session"
      );
      return false;
    }
    throw err;
  }
}

export async function getSessionById(id: string) {
  try {
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);
    return rows[0] ?? null;
  } catch (err: any) {
    if (err?.code === "42P01") return null;
    return null;
  }
}

export async function revokeSession(id: string) {
  try {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.id, id));
  } catch (err: any) {
    if (err?.code === "42P01") return; // ignore if table missing
    throw err;
  }
}

export async function createAnalysis(input: {
  id: string;
  userId: string;
  videoUrl: string;
  transcription?: string;
  metadata?: unknown;
  newsDetection?: unknown;
  factCheck?: unknown;
  requiresFactCheck?: boolean;
  creatorCredibilityRating?: number;
  contentCreatorId?: string;
  platform?: string;
}) {
  await db.insert(analyses).values({
    id: input.id,
    userId: input.userId,
    videoUrl: input.videoUrl,
    transcription: input.transcription ?? null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    newsDetection: input.newsDetection
      ? JSON.stringify(input.newsDetection)
      : null,
    factCheck: input.factCheck ? JSON.stringify(input.factCheck) : null,
    requiresFactCheck: !!input.requiresFactCheck,
    creatorCredibilityRating:
      input.creatorCredibilityRating == null
        ? null
        : Math.round(Number(input.creatorCredibilityRating)),
    contentCreatorId: input.contentCreatorId ?? null,
    platform: input.platform ?? null,
  });
}

export async function listAnalysesByUser(userId: string, limit = 20) {
  return db
    .select()
    .from(analyses)
    .where(eq(analyses.userId, userId))
    .orderBy(desc(analyses.createdAt))
    .limit(limit);
}

export async function getAnalysisById(id: string) {
  const rows = await db
    .select()
    .from(analyses)
    .where(eq(analyses.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function deleteAnalysisById(id: string) {
  const res = await db.delete(analyses).where(eq(analyses.id, id));
  return (res as any).rowCount ? (res as any).rowCount > 0 : true;
}

export async function listAnalysesRequiringFactCheckByUser(
  userId: string,
  limit = 10
) {
  return db
    .select()
    .from(analyses)
    .where(
      and(eq(analyses.userId, userId), eq(analyses.requiresFactCheck, true))
    )
    .orderBy(desc(analyses.createdAt))
    .limit(limit);
}

export async function listAnalysesByCreator(
  creatorId: string,
  platform: string,
  limit = 10
) {
  return db
    .select()
    .from(analyses)
    .where(
      and(
        eq(analyses.contentCreatorId, creatorId),
        eq(analyses.platform, platform)
      )
    )
    .orderBy(desc(analyses.createdAt))
    .limit(limit);
}

export async function upsertCreator(input: {
  id: string;
  platform: string;
  creatorName?: string;
  credibilityRating?: number;
  lastAnalyzedAt?: Date;
}) {
  await db
    .insert(creators)
    .values({
      id: input.id,
      platform: input.platform,
      creatorName: input.creatorName ?? null,
      credibilityRating: input.credibilityRating ?? 0,
      lastAnalyzedAt: input.lastAnalyzedAt ?? null,
    })
    .onConflictDoUpdate({
      target: [creators.id, creators.platform],
      set: {
        creatorName: input.creatorName ?? null,
        credibilityRating: input.credibilityRating ?? 0,
        lastAnalyzedAt: input.lastAnalyzedAt ?? null,
        updatedAt: new Date(),
      },
    });
}

export async function getCreator(creatorId: string, platform: string) {
  const rows = await db
    .select()
    .from(creators)
    .where(and(eq(creators.id, creatorId), eq(creators.platform, platform)))
    .limit(1);
  return rows[0] ?? null;
}

export async function recordCreatorAnalysis(input: {
  id: string; // creator id
  platform: string;
  creatorName?: string;
  credibilityRating?: number | null;
  at?: Date;
}) {
  const existing = await getCreator(input.id, input.platform);
  const now = input.at ?? new Date();
  const rating =
    input.credibilityRating == null
      ? null
      : Math.round(Number(input.credibilityRating));
  if (!existing) {
    await db.insert(creators).values({
      id: input.id,
      platform: input.platform,
      creatorName: input.creatorName ?? null,
      credibilityRating: rating ?? 0,
      totalAnalyses: 1,
      totalCredibilityScore: rating ?? 0,
      lastAnalyzedAt: now,
    });
    return;
  }
  const newTotalAnalyses = (existing as any).totalAnalyses + 1;
  const newTotalScore = (existing as any).totalCredibilityScore + (rating ?? 0);
  const newAvg = Math.round(newTotalScore / Math.max(1, newTotalAnalyses));
  await db
    .update(creators)
    .set({
      creatorName: input.creatorName ?? (existing as any).creatorName ?? null,
      totalAnalyses: newTotalAnalyses,
      totalCredibilityScore: newTotalScore,
      credibilityRating:
        rating == null ? (existing as any).credibilityRating : newAvg,
      lastAnalyzedAt: now,
      updatedAt: new Date(),
    })
    .where(
      and(eq(creators.id, input.id), eq(creators.platform, input.platform))
    );
}

export async function listTopCreatorsByCredibility(
  platform: string,
  limit = 10
) {
  return db
    .select()
    .from(creators)
    .where(eq(creators.platform, platform))
    .orderBy(desc(creators.credibilityRating))
    .limit(limit);
}

export async function listBottomCreatorsByCredibility(
  platform: string,
  limit = 10
) {
  return db
    .select()
    .from(creators)
    .where(eq(creators.platform, platform))
    .orderBy(creators.credibilityRating)
    .limit(limit);
}

export async function listCreatorComments(
  creatorId: string,
  platform: string,
  limit = 50
) {
  return db
    .select()
    .from(comments)
    .where(
      and(eq(comments.creatorId, creatorId), eq(comments.platform, platform))
    )
    .orderBy(desc(comments.createdAt))
    .limit(limit);
}

export async function addCreatorComment(input: {
  id: string;
  creatorId: string;
  platform: string;
  userId: string;
  userName?: string;
  content: string;
}) {
  const rows = await db
    .insert(comments)
    .values({
      id: input.id,
      creatorId: input.creatorId,
      platform: input.platform,
      userId: input.userId,
      userName: input.userName ?? null,
      content: input.content,
    })
    .returning();
  return rows[0] ?? null;
}
