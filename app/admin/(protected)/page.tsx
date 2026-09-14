import { ArrowRight, BookOpen, CircleDollarSign, MailWarning, Plus, ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { getDashboardData } from "@/db/queries";
import { formatDate, formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Resumen administrativo", robots: { index: false, follow: false } };

export default async function AdminDashboard() {
  const data = await getDashboardData();
  return <><header className="admin-header"><div><p className="admin-eyebrow">Panel administrativo</p><h1>Resumen</h1><p>Lo esencial para dar seguimiento al negocio.</p></div><Link className="admin-button" href="/admin/cursos/nuevo"><Plus />Nuevo curso</Link></header>
    <section className="stat-grid" aria-label="Indicadores"><article><BookOpen /><span><strong>{data.published}</strong>Cursos publicados</span></article><article><ShoppingBag /><span><strong>{data.paid}</strong>Compras pagadas</span></article><article className={data.followUp ? "attention" : ""}><MailWarning /><span><strong>{data.followUp}</strong>Pendientes de seguimiento</span></article><article><CircleDollarSign /><span><strong>{formatPrice(data.revenue)}</strong>Ingresos registrados</span></article></section>
    <section className="admin-card"><div className="admin-card-title"><div><h2>Compras recientes</h2><p>Pagos confirmados más recientes.</p></div><Link href="/admin/compras">Ver compras <ArrowRight /></Link></div>{data.recent.length ? <div className="recent-list">{data.recent.map(({ purchase, courseTitle }) => <article key={purchase.id}><span className={purchase.emailSent ? "follow-dot sent" : "follow-dot"} /><div><strong>{purchase.buyerName}</strong><small>{courseTitle} · {formatDate(purchase.createdAt, true)}</small></div><b>{formatPrice(purchase.amountCents, purchase.currency)}</b></article>)}</div> : <p className="admin-empty">Todavía no hay compras pagadas.</p>}</section>
    <section className="quick-links"><Link href="/admin/cursos/nuevo"><Plus />Crear un curso</Link><Link href="/admin/cursos"><BookOpen />Administrar cursos</Link><Link href="/admin/compras"><ShoppingBag />Dar seguimiento</Link></section>
  </>;
}
