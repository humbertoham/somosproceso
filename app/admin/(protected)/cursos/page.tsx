import { BookOpen, Plus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CourseActions } from "@/components/admin/CourseActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdminCourses } from "@/db/queries";
import { courseAvailability, formatDate, formatPrice, remainingSeats } from "@/lib/utils";

export const metadata: Metadata = { title: "Administrar cursos", robots: { index: false, follow: false } };

export default async function AdminCoursesPage() {
  const items = await getAdminCourses();
  return <>
    <header className="admin-header"><div><p className="admin-eyebrow">Contenido</p><h1>Cursos</h1><p>Crea, publica y actualiza tus experiencias.</p></div><Link className="admin-button" href="/admin/cursos/nuevo"><Plus />Nuevo curso</Link></header>
    <section className="admin-card admin-list-card">
      {items.length ? <table className="admin-courses-table">
        <thead><tr><th>Curso</th><th>Estado y ventas</th><th>Precio</th><th>Cupo</th><th>Inscritos</th><th>Disponibles</th><th>Acciones</th></tr></thead>
        <tbody>{items.map(({ course, sales, purchaseCount }) => {
          const availability = courseAvailability(course, sales);
          const seats = remainingSeats(course.capacity, sales);
          return <tr key={course.id}>
            <td data-label="Curso"><div className="admin-course-title"><div>{course.imageUrl ? <Image src={course.imageUrl} alt="" fill sizes="64px" /> : <BookOpen aria-hidden="true" />}</div><span><strong>{course.title}</strong><small>{formatDate(course.startDate, false, course.timezone) ?? "Fecha por definir"}</small></span></div></td>
            <td data-label="Estado y ventas"><StatusBadge status={course.status} /><small>{course.salesOpen ? "Ventas abiertas" : "Ventas cerradas"}</small><small>{availability.label}</small></td>
            <td data-label="Precio">{formatPrice(course.priceCents, course.currency)}</td>
            <td data-label="Cupo">{course.capacity ?? "Sin límite definido"}</td>
            <td data-label="Inscritos">{sales}</td>
            <td data-label="Disponibles">{seats === null ? "Sin límite definido" : seats === 0 ? "Agotado" : seats}</td>
            <td data-label="Acciones"><CourseActions id={course.id} status={course.status} purchaseCount={purchaseCount} /></td>
          </tr>;
        })}</tbody>
      </table> : <div className="admin-empty"><h2>No hay cursos todavía.</h2><p>Crea el primero para comenzar a preparar tu catálogo.</p><Link className="admin-button" href="/admin/cursos/nuevo"><Plus />Nuevo curso</Link></div>}
    </section>
  </>;
}
