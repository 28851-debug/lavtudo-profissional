import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/http";
import { storageMode } from "@/lib/wash-store.server";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () =>
        jsonResponse({
          ok: true,
          service: "lavtudo",
          storage: storageMode(),
          timestamp: new Date().toISOString(),
        }),
    },
  },
});
