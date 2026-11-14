import "./load-env";

import { inArray } from "drizzle-orm";

import { courses, purchases } from "./schema";
import { closeDb, getDb } from "./index";

const demoCourses: Array<typeof courses.$inferInsert> = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    slug: "inteligencia-emocional-cotidiana-demo",
    title: "Inteligencia emocional cotidiana (demo)",
    shortDescription: "Un taller introductorio para reconocer emociones y responder con mayor conciencia.",
    description: "Este es contenido de demostración.\n\nExploraremos un lenguaje sencillo para reconocer emociones, necesidades y respuestas habituales.",
    priceCents: 85000,
    status: "published",
    modality: "online",
    startDate: new Date("2027-02-20T11:00:00-06:00"),
    timeText: "11:00 a 14:00 h",
    durationText: "3 horas",
    salesOpen: true,
    publishedAt: new Date(),
    targetAudience: "Personas interesadas en comprender mejor su experiencia emocional.",
    learningOutcomes: ["Identificar emociones con más precisión", "Reconocer patrones de respuesta", "Practicar una pausa consciente"],
    includes: ["Sesión en vivo por Zoom", "Material digital de apoyo"],
    additionalInfo: "Contenido ficticio para probar la aplicación. Elimínalo antes de producción.",
    capacity: 20,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    slug: "conversaciones-que-cuidan-demo",
    title: "Conversaciones que cuidan (demo)",
    shortDescription: "Herramientas prácticas para escuchar, expresar límites y conversar con claridad.",
    description: "Este es contenido de demostración.\n\nUn espacio para practicar conversaciones más claras, honestas y respetuosas.",
    priceCents: 120000,
    status: "published",
    modality: "online",
    startDate: new Date("2027-03-13T10:00:00-06:00"),
    timeText: "10:00 a 13:00 h",
    durationText: "Dos sesiones de 3 horas",
    salesOpen: true,
    publishedAt: new Date(),
    learningOutcomes: ["Escuchar sin adelantarse a responder", "Formular peticiones claras", "Comunicar límites con respeto"],
    includes: ["Dos sesiones en vivo", "Guía de ejercicios"],
    capacity: 24,
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    slug: "pausa-y-direccion-demo",
    title: "Pausa y dirección (demo)",
    shortDescription: "Una experiencia breve para observar el momento presente y elegir próximos pasos.",
    description: "Este es contenido de demostración y permanece como borrador para probar el flujo administrativo.",
    priceCents: 65000,
    status: "draft",
    modality: "hybrid",
    salesOpen: false,
    learningOutcomes: ["Hacer una pausa intencional", "Definir un siguiente paso realista"],
    includes: ["Cuaderno de trabajo digital"],
  },
];

async function main() {
  if (process.env.NODE_ENV && process.env.NODE_ENV !== "development") throw new Error("El seed de demostración solo está permitido en development.");
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.insert(courses).values(demoCourses).onConflictDoNothing();
    const existing = await tx.select({ id: courses.id, slug: courses.slug }).from(courses).where(inArray(courses.slug, demoCourses.map((course) => course.slug)));
    const first = existing.find((course) => course.slug === demoCourses[0].slug);
    const second = existing.find((course) => course.slug === demoCourses[1].slug);
    if (!first || !second) throw new Error("No fue posible encontrar los cursos demo.");
    const now = new Date();
    await tx.insert(purchases).values([
      { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1", courseId: first.id, buyerName: "Ana Martínez", buyerEmail: "ana@example.com", buyerPhone: "+52 81 1234 5678", amountCents: 85000, currency: "MXN", paymentStatus: "paid", paidAt: now, emailSent: false, source: "manual", internalReference: "DEMO-ANA" },
      { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2", courseId: first.id, buyerName: "Carlos López", buyerEmail: "carlos@example.com", buyerPhone: "81 2345 6789", amountCents: 85000, currency: "MXN", paymentStatus: "paid", paidAt: now, emailSent: true, emailSentAt: now, adminNotes: "Ejemplo: ya recibió la información del curso.", source: "manual", internalReference: "DEMO-CARLOS" },
      { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3", courseId: second.id, buyerName: "Fernanda Ruiz", buyerEmail: "fernanda@example.com", amountCents: 120000, currency: "MXN", paymentStatus: "pending", source: "manual", internalReference: "DEMO-FERNANDA" },
      { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4", courseId: second.id, buyerName: "Ana Martínez", buyerEmail: "ana@example.com", amountCents: 120000, currency: "MXN", paymentStatus: "failed", source: "manual", internalReference: "DEMO-FALLIDO" },
      { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5", courseId: second.id, buyerName: "Carlos López", buyerEmail: "carlos@example.com", amountCents: 120000, currency: "MXN", paymentStatus: "refunded", paidAt: now, source: "manual", internalReference: "DEMO-REEMBOLSO" },
    ]).onConflictDoNothing();
  });
  await closeDb();
  console.log("Seed listo: 3 cursos y 5 compras de demostración. Solo para desarrollo.");
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "No fue posible cargar el seed.");
  await closeDb();
  process.exit(1);
});
