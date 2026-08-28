import { CheckCircle2, Gauge, Play, RotateCcw, Waves, Wind } from "lucide-react";
import {
  STAFF_CONTROL_STATUSES,
  STATUS_SHORT_LABEL,
  type Wash,
  type WashStatus,
} from "@/lib/washes";

const ICONS: Partial<Record<WashStatus, React.ReactNode>> = {
  washing: <Play size={18} />,
  rinsing: <Waves size={18} />,
  spinning: <Gauge size={18} />,
  drying: <Wind size={18} />,
  ready: <CheckCircle2 size={18} />,
};

export function StatusControls({
  wash,
  busy,
  onStatus,
  onReset,
}: {
  wash: Wash;
  busy: boolean;
  onStatus: (status: WashStatus) => void;
  onReset?: () => void;
}) {
  return (
    <div className="status-controls">
      {STAFF_CONTROL_STATUSES.map((status) => (
        <button
          key={status}
          className={`stage-button ${wash.status === status ? "active" : ""} ${status === "ready" ? "success" : ""}`}
          type="button"
          onClick={() => onStatus(status)}
          disabled={busy}
          aria-pressed={wash.status === status}
        >
          {ICONS[status]}
          <span>
            {status === "washing"
              ? "Iniciar lavagem"
              : status === "ready"
                ? "Finalizar"
                : STATUS_SHORT_LABEL[status]}
          </span>
        </button>
      ))}
      {onReset && (
        <button className="stage-button reset" type="button" onClick={onReset} disabled={busy}>
          <RotateCcw size={18} />
          <span>Voltar para aguardando</span>
        </button>
      )}
    </div>
  );
}
