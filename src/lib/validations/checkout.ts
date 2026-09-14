import { z } from "zod";

export const checkoutSchema = z.object({
  courseId: z.string().uuid(),
  termsAccepted: z.literal(true, { error: "Debes aceptar los términos para continuar." }),
});
