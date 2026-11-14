import { NextResponse } from "next/server";

import { adminRequestError, apiErrorResponse } from "@/lib/admin-api";
import { duplicateCourse } from "@/lib/course-mutations";
import { revalidateCourses } from "@/lib/revalidate";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await adminRequestError(request);
  if (denied) return denied;
  try {
    const course = await duplicateCourse((await params).id);
    revalidateCourses();
    return NextResponse.json({ id: course.id, message: "Curso duplicado como borrador" }, { status: 201 });
  } catch (error) { return apiErrorResponse(error); }
}
