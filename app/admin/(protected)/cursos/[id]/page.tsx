import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { CourseForm } from "@/components/admin/CourseForm";
import { CourseActions } from "@/components/admin/CourseActions";
import { CourseStats } from "@/components/admin/CourseStats";
import { getCourseStats } from "@/db/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Editar curso", robots: { index: false, follow: false } };

export default async function EditCoursePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params; if (!z.string().uuid().safeParse(id).success) notFound();
  const result = await getCourseStats(id); if (!result) notFound();
  const { course, sales, revenue, purchaseCount } = result;
  const { created } = await searchParams;
  return <><header className="admin-header compact-header"><div><Link className="back-link" href="/admin/cursos"><ArrowLeft />Volver a cursos</Link><h1>Editar curso</h1><p>Última actualización: {formatDate(course.updatedAt, true, course.timezone)}</p></div>{course.status === "published" && <Link className="admin-secondary-button" href={`/cursos/${course.slug}`} target="_blank" rel="noopener noreferrer">Ver publicado <ExternalLink /></Link>}</header>
    <CourseStats course={course} sales={sales} revenue={revenue} />
    <div className="course-edit-actions"><CourseActions id={id} status={course.status} purchaseCount={purchaseCount} showEdit={false} /></div>
    <CourseForm key={course.id} course={course} created={created === "1"} />
  </>;
}
