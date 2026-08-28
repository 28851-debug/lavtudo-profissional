import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Nfc } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { trackingPath } from "@/lib/washes";

export function TrackingAccessCard({
  washId,
  compact = false,
}: {
  washId: string;
  compact?: boolean;
}) {
  const path = trackingPath(washId);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(new URL(path, window.location.origin).toString());
  }, [path]);

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={`tracking-access ${compact ? "compact" : ""}`}>
      <div className="qr-frame" aria-label={`QR Code da lavagem ${washId}`}>
        {url ? (
          <QRCodeSVG
            value={url}
            size={compact ? 116 : 176}
            level="M"
            marginSize={2}
            title={`Acompanhar lavagem ${washId}`}
            bgColor="#ffffff"
            fgColor="#18065f"
          />
        ) : (
          <div className="qr-placeholder" />
        )}
      </div>
      <div className="tracking-access-copy">
        <p className="eyebrow">QR Code + NFC</p>
        <h3>Lavagem #{washId}</h3>
        <p>Grave esta mesma URL na etiqueta NFC. QR e NFC abrem o acompanhamento desta lavagem.</p>
        <code>{path}</code>
        <div className="inline-actions">
          <button className="button secondary small" type="button" onClick={copy} disabled={!url}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copiado" : "Copiar URL"}
          </button>
          <Link
            className="button ghost small"
            to="/acompanhar/$washId"
            params={{ washId }}
            target="_blank"
          >
            <ExternalLink size={16} />
            Abrir cliente
          </Link>
        </div>
        <div className="nfc-note">
          <Nfc size={17} aria-hidden="true" />
          Compatível com tags NFC que armazenem uma URL (registro NDEF URI).
        </div>
      </div>
    </div>
  );
}
