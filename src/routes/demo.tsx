import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Waves,
  WashingMachine,
  Wind,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { StaffGate } from "@/components/staff/StaffGate";
import {
  STATUS_SHORT_LABEL,
  trackingPath,
  type LaundryMachine,
  type WashStatus,
} from "@/lib/washes";
import "@/styles/app.css";

const DEMO_MACHINE_ID = "lavadora-01";

const DEMO_STAGES: Array<{
  status: WashStatus;
  label: string;
  icon: React.ReactNode;
}> = [
  { status: "washing", label: "Iniciar lavagem", icon: <WashingMachine size={19} /> },
  { status: "rinsing", label: "Enxágue", icon: <Waves size={19} /> },
  { status: "spinning", label: "Centrifugação", icon: <RotateCcw size={19} /> },
  { status: "drying", label: "Secagem", icon: <Wind size={19} /> },
  { status: "ready", label: "Finalizar", icon: <CheckCircle2 size={19} /> },
];

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Modo demonstração — LavTudo" },
      {
        name: "description",
        content: "Controle rápido do ciclo LavTudo para a apresentação do TCC.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DemoPage,
});

function DemoPage() {
  return (
    <div className="lav-shell">
      <Nav />
      <StaffGate>{() => <DemoControls />}</StaffGate>
    </div>
  );
}

function DemoControls() {
  const [machine, setMachine] = useState<LaundryMachine | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMachine = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/machines/${DEMO_MACHINE_ID}`, { cache: "no-store" });
      const body = (await response.json()) as { machine?: LaundryMachine; error?: string };
      if (!response.ok || !body.machine) {
        throw new Error(body.error || "Não foi possível carregar a máquina de demonstração.");
      }
      setMachine(body.machine);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "A demonstração está indisponível.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMachine();
    const interval = window.setInterval(() => void loadMachine(true), 2000);
    return () => window.clearInterval(interval);
  }, [loadMachine]);

  const request = async (method: "POST" | "PATCH", body: object) => {
    const response = await fetch(`/api/machines/${DEMO_MACHINE_ID}`, {
      method,
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { machine?: LaundryMachine; error?: string };
    if (!response.ok || !payload.machine) {
      throw new Error(payload.error || "Não foi possível atualizar a demonstração.");
    }
    setMachine(payload.machine);
    return payload.machine;
  };

  const setDemoStatus = async (status: WashStatus) => {
    setBusy(true);
    setError(null);
    try {
      let current = machine;
      if (!current?.currentWash) {
        current = await request("POST", {
          serviceType: "standard",
          estimatedMinutes: 45,
          startedAt: new Date().toISOString(),
        });
      }
      if (current.currentWash?.status !== status) {
        await request("PATCH", { status });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao alterar o status.");
    } finally {
      setBusy(false);
    }
  };

  const resetDemo = async () => {
    setBusy(true);
    setError(null);
    try {
      if (machine?.currentWash) await request("PATCH", { action: "release" });
      else await loadMachine(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha ao resetar a demonstração.");
    } finally {
      setBusy(false);
    }
  };

  const status = machine?.currentWash?.status;

  return (
    <main className="container-page demo-page">
      <header className="page-heading demo-heading">
        <div>
          <p className="eyebrow">
            <Sparkles size={15} /> Apresentação do TCC
          </p>
          <h1>Modo demonstração</h1>
          <p>Controle a Lavadora 01 e acompanhe a atualização real no celular.</p>
        </div>
        <Link
          className="button ghost"
          to="/acompanhar/$machineId"
          params={{ machineId: DEMO_MACHINE_ID }}
          target="_blank"
        >
          <ExternalLink size={17} /> Abrir tela do cliente
        </Link>
      </header>

      <section className="glass demo-control-card" aria-labelledby="demo-controls-title">
        <div className="demo-machine-summary">
          <div className="demo-machine-icon" aria-hidden="true">
            <WashingMachine />
          </div>
          <div>
            <span>Máquina permanente</span>
            <h2 id="demo-controls-title">Lavadora 01</h2>
            <code>{trackingPath(DEMO_MACHINE_ID)}</code>
          </div>
          <span
            className={`machine-state-pill ${status ? `status-${status}` : "status-available"}`}
          >
            {status ? STATUS_SHORT_LABEL[status] : "Disponível"}
          </span>
        </div>

        {error && (
          <div className="notice danger" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="demo-loading" aria-label="Carregando demonstração">
            <div className="skeleton-line wide" />
            <div className="skeleton-block" />
          </div>
        ) : (
          <div className="demo-stage-grid" aria-label="Controles de status">
            {DEMO_STAGES.map((stage, index) => (
              <button
                className={`demo-stage-button ${status === stage.status ? "active" : ""}`}
                type="button"
                key={stage.status}
                disabled={busy}
                onClick={() => void setDemoStatus(stage.status)}
              >
                <span className="demo-stage-number">{index + 1}</span>
                <span aria-hidden="true">{stage.icon}</span>
                <strong>{stage.label}</strong>
              </button>
            ))}
          </div>
        )}

        <div className="demo-reset-row">
          <p>O celular atualiza automaticamente a cada poucos segundos, sem recarregar a página.</p>
          <button
            className="button danger-outline"
            type="button"
            disabled={busy}
            onClick={() => void resetDemo()}
          >
            <RotateCcw size={17} /> Resetar demonstração
          </button>
        </div>
      </section>
    </main>
  );
}
