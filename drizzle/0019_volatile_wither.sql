CREATE TYPE "public"."transaction_type" AS ENUM('bought', 'rented');--> statement-breakpoint
ALTER TABLE "sold_properties" ADD COLUMN "transaction_type" "transaction_type" DEFAULT 'bought' NOT NULL;