import type { Metadata } from "next";

import { FAQAccordion } from "@/components/public/FAQAccordion";
import { Button } from "@/components/ui/Button";
import { faqs } from "@/content/faq";

export const metadata: Metadata = { title: "Preguntas frecuentes", description: "Respuestas sobre cursos, pagos y acceso.", alternates: { canonical: "/faq" } };

export default function FAQPage() {
  return <div className="page-wrap narrow-page"><header className="page-hero"><p className="eyebrow">Preguntas frecuentes</p><h1>Lo que necesitas saber.</h1><p>Información clara para elegir y participar con tranquilidad.</p></header><FAQAccordion items={faqs} /><section className="inline-cta"><div><p className="eyebrow">¿Tienes otra pregunta?</p><h2>Estamos para orientarte.</h2></div><Button href="https://www.instagram.com/somoprocesomx/" target="_blank">Escríbenos en Instagram</Button></section></div>;
}
