import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { courses } from "@/db/schema";
import { isAdminAuthenticated } from "@/lib/auth";
import { courseInputSchema } from "@/lib/validations/course";

function dbValues(input: unknown) {
  const parsed = courseInputSchema.parse(input);
  const { price, ...values } = parsed;
  return { ...values, priceCents: Math.round(price * 100), publishedAt: parsed.status === "published" ? new Date() : null, updatedAt: new Date() };
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Sesión expirada." }, { status: 401 });
  try {
    const [course] = await getDb().insert(courses).values(dbValues(await request.json())).returning({ id: courses.id });
    return NextResponse.json({ id: course.id, message: "Cambios guardados" }, { status: 201 });
  } catch (error) {
    const isDuplicate = typeof error === "object" && error !== null && "code" in error && error.code === "23505";
    return NextResponse.json({ error: isDuplicate ? "Ya existe un curso con ese slug." : "Revisa los campos del curso." }, { status: 400 });
  }
}
