import { Download, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PurchaseTable, type PurchaseRow } from "@/components/admin/PurchaseTable";
import { getAdminCourses, getPurchases } from "@/db/queries";

export const metadata: Metadata = { title: "Compras", robots: { index: false, follow: false } };

export default async function PurchasesPage({ searchParams }: { searchParams: Promise<{ q?: string; course?: string; status?: string; follow?: string }> }) {
  const params = await searchParams;
  const [items, courseItems] = await Promise.all([getPurchases({ search: params.q, courseId: params.course, status: params.status, followUp: params.follow }), getAdminCourses()]);
  const rows: PurchaseRow[] = items.map(({ purchase, courseTitle }) => ({
    id: purchase.id,
    createdAt: purchase.createdAt.toISOString(),
    buyerName: purchase.buyerName,
    buyerEmail: purchase.buyerEmail,
    buyerPhone: purchase.buyerPhone,
    courseTitle,
    amountCents: purchase.amountCents,
    currency: purchase.currency,
    paymentStatus: purchase.paymentStatus,
    emailSent: purchase.emailSent,
    emailSentAt: purchase.emailSentAt?.toISOString() ?? null,
    adminNotes: purchase.adminNotes,
  }));
  return <><header className="admin-header"><div><p className="admin-eyebrow">Seguimiento</p><h1>Compras</h1><p>Confirma pagos y registra el envío manual de accesos.</p></div><Link className="admin-secondary-button" href="/api/admin/purchases/export" prefetch={false}><Download />Exportar CSV</Link></header>
    <form className="purchase-filters" method="get"><label className="search-field"><Search /><span className="sr-only">Buscar por nombre o correo</span><input name="q" defaultValue={params.q} placeholder="Buscar nombre o correo" /></label><label><span className="sr-only">Curso</span><select name="course" defaultValue={params.course ?? ""}><option value="">Todos los cursos</option>{courseItems.map(({ course }) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label><label><span className="sr-only">Estado de pago</span><select name="status" defaultValue={params.status ?? ""}><option value="">Todos los pagos</option><option value="paid">Pagado</option><option value="pending">Pendiente</option><option value="failed">Fallido</option><option value="expired">Expirado</option><option value="refunded">Reembolsado</option></select></label><label><span className="sr-only">Seguimiento</span><select name="follow" defaultValue={params.follow ?? ""}><option value="">Todo el seguimiento</option><option value="pending">Correo pendiente</option><option value="sent">Correo enviado</option></select></label><button className="filter-button" type="submit">Filtrar</button>{Object.values(params).some(Boolean) && <Link href="/admin/compras">Limpiar</Link>}</form>
    <section className="admin-card admin-list-card">{rows.length ? <PurchaseTable initialRows={rows} /> : <div className="admin-empty"><h2>No encontramos compras</h2><p>Prueba con otros filtros o espera a que llegue una nueva compra.</p></div>}</section>
  </>;
}
