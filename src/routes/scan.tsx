import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Info, Nfc, QrCode } from "lucide-react";
import { Nav } from "@/components/Nav";
import { QRScanner } from "@/components/scan/QRScanner";
import { isLaundryMachineId, type LaundryMachineId } from "@/lib/washes";
import "@/styles/app.css";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Acompanhar lavagem — LavTudo" },
      {
        name: "description",
        content: "Escaneie o QR Code permanente da máquina ou aproxime o cartão NFC.",
      },
    ],
  }),
  component: ScanPage,
});

function extractMachineId(value: string): LaundryMachineId | null {
  const text = value.trim();
  if (isLaundryMachineId(text.toLowerCase())) return text.toLowerCase() as LaundryMachineId;

  try {
    const url = new URL(text);
    const segments = url.pathname.split("/").filter(Boolean);
    const trackingIndex = segments.indexOf("acompanhar");
    const machineId = trackingIndex >= 0 ? segments[trackingIndex + 1]?.toLowerCase() : undefined;
    if (machineId && isLaundryMachineId(machineId)) return machineId;
  } catch {
    // O QR pode armazenar somente o identificador permanente da máquina.
  }

  return null;
}

function ScanPage() {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [message, setMessage] = useState<{ kind: "info" | "error"; text: string } | null>(null);
  const [nfcBusy, setNfcBusy] = useState(false);

  const openMachine = (machineId: LaundryMachineId) => {
    void navigate({ to: "/acompanhar/$machineId", params: { machineId } });
  };

  const handleValue = (value: string) => {
    const machineId = extractMachineId(value);
    if (!machineId) {
      setMessage({
        kind: "error",
        text: "Este QR Code não corresponde a uma máquina LavTudo.",
      });
      return;
    }
    setShowScanner(false);
    openMachine(machineId);
  };

  const handleNfc = async () => {
    setMessage(null);
    if (!("NDEFReader" in window)) {
      setMessage({
        kind: "info",
        text: "Neste aparelho, aproxime o cartão NFC fora do navegador. O sistema do celular abrirá a página da máquina automaticamente.",
      });
      return;
    }

    try {
      setNfcBusy(true);
      // @ts-expect-error Web NFC ainda não faz parte dos tipos DOM padrão.
      const reader = new window.NDEFReader();
      await reader.scan();
      setMessage({ kind: "info", text: "Leitor ativo. Aproxime a etiqueta NFC do celular." });
      reader.onreading = (event: {
        message: { records: Array<{ data?: BufferSource; recordType?: string }> };
      }) => {
        for (const record of event.message.records) {
          if (!record.data) continue;
          try {
            const decoded = new TextDecoder().decode(record.data);
            const machineId = extractMachineId(decoded);
            if (machineId) {
              setNfcBusy(false);
              openMachine(machineId);
              return;
            }
          } catch {
            // Try the next record.
          }
        }
        setNfcBusy(false);
        setMessage({ kind: "error", text: "A etiqueta não contém uma URL de máquina válida." });
      };
      reader.onreadingerror = () => {
        setNfcBusy(false);
        setMessage({ kind: "error", text: "Não foi possível ler esta etiqueta NFC." });
      };
    } catch (caught) {
      setNfcBusy(false);
      setMessage({
        kind: "error",
        text:
          caught instanceof Error
            ? `NFC indisponível: ${caught.message}`
            : "Não foi possível ativar o NFC.",
      });
    }
  };

  return (
    <div className="lav-shell">
      <Nav />
      <main className="container-page access-page">
        <header className="page-heading centered">
          <p className="eyebrow">Acompanhamento em tempo real</p>
          <h1>Acompanhe sua máquina</h1>
          <p>Escaneie o QR Code fixo ou aproxime o celular do cartão NFC da máquina.</p>
        </header>

        <section className="access-options" aria-label="Opções de acesso">
          <article className="glass access-option-card featured">
            <div className="access-icon">
              <QrCode size={34} />
            </div>
            <h2>QR Code</h2>
            <p>Aponte a câmera para o QR Code permanente da lavadora ou secadora.</p>
            <button
              className="button primary full"
              type="button"
              onClick={() => {
                setMessage(null);
                setShowScanner((value) => !value);
              }}
            >
              <Camera size={18} />
              {showScanner ? "Fechar câmera" : "Abrir câmera"}
            </button>
          </article>

          <article className="glass access-option-card">
            <div className="access-icon">
              <Nfc size={35} />
            </div>
            <h2>NFC</h2>
            <p>O cartão NFC contém a mesma URL permanente impressa no QR Code.</p>
            <button
              className="button secondary full"
              type="button"
              onClick={() => void handleNfc()}
              disabled={nfcBusy}
            >
              <Nfc size={18} />
              {nfcBusy ? "Aguardando etiqueta…" : "Ler etiqueta NFC"}
            </button>
          </article>
        </section>

        {showScanner && (
          <section className="glass scanner-panel" aria-label="Leitor de QR Code">
            <QRScanner
              onResult={handleValue}
              onError={(error) => setMessage({ kind: "error", text: error })}
            />
          </section>
        )}

        {message && (
          <div
            className={`notice ${message.kind === "error" ? "danger" : "info"}`}
            role={message.kind === "error" ? "alert" : "status"}
          >
            <Info size={18} />
            <span>{message.text}</span>
          </div>
        )}
      </main>
    </div>
  );
}
