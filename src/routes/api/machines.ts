import { createFileRoute } from "@tanstack/react-router";
import { isAdminRequest } from "@/lib/auth.server";
import { apiError, jsonResponse } from "@/lib/http";
import {
  describeDatabaseError,
  listMachines,
  logDatabaseError,
  storageMode,
} from "@/lib/wash-store.server";

export const Route = createFileRoute("/api/machines")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAdminRequest(request))) return apiError("Não autorizado.", 401);
        try {
          return jsonResponse({ machines: await listMachines(), storage: storageMode() });
        } catch (error) {
          logDatabaseError("Falha ao listar máquinas", error);
          const failure = describeDatabaseError(error, "Não foi possível carregar as máquinas.");
          return apiError(failure.publicMessage, failure.status);
        }
      },
    },
  },
});
