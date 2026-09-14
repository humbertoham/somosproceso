import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CourseForm } from "@/components/admin/CourseForm";

export const metadata: Metadata = { title: "Nuevo curso", robots: { index: false, follow: false } };

export default function NewCoursePage() {
  return <><header className="admin-header compact-header"><div><Link className="back-link" href="/admin/cursos"><ArrowLeft />Volver a cursos</Link><h1>Nuevo curso</h1><p>Completa la información. Puedes guardarlo como borrador.</p></div></header><CourseForm /></>;
}
