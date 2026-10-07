CREATE TABLE "talent_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"trade" text NOT NULL,
	"about" text DEFAULT '' NOT NULL,
	"sector" text DEFAULT '' NOT NULL,
	"availability" text DEFAULT '' NOT NULL,
	"whatsapp" text NOT NULL,
	"edit_token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "category" text DEFAULT 'otros' NOT NULL;--> statement-breakpoint
CREATE INDEX "talent_expires_idx" ON "talent_profiles" USING btree ("expires_at");