import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Info, Nfc, QrCode, ScanLine, Smartphone, Sparkles } from "lucide-react";
import { Nav } from "@/components/Nav";
import { QRScanner } from "@/components/scan/QRScanner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { isLaundryMachineId, type LaundryMachineId } from "@/lib/washes";
import "@/styles/app.css";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Acompanhar lavagem — LavTudo" },
      {
        name: "description",
        content: "Escaneie o QR Code impresso no cartão NFC permanente da máquina.",
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
  const [nfcOpen, setNfcOpen] = useState(false);

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
    setNfcOpen(true);
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
          <h1>Leia o cartão da máquina</h1>
          <p>
            Escaneie o QR Code impresso no cartão NFC fixo ou aproxime o celular do mesmo cartão.
          </p>
        </header>

        <section className="access-options" aria-label="Opções de acesso">
          <article className="glass access-option-card featured">
            <div className="access-icon">
              <QrCode size={34} />
            </div>
            <h2>QR do cartão NFC</h2>
            <p>Aponte a câmera para o QR Code impresso no cartão permanente da máquina.</p>
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
            <h2>Aproximação NFC</h2>
            <p>O chip NFC e o QR Code impresso no cartão abrem exatamente a mesma máquina.</p>
            <button
              className="button secondary full"
              type="button"
              onClick={() => void handleNfc()}
              disabled={nfcBusy}
            >
              <Nfc size={18} />
              {nfcBusy ? "Aguardando cartão…" : "Aproximar cartão NFC"}
            </button>
          </article>
        </section>

        <Dialog open={nfcOpen} onOpenChange={setNfcOpen}>
          <DialogContent className="nfc-dialog">
            <div className="nfc-dialog-visual" aria-hidden="true">
              <span className="nfc-signal-ring ring-one" />
              <span className="nfc-signal-ring ring-two" />
              <span className="nfc-signal-ring ring-three" />
              <div className="nfc-phone">
                <Smartphone size={70} strokeWidth={1.55} />
                <Nfc className="nfc-phone-symbol" size={27} strokeWidth={2.2} />
              </div>
              <div className="nfc-card">
                <Nfc size={25} />
                <span>LavTudo</span>
              </div>
            </div>

            <div className="nfc-dialog-copy">
              <p className="eyebrow">
                <Sparkles size={14} /> Leitura por aproximação
              </p>
              <DialogTitle>Aproxime seu dispositivo do cartão</DialogTitle>
              <DialogDescription>
                Encoste a parte superior do celular no cartão NFC da máquina e mantenha-o próximo
                por alguns segundos.
              </DialogDescription>
            </div>

            <div className="nfc-dialog-steps" aria-label="Como aproximar o cartão NFC">
              <div>
                <span>1</span>
                <p>
                  <strong>Desbloqueie o celular</strong>
                  Mantenha a tela ligada durante a leitura.
                </p>
              </div>
              <div>
                <span>2</span>
                <p>
                  <strong>Aproxime do cartão</strong>
                  Encoste devagar até o aparelho vibrar.
                </p>
              </div>
            </div>

            <div className={`nfc-dialog-status ${nfcBusy ? "is-listening" : ""}`} role="status">
              <span className="nfc-status-dot" aria-hidden="true" />
              <div>
                <strong>{nfcBusy ? "Leitor NFC ativo" : "Pronto para aproximação"}</strong>
                <span>
                  {nfcBusy
                    ? "Aguardando o cartão da máquina…"
                    : "O próprio celular abrirá o acompanhamento da máquina."}
                </span>
              </div>
            </div>

            <div className="nfc-dialog-actions">
              <DialogClose asChild>
                <button className="button ghost" type="button">
                  Fechar
                </button>
              </DialogClose>
              <DialogClose asChild>
                <button
                  className="button primary"
                  type="button"
                  onClick={() => {
                    setMessage(null);
                    setShowScanner(true);
                  }}
                >
                  <ScanLine size={18} /> Usar QR Code
                </button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>

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
