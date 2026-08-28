import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { WashingMachine, Wind, Thermometer, Droplets, Clock, CheckCircle2 } from "lucide-react";
import {
  STATUS_LABEL,
  formatClock,
  formatDuration,
  progressPercent,
  stagesFor,
  type Machine,
} from "@/lib/machines";
import { WashingAnim } from "./WashingAnim";

function badgeClass(m: Machine) {
  if (m.status === "available") return "badge available";
  if (m.status === "finished") return "badge finished";
  if (m.status === "paused") return "badge paused";
  return "badge active";
}

function estimatedFinish(m: Machine): number | null {
  if (m.status === "available" || m.status === "finished") return null;
  return Date.now() + m.remainingSeconds * 1000;
}

export function MachineDashboard({ machine }: { machine: Machine }) {
  const pct = progressPercent(machine);
  const stages = stagesFor(machine.type);
  const currentIdx = stages.indexOf(machine.status);
  const Icon = machine.type === "washer" ? WashingMachine : Wind;
  const isDryer = machine.type === "dryer";

  return (
    <div className="container-page">
      <Link
        to="/scan"
        className="lav-nav-link"
        style={{ display: "inline-block", marginBottom: 8 }}
      >
        ← Voltar
      </Link>

      <motion.div
        className="glass mach-header"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mach-icon-wrap">
          <Icon size={40} color="#fff" />
        </div>
        <div className="mach-title" style={{ flex: 1 }}>
          <h1>{machine.name}</h1>
          <p>{machine.process}</p>
          <span className={badgeClass(machine)}>{STATUS_LABEL[machine.status]}</span>
        </div>
      </motion.div>

      <div className="mach-grid">
        <motion.div
          className="glass progress-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <h3>Tempo restante</h3>
          <div className="progress-time">{formatDuration(machine.remainingSeconds)}</div>
          <div className="progress-sub">{pct.toFixed(0)}% concluído</div>
          <div className="progress-bar-outer" aria-label="Progresso do ciclo">
            <div className="progress-bar-inner" style={{ width: `${pct}%` }} />
          </div>
          <WashingAnim machine={machine} />
        </motion.div>

        <motion.div
          className="glass stats-grid"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {isDryer && (
            <Stat
              icon={<Thermometer size={20} color="#f59e0b" />}
              label="Temperatura"
              value={`${machine.tempC}°C`}
            />
          )}
          {!isDryer && (
            <Stat
              icon={<Droplets size={20} color="#38bdf8" />}
              label="Água"
              value={`${machine.waterLiters} L`}
            />
          )}
          <Stat
            icon={<Clock size={20} color="#a78bfa" />}
            label="Início"
            value={formatClock(machine.startedAt)}
          />
          <Stat
            icon={<Clock size={20} color="#7c5cbf" />}
            label="Previsão"
            value={formatClock(estimatedFinish(machine))}
          />
          <Stat
            icon={<CheckCircle2 size={20} color={machine.available ? "#22c55e" : "#f43f5e"} />}
            label="Disponibilidade"
            value={machine.available ? "Disponível" : "Em uso"}
          />
        </motion.div>
      </div>

      <motion.div
        className="glass timeline"
        style={{ marginTop: 14 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h3>Linha do tempo</h3>
        <div className="timeline-list">
          {stages.map((s, i) => {
            const done = i < currentIdx || machine.status === "finished";
            const current = i === currentIdx && machine.status !== "finished";
            return (
              <div
                key={s}
                className={`timeline-row ${done ? "done" : ""} ${current ? "current" : ""}`}
              >
                <div className="timeline-dot">{i + 1}</div>
                <div className="timeline-label">{STATUS_LABEL[s]}</div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="stat-item">
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icon}
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export function MachineSkeleton() {
  return (
    <div className="container-page">
      <div className="skeleton" style={{ height: 100, marginBottom: 14 }} />
      <div className="skeleton" style={{ height: 260, marginBottom: 14 }} />
      <div className="skeleton" style={{ height: 200 }} />
    </div>
  );
}
