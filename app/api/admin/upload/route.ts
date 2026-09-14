import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/auth";
import { uploadCourseImage } from "@/lib/r2";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Sesión expirada." }, { status: 401 });
  try {
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Selecciona una imagen." }, { status: 400 });
    return NextResponse.json(await uploadCourseImage(file));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No fue posible subir la imagen." }, { status: 400 });
  }
}
