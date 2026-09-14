import { ArrowLeft, CircleX } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Compra cancelada", robots: { index: false, follow: false } };

export default async function CanceledPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const { course } = await searchParams;
  const href = course && /^[a-z0-9-]+$/.test(course) ? `/cursos/${course}` : "/cursos";
  return <div className="result-page"><div className="result-card compact"><CircleX className="result-icon muted-icon" /><p className="eyebrow">Compra cancelada</p><h1>No se realizó ningún cargo.</h1><p>Puedes volver al curso cuando quieras. Si encontraste algún problema durante el pago, escríbenos para orientarte.</p><Button href={href}><ArrowLeft size={17} /> Regresar al curso</Button></div></div>;
}
