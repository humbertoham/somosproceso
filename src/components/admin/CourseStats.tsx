import { formatPrice, remainingSeats, type Course } from "@/lib/utils";

export function CourseStats({ course, sales, revenue }: { course: Pick<Course, "capacity" | "currency">; sales: number; revenue: number }) {
  const seats = remainingSeats(course.capacity, sales);
  return <section className="stat-grid course-stats" aria-label="Resumen del curso">
    <article><span><strong>{course.capacity ?? "Sin límite definido"}</strong>Cupo máximo</span></article>
    <article><span><strong>{sales}</strong>Inscritos pagados</span></article>
    <article><span><strong>{seats === null ? "Sin límite definido" : seats === 0 ? "Agotado" : seats}</strong>Lugares disponibles</span></article>
    <article><span><strong>{formatPrice(revenue, course.currency)}</strong>Ingresos del curso</span></article>
  </section>;
}
