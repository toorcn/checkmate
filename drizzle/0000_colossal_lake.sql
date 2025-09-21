CREATE TABLE "analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"video_url" text NOT NULL,
	"transcription" text,
	"metadata" text,
	"news_detection" text,
	"fact_check" text,
	"creator_credibility_rating" integer,
	"content_creator_id" text,
	"requires_fact_check" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"platform" text
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"creator_id" text NOT NULL,
	"platform" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"user_name" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creators" (
	"id" text NOT NULL,
	"platform" text NOT NULL,
	"creator_name" text,
	"credibility_rating" integer DEFAULT 0 NOT NULL,
	"total_analyses" integer DEFAULT 0 NOT NULL,
	"total_credibility_score" integer DEFAULT 0 NOT NULL,
	"lastAnalyzedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creators_pk" PRIMARY KEY("id","platform")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"image_url" text,
	"username" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "analyses_user_created_idx" ON "analyses" USING btree ("user_id","createdAt");--> statement-breakpoint
CREATE INDEX "analyses_platform_idx" ON "analyses" USING btree ("user_id","platform","createdAt");--> statement-breakpoint
CREATE INDEX "analyses_requires_fc_idx" ON "analyses" USING btree ("requires_fact_check","createdAt");--> statement-breakpoint
CREATE INDEX "comments_creator_idx" ON "comments" USING btree ("creator_id","platform","createdAt");--> statement-breakpoint
CREATE INDEX "comments_user_idx" ON "comments" USING btree ("user_id","createdAt");--> statement-breakpoint
CREATE INDEX "creators_platform_idx" ON "creators" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "creators_cred_idx" ON "creators" USING btree ("platform","credibility_rating");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");