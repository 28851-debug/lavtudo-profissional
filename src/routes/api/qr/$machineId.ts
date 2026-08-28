import { createFileRoute } from "@tanstack/react-router";
import QRCode from "qrcode";
import { isLaundryMachineId } from "@/lib/washes";

export const Route = createFileRoute("/api/qr/$machineId")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!isLaundryMachineId(params.machineId)) {
          return new Response("Máquina inválida.", { status: 400 });
        }

        const origin = new URL(request.url).origin;
        const trackingUrl = new URL(`/acompanhar/${params.machineId}`, origin).toString();
        const svg = await QRCode.toString(trackingUrl, {
          type: "svg",
          errorCorrectionLevel: "M",
          margin: 2,
          color: { dark: "#18065f", light: "#ffffff" },
          width: 640,
        });

        return new Response(svg, {
          headers: {
            "Cache-Control": "public, max-age=3600",
            "Content-Disposition": `attachment; filename="qr-${params.machineId}.svg"`,
            "Content-Type": "image/svg+xml; charset=utf-8",
            "X-Content-Type-Options": "nosniff",
          },
        });
      },
    },
  },
});
