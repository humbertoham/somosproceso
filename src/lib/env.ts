import { z } from "zod";

const databaseSchema = z.object({ DATABASE_URL: z.string().url().or(z.string().startsWith("postgres")) });
const adminSchema = z.object({
  ADMIN_USER: z.string().min(1),
  ADMIN_PASSWORD: z.string().min(10),
  ADMIN_SESSION_SECRET: z.string().min(32),
});
const stripeSchema = z.object({
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
});
const r2Schema = z.object({
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.string().url(),
});

function parseEnv<T>(schema: z.ZodType<T>, label: string): T {
  const result = schema.safeParse(process.env);
  if (!result.success) throw new Error(`Configuración incompleta para ${label}. Revisa las variables de entorno.`);
  return result.data;
}

export const hasDatabase = () => Boolean(process.env.DATABASE_URL);
export const getDatabaseEnv = () => parseEnv(databaseSchema, "la base de datos");
export const getAdminEnv = () => parseEnv(adminSchema, "la administración");
export const getStripeEnv = () => parseEnv(stripeSchema, "Stripe");
export const getR2Env = () => parseEnv(r2Schema, "Cloudflare R2");

const localSiteUrl = "http://localhost:3000";

function normalizeSiteUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const hasHttpProtocol = /^https?:\/\//i.test(trimmed);
  const hasOtherProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed);
  if (hasOtherProtocol && !hasHttpProtocol) return null;

  try {
    const url = new URL(hasHttpProtocol ? trimmed : `https://${trimmed}`);
    if (!url.hostname || (url.protocol !== "http:" && url.protocol !== "https:")) return null;

    const pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
    return `${url.origin}${pathname}`;
  } catch {
    return null;
  }
}

export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    localSiteUrl,
  ];

  return candidates.map(normalizeSiteUrl).find((url): url is string => Boolean(url)) ?? localSiteUrl;
}
