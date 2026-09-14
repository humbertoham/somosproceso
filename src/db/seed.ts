import { courses } from "./schema";
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
    startDate: new Date("2027-02-20T17:00:00-06:00"),
    timeText: "11:00 a 14:00 h",
    durationText: "3 horas",
    salesOpen: true,
    publishedAt: new Date(),
    targetAudience: "Personas interesadas en comprender mejor su experiencia emocional.",
    learningOutcomes: ["Identificar emociones con más precisión", "Reconocer patrones de respuesta", "Practicar una pausa consciente"],
    includes: ["Sesión en vivo por Zoom", "Material digital de apoyo"],
    additionalInfo: "Contenido ficticio para probar la aplicación. Elimínalo antes de producción.",
    capacity: 30,
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
    startDate: new Date("2027-03-13T16:00:00-06:00"),
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
  await getDb().insert(courses).values(demoCourses).onConflictDoNothing({ target: courses.slug });
  await closeDb();
  console.log("Seed listo: 3 cursos de demostración.");
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : "No fue posible cargar el seed.");
  await closeDb();
  process.exit(1);
});
