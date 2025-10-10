CREATE TABLE "article_analyses" (
	"article_id" text PRIMARY KEY NOT NULL,
	"article_url" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"source" text NOT NULL,
	"verdict" text NOT NULL,
	"confidence" integer NOT NULL,
	"summary" text NOT NULL,
	"key_points" text NOT NULL,
	"sentiment" text,
	"facts_verified" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "crowdsource_analyses" CASCADE;--> statement-breakpoint
DROP TABLE "crowdsource_articles" CASCADE;--> statement-breakpoint
DROP TABLE "crowdsource_votes" CASCADE;--> statement-breakpoint
CREATE INDEX "article_analyses_created_idx" ON "article_analyses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "article_analyses_verdict_idx" ON "article_analyses" USING btree ("verdict");