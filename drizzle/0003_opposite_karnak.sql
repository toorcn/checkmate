CREATE TABLE "crowdsource_analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"verdict" text NOT NULL,
	"confidence" integer NOT NULL,
	"summary" text,
	"key_points" text,
	"sentiment_score" integer,
	"bias_score" integer,
	"fact_check_details" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crowdsource_articles" (
	"id" text PRIMARY KEY NOT NULL,
	"article_data" text NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crowdsource_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"user_id" text,
	"session_id" text NOT NULL,
	"vote_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "crowdsource_analyses_article_idx" ON "crowdsource_analyses" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "crowdsource_analyses_status_idx" ON "crowdsource_analyses" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "crowdsource_articles_fetched_idx" ON "crowdsource_articles" USING btree ("fetched_at");--> statement-breakpoint
CREATE INDEX "crowdsource_votes_article_idx" ON "crowdsource_votes" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "crowdsource_votes_session_idx" ON "crowdsource_votes" USING btree ("article_id","session_id");