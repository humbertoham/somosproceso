import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { courses } from "@/db/schema";
import { isAdminAuthenticated } from "@/lib/auth";
import { deleteCourseImage } from "@/lib/r2";
import { courseInputSchema } from "@/lib/validations/course";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Sesión expirada." }, { status: 401 });
  try {
    const { id } = await params;
    const parsed = courseInputSchema.parse(await request.json());
    const [existing] = await getDb().select().from(courses).where(eq(courses.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: "Curso no encontrado." }, { status: 404 });
    const { price, ...values } = parsed;
    await getDb().update(courses).set({
      ...values,
      priceCents: Math.round(price * 100),
      publishedAt: parsed.status === "published" ? existing.publishedAt ?? new Date() : existing.publishedAt,
      updatedAt: new Date(),
    }).where(eq(courses.id, id));
    if (existing.imageKey && parsed.imageKey && existing.imageKey !== parsed.imageKey) await deleteCourseImage(existing.imageKey).catch(() => undefined);
    return NextResponse.json({ message: parsed.status === "published" && existing.status !== "published" ? "Curso publicado" : "Cambios guardados" });
  } catch (error) {
    const isDuplicate = typeof error === "object" && error !== null && "code" in error && error.code === "23505";
    return NextResponse.json({ error: isDuplicate ? "Ya existe un curso con ese slug." : "Revisa los campos del curso." }, { status: 400 });
  }
}
