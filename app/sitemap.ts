import type { MetadataRoute } from "next";

import { getPublishedCourses } from "@/db/queries";
import { getSiteUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const staticPaths = ["", "/cursos", "/nosotros", "/faq", "/aviso-de-privacidad", "/terminos"];
  const courseItems = await getPublishedCourses();
  return [...staticPaths.map((path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "" || path === "/cursos" ? "weekly" as const : "monthly" as const, priority: path === "" ? 1 : .7 })), ...courseItems.map(({ course }) => ({ url: `${base}/cursos/${course.slug}`, lastModified: course.updatedAt, changeFrequency: "weekly" as const, priority: .8 }))];
}
