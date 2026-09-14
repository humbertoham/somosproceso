import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/ui/Logo";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administración", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  if (await isAdminAuthenticated()) redirect("/admin");
  const { expired } = await searchParams;
  return <main className="login-page"><section className="login-card"><div className="admin-brand login-brand"><Logo href="/admin/login" /><small>Administración</small></div><p className="eyebrow">Acceso privado</p><h1>Bienvenida.</h1><p>Ingresa tus credenciales para administrar cursos y compras.</p>{expired && <p className="session-notice">Tu sesión terminó. Vuelve a ingresar.</p>}<Suspense fallback={null}><LoginForm /></Suspense><small className="login-security">Tu sesión se almacena de forma segura y se cierra automáticamente.</small></section></main>;
}
