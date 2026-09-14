import { ArrowUpRight, CalendarDays, Monitor } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { courseAvailability, formatDate, formatPrice, modalityLabel, type Course } from "@/lib/utils";

export function CourseCard({ course, sales = 0 }: { course: Course; sales?: number }) {
  const availability = courseAvailability(course, sales);
  return (
    <article className="course-card">
      <Link className="course-image" href={`/cursos/${course.slug}`} tabIndex={-1} aria-hidden="true">
        {course.imageUrl ? <Image src={course.imageUrl} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" /> : <span>Somos<br /><em>Proceso</em></span>}
      </Link>
      <div className="course-card-body">
        <StatusBadge status={availability.key} label={availability.label} />
        <h3><Link href={`/cursos/${course.slug}`}>{course.title}</Link></h3>
        <p>{course.shortDescription}</p>
        <div className="course-meta">
          {course.startDate && <span><CalendarDays size={15} aria-hidden="true" />{formatDate(course.startDate)}</span>}
          <span><Monitor size={15} aria-hidden="true" />{modalityLabel(course.modality)}</span>
        </div>
        <div className="course-card-footer"><strong>{formatPrice(course.priceCents, course.currency)}</strong><Link href={`/cursos/${course.slug}`}>Ver curso <ArrowUpRight size={16} /></Link></div>
      </div>
    </article>
  );
}
