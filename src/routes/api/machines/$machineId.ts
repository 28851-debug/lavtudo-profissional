import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { isAdminRequest } from "@/lib/auth.server";
import { apiError, jsonResponse, requestIsSameOrigin } from "@/lib/http";
import { createWash, findMachine, releaseMachine, setMachineStatus } from "@/lib/wash-store.server";
import { WASH_STATUSES, isLaundryMachineId, type LaundryMachineId } from "@/lib/washes";

const createWashSchema = z.object({
  serviceType: z.enum(["standard", "delicate", "heavy", "drying"]),
  estimatedMinutes: z.number().int().min(5).max(240),
  startedAt: z.string().datetime({ offset: true }),
});

const updateSchema = z.union([
  z.object({ status: z.enum(WASH_STATUSES) }),
  z.object({ action: z.literal("release") }),
]);

function parseMachineId(value: string): LaundryMachineId | null {
  return isLaundryMachineId(value) ? value : null;
}

export const Route = createFileRoute("/api/machines/$machineId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const machineId = parseMachineId(params.machineId);
        if (!machineId) return apiError("Máquina inválida.", 400);
        try {
          const machine = await findMachine(machineId);
          return machine ? jsonResponse({ machine }) : apiError("Máquina não encontrada.", 404);
        } catch (error) {
          console.error("Falha ao buscar máquina", error);
          return apiError("Acompanhamento temporariamente indisponível.", 503);
        }
      },
      POST: async ({ request, params }) => {
        if (!requestIsSameOrigin(request)) return apiError("Origem não permitida.", 403);
        if (!(await isAdminRequest(request))) return apiError("Não autorizado.", 401);
        const machineId = parseMachineId(params.machineId);
        if (!machineId) return apiError("Máquina inválida.", 400);

        let input: z.infer<typeof createWashSchema>;
        try {
          input = createWashSchema.parse(await request.json());
        } catch {
          return apiError("Revise os dados do ciclo.", 400);
        }

        try {
          const machine = await createWash(machineId, input);
          return jsonResponse({ machine }, { status: 201 });
        } catch (error) {
          console.error("Falha ao iniciar ciclo", error);
          const message = error instanceof Error ? error.message : "";
          return apiError(
            message.includes("ocupada")
              ? "Esta máquina já possui um ciclo ativo."
              : "Não foi possível iniciar o ciclo.",
            message.includes("ocupada") ? 409 : 503,
          );
        }
      },
      PATCH: async ({ request, params }) => {
        if (!requestIsSameOrigin(request)) return apiError("Origem não permitida.", 403);
        if (!(await isAdminRequest(request))) return apiError("Não autorizado.", 401);
        const machineId = parseMachineId(params.machineId);
        if (!machineId) return apiError("Máquina inválida.", 400);

        let update: z.infer<typeof updateSchema>;
        try {
          update = updateSchema.parse(await request.json());
        } catch {
          return apiError("Atualização inválida.", 400);
        }

        try {
          const machine =
            "action" in update
              ? await releaseMachine(machineId)
              : await setMachineStatus(machineId, update.status);
          return machine ? jsonResponse({ machine }) : apiError("Nenhum ciclo ativo.", 404);
        } catch (error) {
          console.error("Falha ao atualizar máquina", error);
          return apiError("Não foi possível atualizar o status.", 503);
        }
      },
    },
  },
});
