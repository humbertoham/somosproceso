import { ArrowLeft, Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { CourseStats } from "@/components/admin/CourseStats";
import { PurchaseFilters } from "@/components/admin/PurchaseFilters";
import { PurchaseTable } from "@/components/admin/PurchaseTable";
import { getCourseStats, getPurchases } from "@/db/queries";
import { purchaseRows } from "@/lib/purchase-rows";
import { formatDate } from "@/lib/utils";
import { parsePurchaseFilters, purchaseFilterQuery, purchaseQueryFilters, type RawPurchaseFilterParams } from "@/lib/validations/purchase-filters";

export const metadata: Metadata = { title: "Compradores del curso", robots: { index: false, follow: false } };

export default async function CourseBuyersPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<RawPurchaseFilterParams> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const stats = await getCourseStats(id);
  if (!stats) notFound();
  const filters = parsePurchaseFilters({ ...await searchParams, course: id });
  const items = await getPurchases(purchaseQueryFilters(filters));
  const rows = purchaseRows(items);
  const filtered = Boolean(filters.q || filters.status || filters.follow);
  const { course } = stats;
  return <>
    <header className="admin-header"><div><Link className="back-link" href="/admin/cursos"><ArrowLeft />Volver a cursos</Link><h1>{course.title}</h1><p>Compradores · {formatDate(course.startDate, false, course.timezone) ?? "Fecha por definir"}</p></div><a className="admin-secondary-button" href={`/api/admin/purchases/export?${purchaseFilterQuery(filters)}`}><Download />Exportar CSV</a></header>
    <CourseStats course={course} sales={stats.sales} revenue={stats.revenue} />
    <PurchaseFilters params={filters} basePath={`/admin/cursos/${id}/compradores`} />
    <section className="admin-card admin-list-card">{rows.length ? <PurchaseTable initialRows={rows} /> : <div className="admin-empty"><h2>{filtered ? "No encontramos resultados con estos filtros." : "Todavía no hay compras para este curso."}</h2><p>{filtered ? "Prueba con otros filtros." : "Las inscripciones aparecerán aquí al recibir compras."}</p></div>}</section>
  </>;
}
