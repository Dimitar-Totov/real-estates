CREATE TABLE "sold_properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_name" text NOT NULL,
	"agent" text NOT NULL,
	"buyer" text NOT NULL,
	"dateof_buying" timestamp NOT NULL
);
