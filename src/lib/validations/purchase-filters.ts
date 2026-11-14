import { z } from "zod";

const first = (value: unknown) => Array.isArray(value) ? value[0] : value;
const schema = z.object({
  q: z.preprocess(first, z.string().trim().max(200).catch("").default("")),
  course: z.preprocess(first, z.union([z.uuid(), z.literal("")]).catch("").default("")),
  status: z.preprocess(first, z.enum(["", "pending", "paid", "failed", "expired", "refunded"]).catch("").default("")),
  follow: z.preprocess(first, z.enum(["", "pending", "sent"]).catch("").default("")),
});

export type PurchaseFilterParams = z.output<typeof schema>;
export type RawPurchaseFilterParams = Record<string, string | string[] | undefined>;

export function parsePurchaseFilters(params: RawPurchaseFilterParams) {
  return schema.parse(params);
}

export function purchaseFilterQuery(params: PurchaseFilterParams) {
  return new URLSearchParams(Object.entries(params).filter(([, value]) => value)).toString();
}

export function purchaseQueryFilters(params: PurchaseFilterParams) {
  return { search: params.q, courseId: params.course, status: params.status, followUp: params.follow };
}
