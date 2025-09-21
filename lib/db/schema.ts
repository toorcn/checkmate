import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    imageUrl: text("image_url"),
    username: text("username"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [index("users_email_idx").on(t.email)]
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }),
    revokedAt: timestamp("revoked_at", { mode: "date" }),
  },
  (t) => [index("sessions_user_idx").on(t.userId, t.createdAt)]
);

export const creators = pgTable(
  "creators",
  {
    id: text("id").notNull(),
    platform: text("platform").notNull(),
    creatorName: text("creator_name"),
    credibilityRating: integer("credibility_rating").notNull().default(0),
    totalAnalyses: integer("total_analyses").notNull().default(0),
    totalCredibilityScore: integer("total_credibility_score")
      .notNull()
      .default(0),
    lastAnalyzedAt: timestamp("last_analyzed_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.id, t.platform], name: "creators_pk" }),
    index("creators_platform_idx").on(t.platform),
    index("creators_cred_idx").on(t.platform, t.credibilityRating),
  ]
);

export const analyses = pgTable(
  "analyses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    videoUrl: text("video_url").notNull(),
    transcription: text("transcription"),
    metadata: text("metadata"),
    newsDetection: text("news_detection"),
    factCheck: text("fact_check"),
    creatorCredibilityRating: integer("creator_credibility_rating"),
    contentCreatorId: text("content_creator_id"),
    requiresFactCheck: boolean("requires_fact_check").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
    platform: text("platform"),
  },
  (t) => [
    index("analyses_user_created_idx").on(t.userId, t.createdAt),
    index("analyses_platform_idx").on(t.userId, t.platform, t.createdAt),
    index("analyses_requires_fc_idx").on(t.requiresFactCheck, t.createdAt),
  ]
);

export const comments = pgTable(
  "comments",
  {
    id: text("id").primaryKey(),
    creatorId: text("creator_id").notNull(),
    platform: text("platform").notNull(),
    userId: text("user_id").notNull(),
    content: text("content").notNull(),
    userName: text("user_name"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("comments_creator_idx").on(t.creatorId, t.platform, t.createdAt),
    index("comments_user_idx").on(t.userId, t.createdAt),
  ]
);
