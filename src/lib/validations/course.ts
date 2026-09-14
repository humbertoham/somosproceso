import { z } from "zod";

const optionalText = z.string().trim().max(10_000).nullable().optional().transform((value) => value || null);
const optionalDate = z.union([z.string().datetime(), z.literal(""), z.null()]).optional().transform((value) => value ? new Date(value) : null);

export const courseInputSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa minúsculas, números y guiones."),
  shortDescription: z.string().trim().min(20).max(320),
  description: z.string().trim().min(30).max(30_000),
  imageKey: optionalText,
  imageUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional().transform((value) => value || null),
  price: z.coerce.number().min(0).max(1_000_000),
  currency: z.literal("MXN").default("MXN"),
  status: z.enum(["draft", "published", "archived"]),
  modality: z.enum(["online", "in_person", "hybrid"]),
  startDate: optionalDate,
  endDate: optionalDate,
  timeText: optionalText,
  timezone: z.string().trim().min(1).max(80).default("America/Mexico_City"),
  durationText: optionalText,
  facilitators: optionalText,
  targetAudience: optionalText,
  learningOutcomes: z.array(z.string().trim().min(1).max(300)).max(30).default([]),
  includes: z.array(z.string().trim().min(1).max(300)).max(30).default([]),
  additionalInfo: optionalText,
  capacity: z.union([z.coerce.number().int().positive().max(100_000), z.literal(""), z.null()]).optional().transform((value) => value === "" || value === undefined ? null : value),
  salesOpen: z.boolean(),
}).refine(({ startDate, endDate }) => !startDate || !endDate || endDate >= startDate, {
  message: "La fecha final debe ser posterior a la inicial.", path: ["endDate"],
});

export type CourseInput = z.input<typeof courseInputSchema>;

export function toCourseValues(input: unknown) {
  const parsed = courseInputSchema.parse(input);
  return {
    ...parsed,
    priceCents: Math.round(parsed.price * 100),
    publishedAt: parsed.status === "published" ? new Date() : null,
    updatedAt: new Date(),
  };
}
