import { createFileRoute } from "@tanstack/react-router";
import { isAdminRequest } from "@/lib/auth.server";
import { apiError, jsonResponse } from "@/lib/http";
import {
  describeDatabaseError,
  listWashes,
  logDatabaseError,
  storageMode,
} from "@/lib/wash-store.server";

export const Route = createFileRoute("/api/washes")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await isAdminRequest(request))) return apiError("Não autorizado.", 401);
        try {
          return jsonResponse({ washes: await listWashes(), storage: storageMode() });
        } catch (error) {
          logDatabaseError("Falha ao listar lavagens", error);
          const failure = describeDatabaseError(error, "Não foi possível carregar as lavagens.");
          return apiError(failure.publicMessage, failure.status);
        }
      },
    },
  },
});
