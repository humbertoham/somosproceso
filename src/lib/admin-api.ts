import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { isAdminAuthenticated } from "@/lib/auth";

export class ApiError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  // Next puede reconstruir request.url con un hostname interno; Host conserva el destino del navegador.
  const host = request.headers.get("host") ?? new URL(request.url).host;
  let validOrigin = true;
  if (origin) {
    try { const url = new URL(origin); validOrigin = ["http:", "https:"].includes(url.protocol) && url.host === host; }
    catch { validOrigin = false; }
  }
  if (!validOrigin || request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  }
  return null;
}

export async function adminRequestError(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Sesión expirada." }, { status: 401 });
  return checkOrigin(request);
}

export function databaseErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  return "cause" in error ? databaseErrorCode(error.cause) : undefined;
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) return NextResponse.json({ error: error.issues.map((issue) => issue.message).join(" ") }, { status: 400 });
  if (error instanceof SyntaxError) return NextResponse.json({ error: "La solicitud no es válida." }, { status: 400 });
  if (databaseErrorCode(error) === "23505") return NextResponse.json({ error: "Ya existe un curso con ese slug." }, { status: 409 });
  if (databaseErrorCode(error) === "23503") return NextResponse.json({ error: "Este curso tiene compras. Puedes archivarlo para conservar su historial." }, { status: 409 });
  console.error("Falló una operación administrativa.", { code: databaseErrorCode(error) ?? "unknown" });
  return NextResponse.json({ error: "No fue posible guardar los cambios. Inténtalo de nuevo." }, { status: 500 });
}
