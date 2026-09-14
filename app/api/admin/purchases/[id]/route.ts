import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getDb } from "@/db";
import { purchases } from "@/db/schema";
import { isAdminAuthenticated } from "@/lib/auth";

const schema = z.object({ emailSent: z.boolean().optional(), adminNotes: z.string().max(5_000).nullable().optional() }).refine((value) => value.emailSent !== undefined || value.adminNotes !== undefined);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Sesión expirada." }, { status: 401 });
  try {
    const { id } = await params;
    const input = schema.parse(await request.json());
    const values = {
      ...(input.adminNotes !== undefined ? { adminNotes: input.adminNotes } : {}),
      ...(input.emailSent !== undefined ? { emailSent: input.emailSent, emailSentAt: input.emailSent ? new Date() : null } : {}),
      updatedAt: new Date(),
    };
    const [updated] = await getDb().update(purchases).set(values).where(eq(purchases.id, id)).returning({ id: purchases.id, emailSentAt: purchases.emailSentAt });
    if (!updated) return NextResponse.json({ error: "Compra no encontrada." }, { status: 404 });
    return NextResponse.json({ message: input.emailSent === true ? "Correo marcado como enviado" : "Cambios guardados", emailSentAt: updated.emailSentAt });
  } catch {
    return NextResponse.json({ error: "No fue posible guardar los cambios." }, { status: 400 });
  }
}
