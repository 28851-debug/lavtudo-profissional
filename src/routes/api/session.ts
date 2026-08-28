import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  authConfiguration,
  clearSessionCookie,
  createSessionCookie,
  isAdminRequest,
  verifyAdminCredentials,
} from "@/lib/auth.server";
import { apiError, jsonResponse, requestIsSameOrigin } from "@/lib/http";

const credentialsSchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200),
});

export const Route = createFileRoute("/api/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const configuration = authConfiguration();
        return jsonResponse({
          authenticated: await isAdminRequest(request),
          configured: configuration.configured,
          developmentCredentials: configuration.usingDevelopmentCredentials,
        });
      },
      POST: async ({ request }) => {
        if (!requestIsSameOrigin(request)) return apiError("Origem não permitida.", 403);
        const configuration = authConfiguration();
        if (!configuration.configured) {
          return apiError(
            "Configure LAVTUDO_ADMIN_PASSWORD e LAVTUDO_SESSION_SECRET no servidor.",
            503,
          );
        }

        let parsed: z.infer<typeof credentialsSchema>;
        try {
          parsed = credentialsSchema.parse(await request.json());
        } catch {
          return apiError("Credenciais inválidas.", 400);
        }

        if (!verifyAdminCredentials(parsed.username, parsed.password)) {
          return apiError("Usuário ou senha incorretos.", 401);
        }

        return jsonResponse(
          { authenticated: true },
          { headers: { "Set-Cookie": await createSessionCookie(request) } },
        );
      },
      DELETE: async ({ request }) => {
        if (!requestIsSameOrigin(request)) return apiError("Origem não permitida.", 403);
        return jsonResponse(
          { authenticated: false },
          { headers: { "Set-Cookie": clearSessionCookie(request) } },
        );
      },
    },
  },
});
