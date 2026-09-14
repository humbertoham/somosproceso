import { BookOpen, Edit3, Plus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdminCourses } from "@/db/queries";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Administrar cursos", robots: { index: false, follow: false } };

export default async function AdminCoursesPage() {
  const items = await getAdminCourses();
  return <><header className="admin-header"><div><p className="admin-eyebrow">Contenido</p><h1>Cursos</h1><p>Crea, publica y actualiza tus experiencias.</p></div><Link className="admin-button" href="/admin/cursos/nuevo"><Plus />Nuevo curso</Link></header>
    <section className="admin-card admin-list-card">{items.length ? <div className="admin-course-list"><div className="admin-course-head"><span>Curso</span><span>Estado</span><span>Precio</span><span>Fecha</span><span>Ventas</span><span /></div>{items.map(({ course, sales }) => <article key={course.id}><div className="admin-course-title"><div>{course.imageUrl ? <Image src={course.imageUrl} alt="" fill sizes="64px" /> : <BookOpen aria-hidden="true" />}</div><strong>{course.title}</strong></div><span data-label="Estado"><StatusBadge status={course.status} /></span><strong data-label="Precio">{formatPrice(course.priceCents, course.currency)}</strong><span data-label="Fecha">{formatDate(course.startDate) ?? "Por definir"}</span><span data-label="Ventas">{sales}</span><Link className="icon-button" href={`/admin/cursos/${course.id}`} aria-label={`Editar ${course.title}`}><Edit3 /></Link></article>)}</div> : <div className="admin-empty"><h2>Aún no hay cursos</h2><p>Crea el primero para comenzar a preparar tu catálogo.</p><Link className="admin-button" href="/admin/cursos/nuevo"><Plus />Nuevo curso</Link></div>}</section>
  </>;
}
