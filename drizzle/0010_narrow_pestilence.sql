CREATE TYPE "public"."pending_listing_status" AS ENUM('pending', 'approved', 'declined');--> statement-breakpoint
CREATE TABLE "pending_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"message_id" integer,
	"agent_id" integer NOT NULL,
	"submitted_by" integer,
	"status" "pending_listing_status" DEFAULT 'pending' NOT NULL,
	"property_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "listed_by_agent_id" integer;--> statement-breakpoint
ALTER TABLE "pending_listings" ADD CONSTRAINT "pending_listings_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_listings" ADD CONSTRAINT "pending_listings_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_listings" ADD CONSTRAINT "pending_listings_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_listed_by_agent_id_agents_id_fk" FOREIGN KEY ("listed_by_agent_id") REFERENCES "public"."agents"("id") ON DELETE set null ON UPDATE no action;