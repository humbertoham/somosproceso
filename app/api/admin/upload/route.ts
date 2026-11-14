import { NextResponse } from "next/server";

import { adminRequestError, ApiError } from "@/lib/admin-api";
import { uploadCourseImage } from "@/lib/r2";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const denied = await adminRequestError(request);
  if (denied) return denied;
  if (Number(request.headers.get("content-length")) > 5 * 1024 * 1024 + 64 * 1024) return NextResponse.json({ error: "La imagen no puede superar 5 MB." }, { status: 413 });
  try {
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Selecciona una imagen." }, { status: 400 });
    return NextResponse.json(await uploadCourseImage(file));
  } catch (error) {
    return NextResponse.json({ error: error instanceof ApiError ? error.message : "Error al subir imagen. Revisa la configuración de Cloudflare R2 e inténtalo de nuevo." }, { status: error instanceof ApiError ? error.status : 502 });
  }
}
