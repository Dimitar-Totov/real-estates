CREATE TYPE "public"."feed_item_type" AS ENUM('listing', 'agent_activity', 'review', 'market_update');--> statement-breakpoint
CREATE TABLE "feed_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" "feed_item_type" NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
