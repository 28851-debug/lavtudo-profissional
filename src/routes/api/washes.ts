import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isAdminRequest } from "@/lib/auth.server";
import { apiError, jsonResponse, requestIsSameOrigin } from "@/lib/http";
import { createWash, listWashes, storageMode } from "@/lib/wash-store.server";

const createWashSchema = z.object({
  customerName: z.string().trim().min(2).max(80),
  machineLabel: z.string().trim().min(2).max(80),
  serviceType: z.enum(["wash", "wash-dry"]),
  estimatedMinutes: z.number().int().min(5).max(240),
});

export const Route = createFileRoute("/api/washes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAdminRequest(request))) return apiError("Não autorizado.", 401);
        try {
          return jsonResponse({ washes: await listWashes(), storage: storageMode() });
        } catch (error) {
          console.error("Falha ao listar lavagens", error);
          return apiError("Não foi possível carregar as lavagens.", 503);
        }
      },
      POST: async ({ request }) => {
        if (!requestIsSameOrigin(request)) return apiError("Origem não permitida.", 403);
        if (!(await isAdminRequest(request))) return apiError("Não autorizado.", 401);

        let input: z.infer<typeof createWashSchema>;
        try {
          input = createWashSchema.parse(await request.json());
        } catch {
          return apiError("Revise os dados da lavagem.", 400);
        }

        try {
          const wash = await createWash(input);
          return jsonResponse({ wash }, { status: 201 });
        } catch (error) {
          console.error("Falha ao criar lavagem", error);
          return apiError("Não foi possível criar a lavagem.", 503);
        }
      },
    },
  },
});
