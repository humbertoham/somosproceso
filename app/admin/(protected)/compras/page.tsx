import { Download } from "lucide-react";
import type { Metadata } from "next";

import { PurchaseFilters } from "@/components/admin/PurchaseFilters";
import { PurchaseTable } from "@/components/admin/PurchaseTable";
import { getAdminCourses, getPurchases } from "@/db/queries";
import { purchaseRows } from "@/lib/purchase-rows";
import { parsePurchaseFilters, purchaseFilterQuery, purchaseQueryFilters, type RawPurchaseFilterParams } from "@/lib/validations/purchase-filters";

export const metadata: Metadata = { title: "Compras", robots: { index: false, follow: false } };

export default async function PurchasesPage({ searchParams }: { searchParams: Promise<RawPurchaseFilterParams> }) {
  const filters = parsePurchaseFilters(await searchParams);
  const [items, courseItems] = await Promise.all([getPurchases(purchaseQueryFilters(filters)), getAdminCourses()]);
  const rows = purchaseRows(items);
  const filtered = Object.values(filters).some(Boolean);
  return <>
    <header className="admin-header"><div><p className="admin-eyebrow">Seguimiento</p><h1>Compras</h1><p>Revisa pagos y registra el envío manual de la información del curso.</p></div><a className="admin-secondary-button" href={`/api/admin/purchases/export?${purchaseFilterQuery(filters)}`}><Download />Exportar CSV</a></header>
    <PurchaseFilters params={filters} courses={courseItems.map(({ course }) => ({ id: course.id, title: course.title }))} />
    <section className="admin-card admin-list-card">{rows.length ? <PurchaseTable initialRows={rows} /> : <div className="admin-empty"><h2>{filtered ? "No encontramos resultados con estos filtros." : "Todavía no hay compras."}</h2><p>{filtered ? "Prueba con otros filtros." : "Las compras aparecerán aquí cuando se registren inscripciones."}</p></div>}</section>
  </>;
}
