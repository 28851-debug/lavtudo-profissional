import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Hash, Info, Keyboard, Nfc, QrCode } from "lucide-react";
import { Nav } from "@/components/Nav";
import { QRScanner } from "@/components/scan/QRScanner";
import "@/styles/app.css";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Acompanhar lavagem — LavTudo" },
      {
        name: "description",
        content: "Escaneie o QR Code, use a etiqueta NFC ou informe o número da lavagem.",
      },
    ],
  }),
  component: ScanPage,
});

const LEGACY_MACHINE_IDS = new Set(["maq1", "maq2", "sec1", "sec2"]);

type Destination = { kind: "wash" | "machine"; id: string };

function extractDestination(value: string): Destination | null {
  const text = value.trim();
  if (/^#?\d{1,12}$/u.test(text)) return { kind: "wash", id: text.replace(/^#/u, "") };
  if (LEGACY_MACHINE_IDS.has(text.toLowerCase()))
    return { kind: "machine", id: text.toLowerCase() };

  try {
    const url = new URL(text);
    const segments = url.pathname.split("/").filter(Boolean);
    const trackingIndex = segments.indexOf("acompanhar");
    const washId = trackingIndex >= 0 ? segments[trackingIndex + 1] : undefined;
    if (washId && /^\d{1,12}$/u.test(washId)) return { kind: "wash", id: washId };
    const lastSegment = segments.at(-1)?.toLowerCase();
    if (lastSegment && LEGACY_MACHINE_IDS.has(lastSegment)) {
      return { kind: "machine", id: lastSegment };
    }
  } catch {
    // The value may be a plain identifier rather than a URL.
  }

  return null;
}

function ScanPage() {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [manualId, setManualId] = useState("");
  const [message, setMessage] = useState<{ kind: "info" | "error"; text: string } | null>(null);
  const [nfcBusy, setNfcBusy] = useState(false);

  const openDestination = (destination: Destination) => {
    if (destination.kind === "wash") {
      void navigate({ to: "/acompanhar/$washId", params: { washId: destination.id } });
    } else {
      void navigate({ to: "/$machineId", params: { machineId: destination.id } });
    }
  };

  const handleValue = (value: string) => {
    const destination = extractDestination(value);
    if (!destination) {
      setMessage({
        kind: "error",
        text: "Não reconhecemos este acesso. Leia o QR Code, aproxime a etiqueta NFC ou informe o número da lavagem.",
      });
      return;
    }
    setShowScanner(false);
    openDestination(destination);
  };

  const handleNfc = async () => {
    setMessage(null);
    if (!("NDEFReader" in window)) {
      setMessage({
        kind: "info",
        text: "Neste aparelho, aproxime a etiqueta NFC fora do navegador. O sistema do celular abrirá a URL da lavagem automaticamente.",
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
            const destination = extractDestination(decoded);
            if (destination) {
              setNfcBusy(false);
              openDestination(destination);
              return;
            }
          } catch {
            // Try the next record.
          }
        }
        setNfcBusy(false);
        setMessage({ kind: "error", text: "A etiqueta não contém uma URL de lavagem válida." });
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
          <h1>Abra sua lavagem</h1>
          <p>Escaneie o QR Code ou aproxime o celular da etiqueta NFC da sua lavagem.</p>
        </header>

        <section className="access-options" aria-label="Opções de acesso">
          <article className="glass access-option-card featured">
            <div className="access-icon">
              <QrCode size={34} />
            </div>
            <h2>QR Code</h2>
            <p>Aponte a câmera para o QR Code vinculado à sua lavagem.</p>
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
            <p>A etiqueta contém a mesma URL única do QR Code.</p>
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

        <section className="glass manual-code-card">
          <div className="manual-code-heading">
            <div className="access-icon small">
              <Keyboard size={23} />
            </div>
            <div>
              <h2>Informar número</h2>
              <p>Use esta opção somente se a equipe informou o número da lavagem.</p>
            </div>
          </div>
          <form
            className="manual-code-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleValue(manualId);
            }}
          >
            <label className="sr-only" htmlFor="wash-code">
              Número da lavagem
            </label>
            <div className="code-input-wrap">
              <Hash size={19} />
              <input
                id="wash-code"
                inputMode="numeric"
                pattern="[0-9#]*"
                title="Digite apenas o número da lavagem"
                placeholder="1024"
                value={manualId}
                onChange={(event) => setManualId(event.target.value)}
                required
              />
            </div>
            <button className="button primary" type="submit">
              Acompanhar
            </button>
          </form>
        </section>

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
