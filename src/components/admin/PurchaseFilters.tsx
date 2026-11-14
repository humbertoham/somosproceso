import { Search } from "lucide-react";
import Link from "next/link";

import type { PurchaseFilterParams } from "@/lib/validations/purchase-filters";

export function PurchaseFilters({ params, courses, basePath = "/admin/compras" }: { params: PurchaseFilterParams; courses?: { id: string; title: string }[]; basePath?: string }) {
  const active = Boolean(params.q || params.status || params.follow || (courses && params.course));
  return <form className="purchase-filters" method="get" action={basePath}>
    <label className="search-field"><Search /><span className="sr-only">Buscar por nombre, correo o teléfono</span><input name="q" defaultValue={params.q} placeholder="Nombre, correo o teléfono" maxLength={200} /></label>
    {courses && <label><span className="sr-only">Curso</span><select name="course" defaultValue={params.course}><option value="">Todos los cursos</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>}
    <label><span className="sr-only">Estado de pago</span><select name="status" defaultValue={params.status}><option value="">Todos los pagos</option><option value="paid">Pagado</option><option value="pending">Pendiente</option><option value="failed">Fallido</option><option value="expired">Expirado</option><option value="refunded">Reembolsado</option></select></label>
    <label><span className="sr-only">Estado del correo</span><select name="follow" defaultValue={params.follow}><option value="">Todos los correos</option><option value="pending">Correo pendiente</option><option value="sent">Correo enviado</option></select></label>
    <button className="filter-button" type="submit">Filtrar</button>
    {active && <Link href={basePath}>Limpiar</Link>}
  </form>;
}
