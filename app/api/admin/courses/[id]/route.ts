import { NextResponse } from "next/server";

import { adminRequestError, apiErrorResponse } from "@/lib/admin-api";
import { deleteCourse, updateCourse } from "@/lib/course-mutations";
import { revalidateCourses } from "@/lib/revalidate";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminRequestError(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    await updateCourse(id, await request.json());
    revalidateCourses();
    return NextResponse.json({ message: "Cambios guardados" });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminRequestError(request);
  if (denied) return denied;
  try {
    await deleteCourse((await params).id);
    revalidateCourses();
    return NextResponse.json({ message: "Curso eliminado" });
  } catch (error) { return apiErrorResponse(error); }
}
