import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

export const courseStatusEnum = pgEnum("course_status", ["draft", "published", "archived"]);
export const modalityEnum = pgEnum("course_modality", ["online", "in_person", "hybrid"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "expired", "refunded"]);

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 180 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  shortDescription: varchar("short_description", { length: 320 }).notNull(),
  description: text("description").notNull(),
  imageKey: text("image_key"),
  imageUrl: text("image_url"),
  priceCents: integer("price_cents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("MXN"),
  status: courseStatusEnum("status").notNull().default("draft"),
  modality: modalityEnum("modality").notNull().default("online"),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  timeText: varchar("time_text", { length: 120 }),
  timezone: varchar("timezone", { length: 80 }).notNull().default("America/Mexico_City"),
  durationText: varchar("duration_text", { length: 120 }),
  facilitators: text("facilitators"),
  targetAudience: text("target_audience"),
  learningOutcomes: jsonb("learning_outcomes").$type<string[]>().notNull().default([]),
  includes: jsonb("includes").$type<string[]>().notNull().default([]),
  additionalInfo: text("additional_info"),
  capacity: integer("capacity"),
  salesOpen: boolean("sales_open").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("courses_slug_idx").on(table.slug),
  index("courses_status_idx").on(table.status),
  index("courses_start_date_idx").on(table.startDate),
]);

export const purchases = pgTable("purchases", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "restrict" }),
  stripeCheckoutSessionId: varchar("stripe_checkout_session_id", { length: 255 }).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  buyerName: varchar("buyer_name", { length: 180 }).notNull().default(""),
  buyerEmail: varchar("buyer_email", { length: 320 }).notNull().default(""),
  buyerPhone: varchar("buyer_phone", { length: 60 }),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  emailSent: boolean("email_sent").notNull().default(false),
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  adminNotes: text("admin_notes"),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("purchases_checkout_session_idx").on(table.stripeCheckoutSessionId),
  index("purchases_course_id_idx").on(table.courseId),
  index("purchases_email_idx").on(table.buyerEmail),
  index("purchases_created_at_idx").on(table.createdAt),
  index("purchases_payment_status_idx").on(table.paymentStatus),
]);

export const stripeEvents = pgTable("stripe_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  stripeEventId: varchar("stripe_event_id", { length: 255 }).notNull(),
  eventType: varchar("event_type", { length: 120 }).notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("stripe_events_event_id_idx").on(table.stripeEventId)]);
