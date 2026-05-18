CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"meeting_date" timestamp NOT NULL,
	"property_title" text NOT NULL,
	"property_address" text NOT NULL,
	"requester_username" text NOT NULL,
	"requester_phone" text,
	"requester_email" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
