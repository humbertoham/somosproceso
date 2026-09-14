import { CalendarDays, Check, Clock3, Globe2, Monitor, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

import { CheckoutForm } from "@/components/public/CheckoutForm";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getPublishedCourseBySlug } from "@/db/queries";
import { courseAvailability, formatDate, formatPrice, modalityLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublishedCourseBySlug(slug);
  if (!result) return { title: "Curso no encontrado", robots: { index: false, follow: false } };
  const { course } = result;
  const images = course.imageUrl ? [{ url: course.imageUrl, alt: course.title }] : [];
  return {
    title: course.title,
    description: course.shortDescription,
    alternates: { canonical: `/cursos/${course.slug}` },
    openGraph: { title: course.title, description: course.shortDescription, type: "website", images },
    twitter: { card: "summary_large_image", title: course.title, description: course.shortDescription, images: images.map(({ url }) => url) },
  };
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const result = await getPublishedCourseBySlug(slug);
  if (!result) notFound();
  const { course, sales } = result;
  const availability = courseAvailability(course, sales);
  const courseJsonLd = {
    "@context": "https://schema.org", "@type": "Course", name: course.title,
    description: course.shortDescription,
    provider: { "@type": "Organization", name: "Somos Proceso" },
    ...(course.startDate ? { hasCourseInstance: { "@type": "CourseInstance", courseMode: modalityLabel(course.modality), startDate: course.startDate.toISOString(), ...(course.endDate ? { endDate: course.endDate.toISOString() } : {}) } } : {}),
  };
  return <div className="course-detail page-wrap">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd).replace(/</g, "\\u003c") }} />
    <div className="course-detail-top">
      <div className="detail-image">{course.imageUrl ? <Image src={course.imageUrl} alt={`Imagen del curso ${course.title}`} fill priority sizes="(max-width: 900px) 100vw, 50vw" /> : <span>Una pausa<br /><em>para crecer.</em></span>}</div>
      <div className="detail-summary"><StatusBadge status={availability.key} label={availability.label} /><p className="eyebrow">Curso · {modalityLabel(course.modality)}</p><h1>{course.title}</h1><p className="lead">{course.shortDescription}</p>
        <div className="detail-facts">
          {course.startDate && <span><CalendarDays /> <span><small>Fecha</small>{formatDate(course.startDate)}</span></span>}
          {course.timeText && <span><Clock3 /> <span><small>Horario</small>{course.timeText}</span></span>}
          <span><Globe2 /> <span><small>Zona horaria</small>{course.timezone}</span></span>
          <span><Monitor /> <span><small>Modalidad</small>{modalityLabel(course.modality)}</span></span>
        </div>
        <div className="purchase-box"><div><small>Inversión</small><strong>{formatPrice(course.priceCents, course.currency)}</strong></div><CheckoutForm courseId={course.id} disabled={!availability.purchasable} />{!availability.purchasable && <p className="muted">La compra no está disponible en este momento.</p>}</div>
      </div>
    </div>
    <div className="detail-content">
      <article className="prose"><h2>Sobre este curso</h2><ReactMarkdown rehypePlugins={[rehypeSanitize]}>{course.description}</ReactMarkdown>
        {course.targetAudience && <><h2>Dirigido a</h2><p>{course.targetAudience}</p></>}
        {course.learningOutcomes.length > 0 && <><h2>Qué explorarás</h2><ul className="check-list">{course.learningOutcomes.map((item) => <li key={item}><Check />{item}</li>)}</ul></>}
        {course.includes.length > 0 && <><h2>Qué incluye</h2><ul className="check-list">{course.includes.map((item) => <li key={item}><Check />{item}</li>)}</ul></>}
        {course.additionalInfo && <><h2>Información adicional</h2><ReactMarkdown rehypePlugins={[rehypeSanitize]}>{course.additionalInfo}</ReactMarkdown></>}
      </article>
      <aside className="detail-aside"><h2>Detalles</h2>{course.durationText && <div><Clock3 /><span><small>Duración</small>{course.durationText}</span></div>}{course.facilitators && <div><UserRound /><span><small>Facilitación</small>{course.facilitators}</span></div>}<div><Monitor /><span><small>Modalidad</small>{modalityLabel(course.modality)}</span></div></aside>
    </div>
  </div>;
}
