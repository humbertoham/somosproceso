import "server-only";

import { revalidatePath } from "next/cache";

export function revalidateAdmin() {
  revalidatePath("/admin", "layout");
}

export function revalidateCourses() {
  revalidateAdmin();
  revalidatePath("/");
  revalidatePath("/cursos");
  revalidatePath("/cursos/[slug]", "page");
  revalidatePath("/sitemap.xml");
}
