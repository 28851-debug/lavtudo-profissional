import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isAdminRequest } from "@/lib/auth.server";
import { apiError, jsonResponse, requestIsSameOrigin } from "@/lib/http";
import { findWash, resetWash, setWashStatus } from "@/lib/wash-store.server";
import { WASH_STATUSES } from "@/lib/washes";

const washIdSchema = z.string().regex(/^\d{1,12}$/u);
const updateSchema = z.union([
  z.object({ status: z.enum(WASH_STATUSES) }),
  z.object({ action: z.literal("reset") }),
]);

export const Route = createFileRoute("/api/washes/$washId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = washIdSchema.safeParse(params.washId);
        if (!id.success) return apiError("Identificador inválido.", 400);
        try {
          const wash = await findWash(id.data);
          return wash ? jsonResponse({ wash }) : apiError("Lavagem não encontrada.", 404);
        } catch (error) {
          console.error("Falha ao buscar lavagem", error);
          return apiError("Acompanhamento temporariamente indisponível.", 503);
        }
      },
      PATCH: async ({ request, params }) => {
        if (!requestIsSameOrigin(request)) return apiError("Origem não permitida.", 403);
        if (!(await isAdminRequest(request))) return apiError("Não autorizado.", 401);
        const id = washIdSchema.safeParse(params.washId);
        if (!id.success) return apiError("Identificador inválido.", 400);

        let update: z.infer<typeof updateSchema>;
        try {
          update = updateSchema.parse(await request.json());
        } catch {
          return apiError("Atualização inválida.", 400);
        }

        try {
          const wash =
            "action" in update
              ? await resetWash(id.data)
              : await setWashStatus(id.data, update.status);
          return wash ? jsonResponse({ wash }) : apiError("Lavagem não encontrada.", 404);
        } catch (error) {
          console.error("Falha ao atualizar lavagem", error);
          return apiError("Não foi possível atualizar o status.", 503);
        }
      },
    },
  },
});
