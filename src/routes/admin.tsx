import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DatabaseZap,
  History,
  LogOut,
  Plus,
  QrCode,
  RefreshCw,
  WashingMachine,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { StaffGate } from "@/components/staff/StaffGate";
import { StatusControls } from "@/components/staff/StatusControls";
import { TrackingAccessCard } from "@/components/staff/TrackingAccessCard";
import { DEFAULT_MACHINES } from "@/lib/machines";
import {
  STATUS_SHORT_LABEL,
  formatWashDate,
  type Wash,
  type WashCreateInput,
  type WashStatus,
} from "@/lib/washes";
import "@/styles/app.css";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel do funcionário — LavTudo" },
      { name: "description", content: "Painel seguro de acompanhamento das lavagens LavTudo." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  return (
    <div className="lav-shell">
      <Nav />
      <StaffGate>{(session) => <EmployeeDashboard onLogout={session.logout} />}</StaffGate>
    </div>
  );
}

function EmployeeDashboard({ onLogout }: { onLogout: () => Promise<void> }) {
  const [washes, setWashes] = useState<Wash[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedQrId, setSelectedQrId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const loadWashes = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/washes", { cache: "no-store" });
      const body = (await response.json()) as {
        washes?: Wash[];
        error?: string;
      };
      if (!response.ok || !body.washes) throw new Error(body.error || "Falha ao carregar.");
      setWashes(body.washes);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar as lavagens.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWashes();
    const interval = window.setInterval(() => void loadWashes(true), 2500);
    return () => window.clearInterval(interval);
  }, [loadWashes]);

  const mutateWash = async (id: string, body: { status: WashStatus } | { action: "reset" }) => {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/washes/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { wash?: Wash; error?: string };
      if (!response.ok || !payload.wash) throw new Error(payload.error || "Falha ao atualizar.");
      setWashes((current) =>
        current
          .map((wash) => (wash.id === id ? payload.wash! : wash))
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível atualizar o status.");
    } finally {
      setBusyId(null);
    }
  };

  const activeWashes = useMemo(
    () => washes.filter((wash) => !["ready", "collected", "cancelled"].includes(wash.status)),
    [washes],
  );
  const completedWashes = useMemo(
    () => washes.filter((wash) => ["ready", "collected", "cancelled"].includes(wash.status)),
    [washes],
  );
  const visibleWashes = showHistory ? completedWashes : activeWashes;

  return (
    <main className="container-page employee-page">
      <header className="page-heading employee-heading">
        <div>
          <p className="eyebrow">Operação LavTudo</p>
          <h1>Painel do funcionário</h1>
          <p>Crie lavagens e atualize cada etapa em tempo real para o celular do cliente.</p>
        </div>
        <div className="heading-actions">
          <button className="button ghost" type="button" onClick={() => void onLogout()}>
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </header>

      <section className="dashboard-summary" aria-label="Resumo das lavagens">
        <SummaryCard
          label="Em acompanhamento"
          value={activeWashes.length}
          icon={<WashingMachine />}
        />
        <SummaryCard
          label="Prontas ou encerradas"
          value={completedWashes.length}
          icon={<History />}
        />
        <SummaryCard label="Armazenamento" value="Supabase" icon={<DatabaseZap />} textual />
      </section>

      <section className="equipment-section" aria-labelledby="equipment-title">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Equipamentos</p>
            <h2 id="equipment-title">Visão rápida das máquinas</h2>
          </div>
          <span>{DEFAULT_MACHINES.length} equipamentos</span>
        </div>
        <div className="equipment-grid">
          {DEFAULT_MACHINES.map((machine) => {
            const assignedWash = activeWashes.find((wash) => wash.machineLabel === machine.name);
            return (
              <article className="glass equipment-card" key={machine.id}>
                <span className="equipment-icon" aria-hidden="true">
                  <WashingMachine size={21} />
                </span>
                <div>
                  <strong>{machine.name}</strong>
                  <span>{machine.type === "washer" ? "Lavadora" : "Secadora"}</span>
                </div>
                <span className={`equipment-state ${assignedWash ? "busy" : "available"}`}>
                  {assignedWash ? `Lavagem #${assignedWash.id}` : "Disponível"}
                </span>
              </article>
            );
          })}
        </div>
      </section>

      {error && (
        <div className="notice danger" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void loadWashes()}>
            Tentar novamente
          </button>
        </div>
      )}

      <CreateWashCard
        onCreated={(wash) => {
          setWashes((current) => [wash, ...current]);
          setSelectedQrId(wash.id);
          setShowHistory(false);
        }}
      />

      {selectedQrId && (
        <section className="glass selected-access-card" aria-label="Acesso da nova lavagem">
          <TrackingAccessCard washId={selectedQrId} />
          <button className="close-text-button" type="button" onClick={() => setSelectedQrId(null)}>
            Fechar
          </button>
        </section>
      )}

      <div className="list-toolbar">
        <div className="segmented-control" aria-label="Filtrar lavagens">
          <button
            type="button"
            className={!showHistory ? "active" : ""}
            onClick={() => setShowHistory(false)}
          >
            Em andamento <span>{activeWashes.length}</span>
          </button>
          <button
            type="button"
            className={showHistory ? "active" : ""}
            onClick={() => setShowHistory(true)}
          >
            Histórico <span>{completedWashes.length}</span>
          </button>
        </div>
        <button className="button ghost small" type="button" onClick={() => void loadWashes()}>
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="staff-wash-list" aria-label="Carregando lavagens">
          <div className="glass skeleton-panel" />
          <div className="glass skeleton-panel" />
        </div>
      ) : visibleWashes.length === 0 ? (
        <section className="glass empty-state">
          <WashingMachine size={36} aria-hidden="true" />
          <h2>{showHistory ? "Nenhuma lavagem encerrada" : "Nenhuma lavagem ativa"}</h2>
          <p>{showHistory ? "O histórico aparecerá aqui." : "Crie uma lavagem para começar."}</p>
        </section>
      ) : (
        <div className="staff-wash-list">
          {visibleWashes.map((wash) => (
            <article className="glass staff-wash-card" key={wash.id}>
              <div className="staff-wash-head">
                <div>
                  <p className="eyebrow">Lavagem #{wash.id}</p>
                  <h2>{wash.customerName}</h2>
                  <p>
                    {wash.machineLabel} ·{" "}
                    {wash.serviceType === "wash-dry" ? "Lavagem e secagem" : "Lavagem"}
                  </p>
                </div>
                <span className={`status-chip status-${wash.status}`}>
                  {STATUS_SHORT_LABEL[wash.status]}
                </span>
              </div>

              <div className="wash-meta-row">
                <span>Criada {formatWashDate(wash.createdAt, true)}</span>
                <span>Atualizada {formatWashDate(wash.updatedAt)}</span>
              </div>

              {!showHistory && (
                <StatusControls
                  wash={wash}
                  busy={busyId === wash.id}
                  onStatus={(status) => void mutateWash(wash.id, { status })}
                />
              )}

              <div className="staff-card-footer">
                <button
                  className="button secondary small"
                  type="button"
                  onClick={() =>
                    setSelectedQrId((current) => (current === wash.id ? null : wash.id))
                  }
                >
                  <QrCode size={16} />
                  QR Code e NFC
                </button>
                {!showHistory && (
                  <button
                    className="button ghost small"
                    type="button"
                    onClick={() => void mutateWash(wash.id, { action: "reset" })}
                    disabled={busyId === wash.id}
                  >
                    <RefreshCw size={16} />
                    Resetar
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function CreateWashCard({ onCreated }: { onCreated: (wash: Wash) => void }) {
  const [form, setForm] = useState<WashCreateInput>({
    customerName: "",
    machineLabel: "Lavadora 01",
    serviceType: "wash-dry",
    estimatedMinutes: 45,
  });
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/washes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await response.json()) as { wash?: Wash; error?: string };
      if (!response.ok || !body.wash) throw new Error(body.error || "Falha ao criar lavagem.");
      onCreated(body.wash);
      setForm((current) => ({ ...current, customerName: "" }));
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível criar a lavagem.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={`glass create-wash-card ${open ? "open" : ""}`}>
      <button
        className="create-wash-toggle"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="create-wash-icon">
          <Plus size={20} />
        </span>
        <span>
          <strong>Nova lavagem</strong>
          <small>Gere um identificador, QR Code e URL únicos</small>
        </span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <form className="create-wash-form" onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="customer-name">Nome do cliente</label>
            <input
              id="customer-name"
              value={form.customerName}
              onChange={(event) => setForm({ ...form, customerName: event.target.value })}
              placeholder="Ex.: Maria Silva"
              minLength={2}
              maxLength={80}
              required
              autoFocus
            />
          </div>
          <div className="form-field">
            <label htmlFor="machine-label">Equipamento</label>
            <select
              id="machine-label"
              value={form.machineLabel}
              onChange={(event) => setForm({ ...form, machineLabel: event.target.value })}
              required
            >
              {DEFAULT_MACHINES.map((machine) => (
                <option value={machine.name} key={machine.id}>
                  {machine.name} — {machine.type === "washer" ? "Lavadora" : "Secadora"}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="service-type">Serviço</label>
            <select
              id="service-type"
              value={form.serviceType}
              onChange={(event) =>
                setForm({
                  ...form,
                  serviceType: event.target.value as WashCreateInput["serviceType"],
                })
              }
            >
              <option value="wash-dry">Lavagem e secagem</option>
              <option value="wash">Somente lavagem</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="estimated-minutes">Previsão (minutos)</label>
            <input
              id="estimated-minutes"
              type="number"
              min={5}
              max={240}
              value={form.estimatedMinutes}
              onChange={(event) =>
                setForm({ ...form, estimatedMinutes: Number(event.target.value) })
              }
              required
            />
          </div>
          {error && (
            <div className="notice danger form-notice" role="alert">
              {error}
            </div>
          )}
          <div className="form-actions">
            <button className="button ghost" type="button" onClick={() => setOpen(false)}>
              Cancelar
            </button>
            <button className="button primary" type="submit" disabled={submitting}>
              <Plus size={17} />
              {submitting ? "Criando…" : "Criar e gerar QR Code"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  textual = false,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  textual?: boolean;
}) {
  return (
    <div className="glass summary-card">
      <span className="summary-icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <strong className={textual ? "textual" : ""}>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
