import "server-only";

import { and, count, desc, eq, gte, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { cache } from "react";

import { getDb } from "@/db";
import { courses, purchases } from "@/db/schema";
import { hasDatabase } from "@/lib/env";
import { requireAdmin } from "@/lib/auth";

export async function getPublishedCourses(limit?: number) {
  if (!hasDatabase()) return [];
  const query = getDb().select({ course: courses, sales: count(purchases.id) }).from(courses)
    .leftJoin(purchases, and(eq(purchases.courseId, courses.id), eq(purchases.paymentStatus, "paid")))
    .where(eq(courses.status, "published")).groupBy(courses.id)
    .orderBy(sql`${courses.startDate} asc nulls last`, desc(courses.createdAt));
  return limit ? query.limit(limit) : query;
}

export async function getUpcomingCourses(limit = 3) {
  if (!hasDatabase()) return [];
  return getDb().select({ course: courses, sales: count(purchases.id) }).from(courses)
    .leftJoin(purchases, and(eq(purchases.courseId, courses.id), eq(purchases.paymentStatus, "paid")))
    .where(and(eq(courses.status, "published"), or(isNull(courses.startDate), gte(courses.startDate, new Date()))))
    .groupBy(courses.id).orderBy(sql`${courses.startDate} asc nulls last`, desc(courses.createdAt)).limit(limit);
}

export const getPublishedCourseBySlug = cache(async (slug: string) => {
  if (!hasDatabase()) return null;
  const [result] = await getDb().select({ course: courses, sales: count(purchases.id) }).from(courses)
    .leftJoin(purchases, and(eq(purchases.courseId, courses.id), eq(purchases.paymentStatus, "paid")))
    .where(and(eq(courses.slug, slug), eq(courses.status, "published"))).groupBy(courses.id).limit(1);
  return result ?? null;
});

export async function getCourseById(id: string) {
  await requireAdmin();
  if (!hasDatabase()) return null;
  const [course] = await getDb().select().from(courses).where(eq(courses.id, id)).limit(1);
  return course ?? null;
}

export async function getAdminCourses() {
  await requireAdmin();
  if (!hasDatabase()) return [];
  return getDb().select(adminCourseSelection).from(courses)
    .leftJoin(purchases, eq(purchases.courseId, courses.id))
    .groupBy(courses.id).orderBy(desc(courses.createdAt));
}

const adminCourseSelection = {
  course: courses,
  sales: sql<number>`count(${purchases.id}) filter (where ${purchases.paymentStatus} = 'paid')`.mapWith(Number),
  purchaseCount: count(purchases.id),
  revenue: sql<number>`coalesce(sum(${purchases.amountCents}) filter (where ${purchases.paymentStatus} = 'paid'), 0)`.mapWith(Number),
};

export async function getCourseStats(id: string) {
  await requireAdmin();
  if (!hasDatabase()) return null;
  const [result] = await getDb().select(adminCourseSelection).from(courses)
    .leftJoin(purchases, eq(purchases.courseId, courses.id))
    .where(eq(courses.id, id)).groupBy(courses.id).limit(1);
  return result ?? null;
}

export async function getDashboardData() {
  await requireAdmin();
  if (!hasDatabase()) return { published: 0, paid: 0, followUp: 0, revenue: 0, recent: [] };
  const db = getDb();
  const [[courseStats], [purchaseStats], recent] = await Promise.all([
    db.select({ value: count() }).from(courses).where(eq(courses.status, "published")),
    db.select({ paid: count(), revenue: sql<number>`coalesce(sum(${purchases.amountCents}), 0)`.mapWith(Number), followUp: sql<number>`count(*) filter (where ${purchases.emailSent} = false)`.mapWith(Number) })
      .from(purchases).where(eq(purchases.paymentStatus, "paid")),
    db.select({ purchase: purchases, courseTitle: courses.title }).from(purchases).innerJoin(courses, eq(purchases.courseId, courses.id))
      .orderBy(desc(purchases.createdAt)).limit(5),
  ]);
  return { published: courseStats.value, paid: purchaseStats.paid, followUp: purchaseStats.followUp, revenue: purchaseStats.revenue, recent };
}

export type PurchaseFilters = { search?: string; courseId?: string; status?: string; followUp?: string };

export async function getPurchases(filters: PurchaseFilters = {}) {
  await requireAdmin();
  if (!hasDatabase()) return [];
  const conditions = [];
  if (filters.search) {
    const pattern = `%${filters.search.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(or(ilike(purchases.buyerName, pattern), ilike(purchases.buyerEmail, pattern), ilike(purchases.buyerPhone, pattern))!);
  }
  if (filters.courseId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(filters.courseId)) conditions.push(eq(purchases.courseId, filters.courseId));
  if (filters.status && ["pending", "paid", "failed", "expired", "refunded"].includes(filters.status)) {
    conditions.push(eq(purchases.paymentStatus, filters.status as "pending" | "paid" | "failed" | "expired" | "refunded"));
  }
  if (filters.followUp === "pending") conditions.push(eq(purchases.emailSent, false));
  if (filters.followUp === "sent") conditions.push(eq(purchases.emailSent, true));
  return getDb().select({ purchase: purchases, course: courses }).from(purchases)
    .innerJoin(courses, eq(purchases.courseId, courses.id))
    .where(conditions.length ? and(...conditions) : undefined).orderBy(desc(purchases.createdAt));
}

export async function countPaidSales(courseIds: string[]) {
  await requireAdmin();
  if (!hasDatabase() || !courseIds.length) return new Map<string, number>();
  const rows = await getDb().select({ courseId: purchases.courseId, sales: count() }).from(purchases)
    .where(and(inArray(purchases.courseId, courseIds), eq(purchases.paymentStatus, "paid"))).groupBy(purchases.courseId);
  return new Map(rows.map((row) => [row.courseId, row.sales]));
}
