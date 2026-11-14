import { NextResponse } from "next/server";

import { adminRequestError, apiErrorResponse } from "@/lib/admin-api";
import { createCourse } from "@/lib/course-mutations";
import { revalidateCourses } from "@/lib/revalidate";

export async function POST(request: Request) {
  const denied = await adminRequestError(request);
  if (denied) return denied;
  try {
    const course = await createCourse(await request.json());
    revalidateCourses();
    return NextResponse.json({ id: course.id, message: "Curso creado" }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
