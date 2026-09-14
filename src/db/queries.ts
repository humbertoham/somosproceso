import "server-only";

import { and, asc, count, desc, eq, gte, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { cache } from "react";

import { getDb } from "@/db";
import { courses, purchases } from "@/db/schema";
import { hasDatabase } from "@/lib/env";

export async function getPublishedCourses(limit?: number) {
  if (!hasDatabase()) return [];
  const query = getDb().select({ course: courses, sales: count(purchases.id) }).from(courses)
    .leftJoin(purchases, and(eq(purchases.courseId, courses.id), eq(purchases.paymentStatus, "paid")))
    .where(eq(courses.status, "published")).groupBy(courses.id)
    .orderBy(asc(sql`${courses.startDate} nulls last`), desc(courses.createdAt));
  return limit ? query.limit(limit) : query;
}

export async function getUpcomingCourses(limit = 3) {
  if (!hasDatabase()) return [];
  return getDb().select({ course: courses, sales: count(purchases.id) }).from(courses)
    .leftJoin(purchases, and(eq(purchases.courseId, courses.id), eq(purchases.paymentStatus, "paid")))
    .where(and(eq(courses.status, "published"), or(isNull(courses.startDate), gte(courses.startDate, new Date()))))
    .groupBy(courses.id).orderBy(asc(sql`${courses.startDate} nulls last`), desc(courses.createdAt)).limit(limit);
}

export const getPublishedCourseBySlug = cache(async (slug: string) => {
  if (!hasDatabase()) return null;
  const [result] = await getDb().select({ course: courses, sales: count(purchases.id) }).from(courses)
    .leftJoin(purchases, and(eq(purchases.courseId, courses.id), eq(purchases.paymentStatus, "paid")))
    .where(and(eq(courses.slug, slug), eq(courses.status, "published"))).groupBy(courses.id).limit(1);
  return result ?? null;
});

export async function getCourseById(id: string) {
  if (!hasDatabase()) return null;
  const [course] = await getDb().select().from(courses).where(eq(courses.id, id)).limit(1);
  return course ?? null;
}

export async function getAdminCourses() {
  if (!hasDatabase()) return [];
  return getDb().select({ course: courses, sales: count(purchases.id) }).from(courses)
    .leftJoin(purchases, and(eq(purchases.courseId, courses.id), eq(purchases.paymentStatus, "paid")))
    .groupBy(courses.id).orderBy(desc(courses.createdAt));
}

export async function getDashboardData() {
  if (!hasDatabase()) return { published: 0, paid: 0, followUp: 0, revenue: 0, recent: [] };
  const db = getDb();
  const [[courseStats], [purchaseStats], recent] = await Promise.all([
    db.select({ value: count() }).from(courses).where(eq(courses.status, "published")),
    db.select({ paid: count(), revenue: sql<number>`coalesce(sum(${purchases.amountCents}), 0)::int`, followUp: sql<number>`count(*) filter (where ${purchases.emailSent} = false)::int` })
      .from(purchases).where(eq(purchases.paymentStatus, "paid")),
    db.select({ purchase: purchases, courseTitle: courses.title }).from(purchases).innerJoin(courses, eq(purchases.courseId, courses.id))
      .where(eq(purchases.paymentStatus, "paid")).orderBy(desc(purchases.createdAt)).limit(5),
  ]);
  return { published: courseStats.value, paid: purchaseStats.paid, followUp: purchaseStats.followUp, revenue: purchaseStats.revenue, recent };
}

export type PurchaseFilters = { search?: string; courseId?: string; status?: string; followUp?: string };

export async function getPurchases(filters: PurchaseFilters = {}) {
  if (!hasDatabase()) return [];
  const conditions = [];
  if (filters.search) conditions.push(or(ilike(purchases.buyerName, `%${filters.search}%`), ilike(purchases.buyerEmail, `%${filters.search}%`))!);
  if (filters.courseId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(filters.courseId)) conditions.push(eq(purchases.courseId, filters.courseId));
  if (filters.status && ["pending", "paid", "failed", "expired", "refunded"].includes(filters.status)) {
    conditions.push(eq(purchases.paymentStatus, filters.status as "pending" | "paid" | "failed" | "expired" | "refunded"));
  }
  if (filters.followUp === "pending") conditions.push(and(eq(purchases.paymentStatus, "paid"), eq(purchases.emailSent, false))!);
  if (filters.followUp === "sent") conditions.push(eq(purchases.emailSent, true));
  return getDb().select({ purchase: purchases, courseTitle: courses.title }).from(purchases)
    .innerJoin(courses, eq(purchases.courseId, courses.id))
    .where(conditions.length ? and(...conditions) : undefined).orderBy(desc(purchases.createdAt));
}

export async function countPaidSales(courseIds: string[]) {
  if (!hasDatabase() || !courseIds.length) return new Map<string, number>();
  const rows = await getDb().select({ courseId: purchases.courseId, sales: count() }).from(purchases)
    .where(and(inArray(purchases.courseId, courseIds), eq(purchases.paymentStatus, "paid"))).groupBy(purchases.courseId);
  return new Map(rows.map((row) => [row.courseId, row.sales]));
}
