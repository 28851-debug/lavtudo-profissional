import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  History,
  Radio,
  RefreshCw,
  Shirt,
  WashingMachine,
} from "lucide-react";
import { Nav } from "@/components/Nav";
import { useWashPolling } from "@/hooks/use-wash-polling";
import {
  CUSTOMER_STATUS_MESSAGE,
  STATUS_LABEL,
  STATUS_SHORT_LABEL,
  TRACKING_STAGES,
  formatWashDate,
  progressForStatus,
  type Wash,
} from "@/lib/washes";
import "@/styles/app.css";

export const Route = createFileRoute("/acompanhar/$washId")({
  beforeLoad: ({ params }) => {
    if (!/^\d{1,12}$/u.test(params.washId)) throw notFound();
  },
  head: ({ params }) => ({
    meta: [
      { title: `Lavagem #${params.washId} — LavTudo` },
      {
        name: "description",
        content: `Acompanhe em tempo real o status da lavagem #${params.washId} na LavTudo.`,
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TrackingPage,
  notFoundComponent: TrackingNotFound,
});

function TrackingPage() {
  const { washId } = Route.useParams();
  const { wash, loading, refreshing, error, retry } = useWashPolling(washId);

  return (
    <div className="lav-shell tracking-shell">
      <Nav compact />
      <main className="container-page tracking-page">
        <div className="tracking-topbar">
          <Link to="/scan" className="back-link">
            ← Voltar
          </Link>
          <div className={`live-indicator ${error ? "offline" : ""}`}>
            <Radio size={14} aria-hidden="true" />
            {error ? "Reconectando" : refreshing ? "Atualizando" : "Ao vivo"}
          </div>
        </div>

        {loading && !wash ? (
          <TrackingSkeleton />
        ) : !wash ? (
          <TrackingError message={error || "Lavagem não encontrada."} onRetry={retry} />
        ) : (
          <TrackingContent wash={wash} transientError={error} onRetry={retry} />
        )}
      </main>
    </div>
  );
}

function TrackingContent({
  wash,
  transientError,
  onRetry,
}: {
  wash: Wash;
  transientError: string | null;
  onRetry: () => void;
}) {
  const progress = progressForStatus(wash.status);
  const currentStageIndex = TRACKING_STAGES.indexOf(wash.status);
  const complete = wash.status === "ready" || wash.status === "collected";
  const exceptional = wash.status === "cancelled";
  const estimatedReady =
    wash.startedAt && !wash.readyAt
      ? new Date(new Date(wash.startedAt).getTime() + wash.estimatedMinutes * 60_000).toISOString()
      : wash.readyAt;
  const remainingMinutes =
    estimatedReady && !complete
      ? Math.min(
          wash.estimatedMinutes,
          Math.max(0, Math.ceil((new Date(estimatedReady).getTime() - Date.now()) / 60_000)),
        )
      : null;

  return (
    <>
      {transientError && (
        <div className="notice warning reconnect-notice" role="status">
          <AlertCircle size={18} />
          <span>Exibindo a última atualização. Tentando reconectar…</span>
          <button type="button" onClick={onRetry}>
            Tentar agora
          </button>
        </div>
      )}

      <section
        className={`glass customer-status-card ${complete ? "is-ready" : ""} ${exceptional ? "is-cancelled" : ""}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="order-number-row">
          <div>
            <p className="eyebrow">Acompanhamento da lavagem</p>
            <h1>Lavagem #{wash.id}</h1>
          </div>
          <span className={`status-chip status-${wash.status}`}>
            {STATUS_SHORT_LABEL[wash.status]}
          </span>
        </div>

        <div className="status-hero-icon" aria-hidden="true">
          {complete ? <CheckCircle2 size={48} /> : <Shirt size={44} />}
        </div>
        <p className="customer-status-label">{STATUS_LABEL[wash.status]}</p>
        <h2>{CUSTOMER_STATUS_MESSAGE[wash.status]}</h2>

        {!exceptional && (
          <div className="tracking-time-summary">
            <Clock3 size={22} aria-hidden="true" />
            <div>
              <strong>
                {complete
                  ? "Disponível para retirada"
                  : wash.status === "waiting"
                    ? `${wash.estimatedMinutes} minutos previstos`
                    : `${remainingMinutes ?? 0} minutos restantes`}
              </strong>
              <span>
                {estimatedReady
                  ? `${complete ? "Finalizada" : "Previsão de término"}: ${formatWashDate(estimatedReady)}`
                  : "A previsão começa assim que a equipe iniciar a lavagem."}
              </span>
            </div>
          </div>
        )}

        {!exceptional && (
          <div className="tracking-progress-wrap">
            <div className="tracking-progress-labels">
              <span>Progresso</span>
              <strong>{progress}%</strong>
            </div>
            <div
              className="tracking-progress"
              role="progressbar"
              aria-label="Progresso da lavagem"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <p className="last-update">Atualizado às {formatWashDate(wash.updatedAt)}</p>
      </section>

      <div className="customer-detail-grid">
        <section className="glass detail-card" aria-labelledby="details-title">
          <div className="section-heading">
            <WashingMachine size={21} aria-hidden="true" />
            <h2 id="details-title">Detalhes</h2>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Cliente</dt>
              <dd>{wash.customerName}</dd>
            </div>
            <div>
              <dt>Equipamento</dt>
              <dd>{wash.machineLabel}</dd>
            </div>
            <div>
              <dt>Serviço</dt>
              <dd>{wash.serviceType === "wash-dry" ? "Lavagem e secagem" : "Lavagem"}</dd>
            </div>
            <div>
              <dt>Início</dt>
              <dd>{formatWashDate(wash.startedAt)}</dd>
            </div>
            <div>
              <dt>{complete ? "Finalizada" : "Previsão"}</dt>
              <dd>{formatWashDate(estimatedReady)}</dd>
            </div>
            {!complete && remainingMinutes !== null && (
              <div>
                <dt>Tempo restante</dt>
                <dd>{remainingMinutes} min</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="glass timeline-card" aria-labelledby="steps-title">
          <div className="section-heading">
            <Clock3 size={21} aria-hidden="true" />
            <h2 id="steps-title">Etapas da lavagem</h2>
          </div>
          <ol className="customer-timeline">
            {TRACKING_STAGES.map((status, index) => {
              const done = complete || currentStageIndex > index;
              const current = currentStageIndex === index && !complete;
              return (
                <li key={status} className={`${done ? "done" : ""} ${current ? "current" : ""}`}>
                  <span className="timeline-marker">
                    {done ? <CheckCircle2 size={18} /> : index + 1}
                  </span>
                  <span>{STATUS_SHORT_LABEL[status]}</span>
                </li>
              );
            })}
          </ol>
        </section>
      </div>

      <section className="glass history-card" aria-labelledby="history-title">
        <div className="section-heading">
          <History size={21} aria-hidden="true" />
          <h2 id="history-title">Histórico de atualizações</h2>
        </div>
        <ol className="history-list">
          {[...wash.history].reverse().map((entry) => (
            <li key={entry.id}>
              <span className={`history-dot status-${entry.status}`} aria-hidden="true" />
              <div>
                <strong>{entry.label}</strong>
                <time dateTime={entry.at}>{formatWashDate(entry.at, true)}</time>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

function TrackingError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="glass centered-state" role="alert">
      <AlertCircle size={42} aria-hidden="true" />
      <h1>Não foi possível abrir o acompanhamento</h1>
      <p>{message}</p>
      <button className="button primary" type="button" onClick={onRetry}>
        <RefreshCw size={17} />
        Tentar novamente
      </button>
    </section>
  );
}

function TrackingNotFound() {
  return (
    <div className="lav-shell">
      <Nav compact />
      <main className="container-page">
        <TrackingError
          message="O identificador informado não é válido."
          onRetry={() => location.assign("/scan")}
        />
      </main>
    </div>
  );
}

function TrackingSkeleton() {
  return (
    <div className="tracking-skeleton" aria-label="Carregando acompanhamento">
      <div className="glass skeleton-panel large" />
      <div className="customer-detail-grid">
        <div className="glass skeleton-panel" />
        <div className="glass skeleton-panel" />
      </div>
    </div>
  );
}
