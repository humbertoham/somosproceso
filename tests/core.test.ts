import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { drizzle } from "drizzle-orm/pg-proxy";
import { ModuleKind, transpileModule } from "typescript";

import { dateTimeInput, zonedDateTimeToIso } from "../src/lib/dates";
import { imageValidationError, matchesImageType, MAX_IMAGE_BYTES } from "../src/lib/image-validation";
import { gmailComposeUrl, whatsappUrl } from "../src/lib/purchases";
import { courseAvailability, csvCell, formatDate, remainingSeats } from "../src/lib/utils";
import { courseInputSchema, priceSchema, toCourseValues } from "../src/lib/validations/course";
import { parsePurchaseFilters } from "../src/lib/validations/purchase-filters";

test("consultas publicas generan ASC NULLS LAST y conservan filtros y limites", async () => {
  const statements: { sql: string; params: unknown[] }[] = [];
  const db = drizzle(async (sql, params) => {
    statements.push({ sql, params });
    return { rows: [] };
  });
  // Execute the real query module with only server infrastructure replaced.
  const require = createRequire(import.meta.url);
  const exports = {} as typeof import("../src/db/queries");
  const source = readFileSync(new URL("../src/db/queries.ts", import.meta.url), "utf8");
  runInNewContext(transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } }).outputText, {
    exports,
    require: (id: string) => {
      if (id === "server-only") return {};
      if (id === "@/db") return { getDb: () => db };
      if (id === "@/db/schema") return require("../src/db/schema");
      if (id === "@/lib/env") return { hasDatabase: () => true };
      if (id === "@/lib/auth") return { requireAdmin: () => { throw new Error("Unexpected admin query"); } };
      return require(id);
    },
  });

  await exports.getUpcomingCourses();
  await exports.getPublishedCourses();
  await exports.getPublishedCourses(2);

  assert.equal(statements.length, 3);
  for (const { sql, params } of statements) {
    assert.match(sql, /order by "courses"\."start_date" asc nulls last, "courses"\."created_at" desc(?: limit \$\d+)?$/);
    assert.match(sql, /left join "purchases" on \("purchases"\."course_id" = "courses"\."id" and "purchases"\."payment_status" = \$1\)/);
    assert.match(sql, /count\("purchases"\."id"\)/);
    assert.match(sql, /"courses"\."status" = \$2/);
    assert.match(sql, /group by "courses"\."id"/);
    assert.deepEqual(params.slice(0, 2), ["paid", "published"]);
  }
  assert.match(statements[0].sql, /\("courses"\."start_date" is null or "courses"\."start_date" >= \$3\)/);
  assert.ok(Number.isFinite(Date.parse(String(statements[0].params[2]))));
  assert.equal(statements[0].params[3], 3);
  assert.match(statements[0].sql, /limit \$4$/);
  assert.doesNotMatch(statements[1].sql, /start_date" (?:is null|>=)| limit /);
  assert.deepEqual(statements[2].params, ["paid", "published", 2]);
  assert.match(statements[2].sql, /limit \$3$/);
});

const course = {
  title: "Comunicación & vínculos", slug: "comunicacion-vinculos", shortDescription: "Un encuentro para conversar.",
  description: "Contenido del curso.", price: "1200.01", status: "published" as const, modality: "online" as const,
  capacity: 20, salesOpen: true, startDate: "2027-11-21T16:00:00.000Z", timezone: "America/Monterrey",
};

test("precios en centavos enteros y límites del formulario", () => {
  assert.equal(priceSchema.parse("1200"), 120000);
  assert.equal(priceSchema.parse("0.29"), 29);
  assert.equal(toCourseValues(course).priceCents, 120001);
  for (const price of ["", "-1", "1.001", "1e2", "1000000.01", null]) assert.equal(priceSchema.safeParse(price).success, false);
  for (const patch of [{ title: " " }, { slug: "" }, { capacity: 0 }, { capacity: -1 }, { capacity: true }, { shortDescription: "a".repeat(321) }, { timezone: "inventada" }, { timeText: "a".repeat(121) }, { endDate: "2027-01-01T00:00:00Z" }]) {
    assert.equal(courseInputSchema.safeParse({ ...course, ...patch }).success, false);
  }
  assert.equal(toCourseValues({ ...course, capacity: null }).capacity, null);
  assert.equal(toCourseValues({ ...course, capacity: "" }).capacity, null);
});

test("fechas conservan la hora del curso sin depender de la zona del navegador", () => {
  assert.equal(formatDate("2026-11-05T20:32:00Z", true), "5 de noviembre de 2026, 14:32");
  assert.equal(zonedDateTimeToIso("2026-11-21T10:00", "America/Monterrey"), "2026-11-21T16:00:00.000Z");
  assert.equal(dateTimeInput("2026-11-21T16:00:00Z", "America/Monterrey"), "2026-11-21T10:00");
  assert.equal(zonedDateTimeToIso("2026-07-21T10:00", "America/New_York"), "2026-07-21T14:00:00.000Z");
  assert.throws(() => zonedDateTimeToIso("2026-03-08T02:30", "America/New_York"));
  assert.throws(() => zonedDateTimeToIso("2026-02-31T10:00", "America/Monterrey"));
});

test("cupo y disponibilidad derivados, sin guardar lugares restantes", () => {
  const item = { ...course, startDate: new Date(course.startDate) };
  assert.equal(remainingSeats(20, 14), 6);
  assert.equal(remainingSeats(20, 20), 0);
  assert.equal(remainingSeats(20, 21), 0);
  assert.equal(remainingSeats(null, 20), null);
  assert.equal(courseAvailability(item, 14).purchasable, true);
  assert.equal(courseAvailability(item, 20).label, "Agotado");
  assert.equal(courseAvailability({ ...item, salesOpen: false }, 14).label, "Inscripciones cerradas");
  assert.equal(courseAvailability({ ...item, startDate: null }, 0).label, "Próximamente");
  assert.equal(courseAvailability({ ...item, startDate: new Date("2000-01-01") }, 20).label, "Finalizado");
  assert.equal(courseAvailability({ ...item, status: "draft" }, 0).purchasable, false);
  assert.equal(courseAvailability({ ...item, status: "archived" }, 0).purchasable, false);
});

test("Gmail conserva destinatario y contenido real, omite datos ausentes", () => {
  const buyer = { buyerName: "Ana Martínez", buyerEmail: "ana+curso@example.com", course: { id: "demo", title: course.title, startDate: course.startDate, timeText: "10:00–13:00", timezone: course.timezone, modality: course.modality, durationText: null } };
  const url = new URL(gmailComposeUrl(buyer));
  assert.equal(url.searchParams.get("to"), buyer.buyerEmail);
  assert.equal(url.searchParams.get("su"), `Información de tu curso — ${course.title} | Somos Proceso`);
  assert.match(url.searchParams.get("body")!, /Hola Ana Martínez/);
  assert.match(url.searchParams.get("body")!, /10:00–13:00/);
  assert.match(url.searchParams.get("body")!, /En línea/);
  assert.doesNotMatch(url.searchParams.get("body")!, /Duración:|null|undefined/);
  const sparse = new URL(gmailComposeUrl({ ...buyer, course: { ...buyer.course, startDate: null, timeText: null } }));
  assert.doesNotMatch(sparse.searchParams.get("body")!, /Fecha:|Horario:/);
});

test("WhatsApp requiere código de país explícito; CSV evita fórmulas", () => {
  assert.equal(whatsappUrl("+52 (81) 1234-5678"), "https://wa.me/528112345678");
  assert.equal(whatsappUrl("0052 81 1234 5678"), "https://wa.me/528112345678");
  assert.equal(whatsappUrl("81 1234 5678"), null);
  assert.equal(whatsappUrl("+52 81 1234 5678 ext. 10"), null);
  assert.equal(csvCell('Ana, "hola"'), '"Ana, ""hola"""');
  for (const value of ["=1+1", " +SUM(A1)", "\t=1+1", "@funcion", "-12", "+528112345678"]) assert.equal(csvCell(value).startsWith('"\''), true);
});

test("imágenes: tamaño, tipo declarado y firma del contenido", () => {
  assert.equal(imageValidationError({ type: "image/png", size: MAX_IMAGE_BYTES }), null);
  assert.ok(imageValidationError({ type: "image/png", size: MAX_IMAGE_BYTES + 1 }));
  assert.ok(imageValidationError({ type: "image/svg+xml", size: 100 }));
  assert.ok(imageValidationError({ type: "image/png", size: 0 }));
  assert.equal(matchesImageType(new TextEncoder().encode("<script>bad</script>"), "image/png"), false);
  assert.equal(matchesImageType(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), "image/png"), true);
});

test("filtros toleran parámetros repetidos y descartan valores inválidos", () => {
  assert.equal(parsePurchaseFilters({ q: ["Ana", "Carlos"] }).q, "Ana");
  assert.equal(parsePurchaseFilters({ status: "inventado" }).status, "");
  assert.equal(parsePurchaseFilters({ follow: "pending" }).follow, "pending");
});
