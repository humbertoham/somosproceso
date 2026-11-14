ALTER TABLE "courses" ALTER COLUMN "timezone" SET DEFAULT 'America/Monterrey';--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "stripe_checkout_session_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "source" varchar(60);--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "internal_reference" varchar(255);