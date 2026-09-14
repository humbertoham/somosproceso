import { ArrowRight, HeartHandshake, MessageCircleHeart, Sprout } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

import { CourseCard } from "@/components/public/CourseCard";
import { FAQAccordion } from "@/components/public/FAQAccordion";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { faqs } from "@/content/faq";
import { getUpcomingCourses } from "@/db/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { alternates: { canonical: "/" } };

const pillars = [
  { icon: Sprout, number: "01", title: "Desarrollo humano y psicoeducación", text: "Ideas y herramientas para comprenderte con mayor claridad." },
  { icon: MessageCircleHeart, number: "02", title: "Inteligencia emocional y comunicación", text: "Recursos para nombrar lo que sientes y conversar con más conciencia." },
  { icon: HeartHandshake, number: "03", title: "Espacios seguros para crecer", text: "Encuentros cuidados para hacer pausa, compartir y seguir avanzando." },
];

export default async function Home() {
  const upcoming = await getUpcomingCourses(3);
  return <>
    <section className="hero-shell section-shell">
      <Reveal className="hero-copy">
        <p className="eyebrow">Desarrollo humano · México</p>
        <h1>Crecer también es aprender a mirarnos.</h1>
        <p className="hero-intro">Cursos y talleres de desarrollo humano, psicoeducación, inteligencia emocional y comunicación. Espacios seguros para crecer, a tu propio ritmo.</p>
        <div className="hero-actions"><Button href="/cursos">Explorar cursos <ArrowRight size={17} /></Button><Button href="/nosotros" variant="secondary">Conoce Somos Proceso</Button></div>
      </Reveal>
      <Reveal className="hero-art" delay={.1}>
        <div className="art-orbit" aria-hidden="true" />
        <Image className="hero-brand-mark" src="/logo.svg" alt="" width={1500} height={1500} loading="eager" sizes="(max-width: 800px) 80vw, 38vw" />
        <p>Todo cambio comienza con <em>una pausa.</em></p>
      </Reveal>
    </section>

    <section className="intro-band"><p className="eyebrow">Somos Proceso</p><p>Creemos que conocernos mejor transforma la forma en que habitamos nuestros vínculos, decisiones y vida cotidiana.</p></section>

    <section className="light-section section-pad" aria-labelledby="pilares">
      <div className="section-heading"><p className="eyebrow">Lo que nos mueve</p><h2 id="pilares">Herramientas para vivir con más conciencia.</h2></div>
      <div className="pillar-grid">{pillars.map((pillar, index) => <Reveal key={pillar.number} delay={index * .06}><article><span>{pillar.number}</span><pillar.icon aria-hidden="true" /><h3>{pillar.title}</h3><p>{pillar.text}</p></article></Reveal>)}</div>
    </section>

    <section className="section-pad courses-preview" aria-labelledby="proximos">
      <div className="section-heading row-heading"><div><p className="eyebrow">Próximos encuentros</p><h2 id="proximos">Cursos para seguir tu proceso.</h2></div><Button href="/cursos" variant="secondary">Ver todos</Button></div>
      {upcoming.length ? <div className="course-grid">{upcoming.map(({ course, sales }) => <CourseCard key={course.id} course={course} sales={sales} />)}</div> : <EmptyState title="Nuevos cursos en camino" description="Muy pronto encontrarás aquí nuestros próximos talleres y experiencias." action={<Button href="/cursos" variant="secondary">Explorar catálogo</Button>} />}
    </section>

    <section className="experience section-pad"><div className="experience-card"><p className="eyebrow">La experiencia</p><h2>Un lugar para pausar, comprender y practicar.</h2><p>Cada encuentro combina información clara, reflexión personal y herramientas que puedes llevar a tu vida cotidiana. Cuidamos el ritmo, la escucha y la participación voluntaria.</p><div className="experience-notes"><span>Información cercana</span><span>Práctica con intención</span><span>Encuentros cuidados</span></div></div></section>

    <section className="light-section section-pad faq-preview"><div className="faq-intro"><p className="eyebrow">Antes de comenzar</p><h2>Preguntas frecuentes.</h2><p>Lo esencial para elegir y comprar con tranquilidad.</p><Button href="/faq" variant="quiet">Ver todas las preguntas <ArrowRight size={16} /></Button></div><FAQAccordion items={faqs.slice(0, 4)} /></section>

    <section className="final-cta"><p className="eyebrow">Tu siguiente paso</p><h2>Hay procesos que comienzan con una pregunta.</h2><Button href="/cursos" variant="secondary">Explorar cursos <ArrowRight size={17} /></Button></section>
  </>;
}
