import { NextResponse } from "next/server";

import { clearSession } from "@/lib/auth";
import { adminRequestError } from "@/lib/admin-api";

export async function POST(request: Request) {
  const denied = await adminRequestError(request);
  if (denied) return denied;
  await clearSession();
  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
