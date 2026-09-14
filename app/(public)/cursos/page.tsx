import type { Metadata } from "next";

import { CourseCard } from "@/components/public/CourseCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPublishedCourses } from "@/db/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cursos", description: "Explora los cursos y talleres disponibles de Somos Proceso.", alternates: { canonical: "/cursos" } };

export default async function CoursesPage() {
  const items = await getPublishedCourses();
  return <div className="page-wrap"><header className="page-hero"><p className="eyebrow">Cursos y talleres</p><h1>Encuentros para comprenderte y conectar.</h1><p>Experiencias prácticas de desarrollo humano, inteligencia emocional y comunicación.</p></header>
    {items.length ? <div className="course-grid catalog-grid">{items.map(({ course, sales }) => <CourseCard key={course.id} course={course} sales={sales} />)}</div> : <EmptyState title="Aún no hay cursos publicados" description="Estamos preparando nuevas experiencias. Vuelve pronto para conocerlas." />}
  </div>;
}
