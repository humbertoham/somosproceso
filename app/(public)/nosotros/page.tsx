import type { Metadata } from "next";
import { HeartHandshake, MessageCircleHeart, Sprout } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { educationDisclaimer } from "@/content/legal";

export const metadata: Metadata = { title: "Nosotros", description: "Conoce el enfoque de Somos Proceso.", alternates: { canonical: "/nosotros" } };

export default function AboutPage() {
  return <div className="page-wrap about-page"><header className="page-hero split-hero"><div><p className="eyebrow">Quiénes somos</p><h1>Un espacio humano para seguir creciendo.</h1></div><p>Somos Proceso crea experiencias de aprendizaje para hacer pausa, comprender lo que vivimos y practicar nuevas maneras de relacionarnos.</p></header>
    <section className="about-story"><div className="organic-panel" aria-hidden="true"><span>presencia</span><span>claridad</span><span>cuidado</span></div><div><p className="eyebrow">Nuestro enfoque</p><h2>Aprender también puede sentirse cercano.</h2><p>Abordamos temas de desarrollo humano, psicoeducación, inteligencia emocional y comunicación con un lenguaje claro y aplicable a la vida cotidiana.</p><p>No buscamos respuestas rápidas ni fórmulas idénticas para todas las personas. Valoramos la reflexión, el contexto y el proceso de cada quien.</p></div></section>
    <section className="values"><article><Sprout /><h3>Curiosidad</h3><p>Mirarnos sin juicio abre nuevas posibilidades.</p></article><article><MessageCircleHeart /><h3>Claridad</h3><p>Ideas útiles, lenguaje comprensible y práctica concreta.</p></article><article><HeartHandshake /><h3>Cuidado</h3><p>Participación respetuosa y espacios que reconocen los límites.</p></article></section>
    <aside className="disclaimer"><strong>Una nota importante</strong><p>{educationDisclaimer}</p></aside>
    <section className="inline-cta"><h2>Conoce nuestros próximos encuentros.</h2><Button href="/cursos">Explorar cursos</Button></section>
  </div>;
}
