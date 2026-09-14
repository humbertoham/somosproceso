import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { CourseForm } from "@/components/admin/CourseForm";
import { getCourseById } from "@/db/queries";

export const metadata: Metadata = { title: "Editar curso", robots: { index: false, follow: false } };

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; if (!z.string().uuid().safeParse(id).success) notFound();
  const course = await getCourseById(id); if (!course) notFound();
  return <><header className="admin-header compact-header"><div><Link className="back-link" href="/admin/cursos"><ArrowLeft />Volver a cursos</Link><h1>Editar curso</h1><p>Última actualización: {new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(course.updatedAt)}</p></div>{course.status === "published" && <Link className="admin-secondary-button" href={`/cursos/${course.slug}`} target="_blank">Ver publicado <ExternalLink /></Link>}</header><CourseForm course={course} /></>;
}
