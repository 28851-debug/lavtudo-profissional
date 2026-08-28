import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  CHANNEL_NAME,
  DEFAULT_MACHINES,
  STORAGE_KEY,
  stageFromProgress,
  stagesFor,
  type Machine,
  type MachineStatus,
} from "@/lib/machines";

type Ctx = {
  machines: Machine[];
  hydrated: boolean;
  getMachine: (id: string) => Machine | undefined;
  updateMachine: (id: string, patch: Partial<Machine>) => void;
  resetAll: () => void;
  action: (id: string, action: MachineAction) => void;
};

export type MachineAction = "start" | "pause" | "resume" | "reset" | "finish";

const MachineCtx = createContext<Ctx | null>(null);

function loadInitial(): Machine[] {
  if (typeof window === "undefined") return DEFAULT_MACHINES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MACHINES;
    const parsed = JSON.parse(raw) as Machine[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_MACHINES;
    // ensure all expected IDs exist
    const byId = new Map(parsed.map((m) => [m.id, m]));
    return DEFAULT_MACHINES.map((d) => byId.get(d.id) ?? d);
  } catch {
    return DEFAULT_MACHINES;
  }
}

export function MachineProvider({ children }: { children: ReactNode }) {
  // SSR-safe: start with defaults, hydrate from storage after mount
  const [machines, setMachines] = useState<Machine[]>(DEFAULT_MACHINES);
  const [hydrated, setHydrated] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const skipBroadcast = useRef(false);

  // Hydrate + subscribe to cross-tab sync
  useEffect(() => {
    setMachines(loadInitial());
    setHydrated(true);

    if (typeof BroadcastChannel !== "undefined") {
      const ch = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = ch;
      ch.onmessage = (ev) => {
        if (ev.data?.type === "machines" && Array.isArray(ev.data.payload)) {
          skipBroadcast.current = true;
          setMachines(ev.data.payload);
        }
      };
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          skipBroadcast.current = true;
          setMachines(JSON.parse(e.newValue));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, []);

  // Persist & broadcast on every change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(machines));
    } catch {
      // ignore quota errors
    }
    if (skipBroadcast.current) {
      skipBroadcast.current = false;
      return;
    }
    channelRef.current?.postMessage({ type: "machines", payload: machines });
  }, [machines, hydrated]);

  // Fake realtime tick: 1s
  useEffect(() => {
    if (!hydrated) return;
    const t = window.setInterval(() => {
      setMachines((prev) =>
        prev.map((m) => {
          const activeStatuses: MachineStatus[] = [
            "filling",
            "washing",
            "rinsing",
            "spinning",
            "drying",
            "cooling",
          ];
          if (!activeStatuses.includes(m.status)) return m;
          const remaining = Math.max(0, m.remainingSeconds - 1);
          const next: Machine = { ...m, remainingSeconds: remaining };
          if (remaining === 0) {
            next.status = "finished";
            next.process = "Ciclo finalizado";
            next.available = true;
          } else {
            const stage = stageFromProgress(next);
            next.status = stage;
            next.process = processLabel(stage);
          }
          return next;
        }),
      );
    }, 1000);
    return () => window.clearInterval(t);
  }, [hydrated]);

  const getMachine = useCallback((id: string) => machines.find((m) => m.id === id), [machines]);

  const updateMachine = useCallback((id: string, patch: Partial<Machine>) => {
    setMachines((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const resetAll = useCallback(() => {
    setMachines(DEFAULT_MACHINES);
  }, []);

  const action = useCallback((id: string, act: MachineAction) => {
    setMachines((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        switch (act) {
          case "start": {
            const stages = stagesFor(m.type);
            const first = stages[1] ?? stages[0];
            return {
              ...m,
              status: first,
              process: processLabel(first),
              startedAt: Date.now(),
              remainingSeconds: m.remainingSeconds > 0 ? m.remainingSeconds : m.totalSeconds,
              available: false,
            };
          }
          case "pause":
            return { ...m, status: "paused", process: "Pausado" };
          case "resume": {
            const stage = stageFromProgress(m);
            return { ...m, status: stage, process: processLabel(stage) };
          }
          case "reset":
            return {
              ...m,
              status: "available",
              process: "Aguardando",
              remainingSeconds: m.totalSeconds,
              startedAt: null,
              available: true,
            };
          case "finish":
            return {
              ...m,
              status: "finished",
              process: "Ciclo finalizado",
              remainingSeconds: 0,
              available: true,
            };
        }
      }),
    );
  }, []);

  const value = useMemo<Ctx>(
    () => ({ machines, hydrated, getMachine, updateMachine, resetAll, action }),
    [machines, hydrated, getMachine, updateMachine, resetAll, action],
  );

  return <MachineCtx.Provider value={value}>{children}</MachineCtx.Provider>;
}

export function useMachines() {
  const ctx = useContext(MachineCtx);
  if (!ctx) throw new Error("useMachines must be used within MachineProvider");
  return ctx;
}

function processLabel(status: MachineStatus): string {
  switch (status) {
    case "filling":
      return "Enchendo o tambor";
    case "washing":
      return "Lavagem principal";
    case "rinsing":
      return "Enxágue";
    case "spinning":
      return "Centrifugação";
    case "drying":
      return "Secagem";
    case "cooling":
      return "Resfriamento";
    case "finished":
      return "Ciclo finalizado";
    case "paused":
      return "Pausado";
    case "waiting":
      return "Aguardando";
    default:
      return "Aguardando";
  }
}
