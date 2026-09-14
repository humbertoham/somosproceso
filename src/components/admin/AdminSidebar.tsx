import { BookOpen, ExternalLink, LayoutDashboard, LogOut, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/ui/Logo";

export function AdminSidebar() {
  return <aside className="admin-sidebar"><div className="admin-brand"><Logo href="/admin" light /><small>Administración</small></div>
    <nav aria-label="Administración"><Link href="/admin"><LayoutDashboard />Resumen</Link><Link href="/admin/cursos"><BookOpen />Cursos</Link><Link href="/admin/compras"><ShoppingBag />Compras</Link><Link href="/" target="_blank"><ExternalLink />Ver sitio</Link></nav>
    <form action="/api/admin/logout" method="post"><button type="submit"><LogOut />Cerrar sesión</button></form>
  </aside>;
}
