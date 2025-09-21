-- Rename camelCase columns to snake_case across all tables
ALTER TABLE "analyses" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "analyses" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "comments" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "comments" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "creators" RENAME COLUMN "lastAnalyzedAt" TO "last_analyzed_at";--> statement-breakpoint
ALTER TABLE "creators" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "creators" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint

DROP INDEX "comments_creator_idx";--> statement-breakpoint
DROP INDEX "comments_user_idx";--> statement-breakpoint
CREATE INDEX "comments_creator_idx" ON "comments" USING btree ("creator_id","platform","created_at");--> statement-breakpoint
CREATE INDEX "comments_user_idx" ON "comments" USING btree ("user_id","created_at");