import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createSession } from "@/lib/auth";
import { getAdminEnv } from "@/lib/env";
import { checkOrigin } from "@/lib/admin-api";

export const runtime = "nodejs";

const attempts = new Map<string, { count: number; resetAt: number }>();
const schema = z.object({ username: z.string().max(200), password: z.string().max(500) });
const pause = () => new Promise((resolve) => setTimeout(resolve, 550));

function sameValue(value: string, expected: string) {
  const a = Buffer.from(value); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const denied = checkOrigin(request);
  if (denied) return denied;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.resetAt <= now) attempts.delete(key);
  const state = attempts.get(ip);
  if (state && state.resetAt > now && state.count >= 8) {
    await pause(); return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
  }
  try {
    const input = schema.parse(await request.json());
    const env = getAdminEnv();
    const valid = sameValue(input.username, env.ADMIN_USER) && sameValue(input.password, env.ADMIN_PASSWORD);
    await pause();
    if (!valid) {
      attempts.set(ip, { count: state?.resetAt && state.resetAt > now ? state.count + 1 : 1, resetAt: now + 10 * 60 * 1000 });
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
    }
    attempts.delete(ip);
    await createSession();
    return NextResponse.json({ ok: true });
  } catch {
    await pause();
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }
}
