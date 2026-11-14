import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import { courses, purchases } from "@/db/schema";
import { ApiError } from "@/lib/admin-api";
import { deleteCourseImage, verifyCourseImage } from "@/lib/r2";
import { toCourseValues } from "@/lib/validations/course";

export const courseActionSchema = z.object({ action: z.enum(["publish", "unpublish", "archive"]) });

async function deleteUnusedImage(key: string | null) {
  if (!key) return;
  try {
    const [reference] = await getDb().select({ id: courses.id }).from(courses).where(eq(courses.imageKey, key)).limit(1);
    if (!reference) await deleteCourseImage(key);
  } catch { console.error("No se pudo limpiar una imagen de curso sin referencias en R2."); }
}

export async function createCourse(input: unknown) {
  const values = toCourseValues(input);
  const image = await verifyCourseImage(values.imageKey, values.imageUrl);
  const [course] = await getDb().insert(courses).values({
    ...values, ...image, publishedAt: values.status === "published" ? new Date() : null,
  }).returning();
  return course;
}

export async function updateCourse(id: string, input: unknown) {
  z.uuid().parse(id);
  const action = courseActionSchema.safeParse(input);
  const values = action.success ? null : toCourseValues(input);
  const result = await getDb().transaction(async (tx) => {
    const [existing] = await tx.select().from(courses).where(eq(courses.id, id)).for("update");
    if (!existing) throw new ApiError("Curso no encontrado.", 404);
    const status = action.success ? ({ publish: "published", unpublish: "draft", archive: "archived" } as const)[action.data.action] : values!.status;
    let image = { imageKey: existing.imageKey, imageUrl: existing.imageUrl };
    if (values && (values.imageKey !== existing.imageKey || values.imageUrl !== existing.imageUrl)) {
      image = await verifyCourseImage(values.imageKey, values.imageUrl);
    }
    const [course] = await tx.update(courses).set({
      ...values, ...image, status, updatedAt: new Date(),
      publishedAt: status === "published" ? existing.publishedAt ?? new Date() : existing.publishedAt,
    }).where(eq(courses.id, id)).returning();
    return { course, previousImageKey: existing.imageKey };
  });
  if (result.previousImageKey !== result.course.imageKey) await deleteUnusedImage(result.previousImageKey);
  return result.course;
}

export async function deleteCourse(id: string) {
  z.uuid().parse(id);
  const deleted = await getDb().transaction(async (tx) => {
    const [existing] = await tx.select().from(courses).where(eq(courses.id, id)).for("update");
    if (!existing) throw new ApiError("Curso no encontrado.", 404);
    const [purchase] = await tx.select({ id: purchases.id }).from(purchases).where(eq(purchases.courseId, id)).limit(1);
    if (purchase) throw new ApiError("Este curso tiene compras. Puedes archivarlo para conservar su historial.", 409);
    await tx.delete(courses).where(eq(courses.id, id));
    return existing;
  });
  await deleteUnusedImage(deleted.imageKey);
}

export async function duplicateCourse(id: string) {
  z.uuid().parse(id);
  return getDb().transaction(async (tx) => {
    const [existing] = await tx.select().from(courses).where(eq(courses.id, id)).for("update");
    if (!existing) throw new ApiError("Curso no encontrado.", 404);
    const { id: originalId, createdAt, updatedAt, ...content } = existing;
    void originalId; void createdAt; void updatedAt;
    const [course] = await tx.insert(courses).values({
      ...content, title: `${existing.title.slice(0, 172)} (copia)`,
      slug: `${existing.slug.slice(0, 130).replace(/-$/, "")}-copia-${crypto.randomUUID()}`,
      status: "draft", startDate: null, endDate: null, publishedAt: null,
    }).returning();
    return course;
  });
}
