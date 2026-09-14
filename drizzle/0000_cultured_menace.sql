CREATE TYPE "public"."course_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."course_modality" AS ENUM('online', 'in_person', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'expired', 'refunded');--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(180) NOT NULL,
	"title" varchar(180) NOT NULL,
	"short_description" varchar(320) NOT NULL,
	"description" text NOT NULL,
	"image_key" text,
	"image_url" text,
	"price_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'MXN' NOT NULL,
	"status" "course_status" DEFAULT 'draft' NOT NULL,
	"modality" "course_modality" DEFAULT 'online' NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"time_text" varchar(120),
	"timezone" varchar(80) DEFAULT 'America/Mexico_City' NOT NULL,
	"duration_text" varchar(120),
	"facilitators" text,
	"target_audience" text,
	"learning_outcomes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"includes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"additional_info" text,
	"capacity" integer,
	"sales_open" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"stripe_checkout_session_id" varchar(255) NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"stripe_customer_id" varchar(255),
	"buyer_name" varchar(180) DEFAULT '' NOT NULL,
	"buyer_email" varchar(320) DEFAULT '' NOT NULL,
	"buyer_phone" varchar(60),
	"amount_cents" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp with time zone,
	"email_sent" boolean DEFAULT false NOT NULL,
	"email_sent_at" timestamp with time zone,
	"admin_notes" text,
	"terms_accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stripe_event_id" varchar(255) NOT NULL,
	"event_type" varchar(120) NOT NULL,
	"processed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "courses_slug_idx" ON "courses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "courses_status_idx" ON "courses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "courses_start_date_idx" ON "courses" USING btree ("start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "purchases_checkout_session_idx" ON "purchases" USING btree ("stripe_checkout_session_id");--> statement-breakpoint
CREATE INDEX "purchases_course_id_idx" ON "purchases" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "purchases_email_idx" ON "purchases" USING btree ("buyer_email");--> statement-breakpoint
CREATE INDEX "purchases_created_at_idx" ON "purchases" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "purchases_payment_status_idx" ON "purchases" USING btree ("payment_status");--> statement-breakpoint
CREATE UNIQUE INDEX "stripe_events_event_id_idx" ON "stripe_events" USING btree ("stripe_event_id");