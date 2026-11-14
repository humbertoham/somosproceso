import { z } from "zod";

import { DEFAULT_TIMEZONE, isValidTimezone } from "@/lib/dates";

z.config(z.locales.es());

const optionalText = (max = 10_000) => z.string().trim().max(max, `Usa como máximo ${max} caracteres.`).nullish().transform((value) => value || null);
const optionalDate = z.union([z.iso.datetime(), z.literal(""), z.null()]).optional().transform((value) => value ? new Date(value) : null);
export const imageKeyPattern = /^courses\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp|avif)$/i;

export const priceSchema = z.union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .pipe(z.string().regex(/^\d{1,7}(?:\.\d{1,2})?$/, "Escribe un precio válido, sin negativos y con hasta dos decimales."))
  .transform((value) => {
    const [whole, fraction = ""] = value.split(".");
    return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  })
  .pipe(z.number().int().min(0).max(100_000_000, "El precio máximo es $1,000,000 MXN."));

export function priceInput(cents: number) {
  return `${Math.trunc(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

export const courseInputSchema = z.object({
  title: z.string().trim().min(1, "Escribe el título del curso.").max(180),
  slug: z.string().trim().min(1, "Escribe el slug.").max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa minúsculas, números y guiones en el slug."),
  shortDescription: z.string().trim().min(1, "Escribe la descripción corta.").max(320, "La descripción corta admite hasta 320 caracteres."),
  description: z.string().trim().min(1, "Escribe la descripción completa.").max(30_000),
  imageKey: z.union([z.string().regex(imageKeyPattern, "La imagen no es válida."), z.literal(""), z.null()]).optional().transform((value) => value || null),
  imageUrl: z.union([z.url(), z.literal(""), z.null()]).optional().transform((value) => value || null),
  price: priceSchema,
  currency: z.literal("MXN").default("MXN"),
  status: z.enum(["draft", "published", "archived"]),
  modality: z.enum(["online", "in_person", "hybrid"]),
  startDate: optionalDate,
  endDate: optionalDate,
  timeText: optionalText(120),
  timezone: z.string().trim().min(1).max(80).refine(isValidTimezone, "La zona horaria no es válida.").default(DEFAULT_TIMEZONE),
  durationText: optionalText(120),
  facilitators: optionalText(),
  targetAudience: optionalText(),
  learningOutcomes: z.array(z.string().trim().min(1).max(300)).max(30).default([]),
  includes: z.array(z.string().trim().min(1).max(300)).max(30).default([]),
  additionalInfo: optionalText(),
  capacity: z.union([z.literal(""), z.null(), z.union([z.number(), z.string().regex(/^\d+$/)]).transform(Number).pipe(z.number().int().positive("El cupo debe ser mayor que cero.").max(100_000))]).optional().transform((value) => value === "" || value === undefined ? null : value),
  salesOpen: z.boolean(),
}).refine(({ startDate, endDate }) => !endDate || (startDate && endDate >= startDate), {
  message: "La fecha final requiere una fecha inicial y debe ser posterior a ella.", path: ["endDate"],
});

export type CourseInput = z.input<typeof courseInputSchema>;

export function toCourseValues(input: unknown) {
  const { price, ...values } = courseInputSchema.parse(input);
  return { ...values, priceCents: price, updatedAt: new Date() };
}
