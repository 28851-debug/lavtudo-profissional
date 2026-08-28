export const WASH_STATUSES = [
  "waiting",
  "washing",
  "rinsing",
  "spinning",
  "drying",
  "ready",
  "collected",
  "cancelled",
] as const;

export type WashStatus = (typeof WASH_STATUSES)[number];

export type WashHistoryEntry = {
  id: string;
  status: WashStatus;
  label: string;
  at: string;
  actor: "system" | "employee";
};

export type Wash = {
  id: string;
  customerName: string;
  machineLabel: string;
  serviceType: "wash" | "wash-dry";
  status: WashStatus;
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  readyAt: string | null;
  history: WashHistoryEntry[];
};

export type WashCreateInput = Pick<
  Wash,
  "customerName" | "machineLabel" | "serviceType" | "estimatedMinutes"
>;

export const STATUS_LABEL: Record<WashStatus, string> = {
  waiting: "Aguardando início",
  washing: "Lavagem em andamento",
  rinsing: "Enxágue em andamento",
  spinning: "Centrifugação em andamento",
  drying: "Secagem em andamento",
  ready: "Pronta para retirada",
  collected: "Roupa retirada",
  cancelled: "Lavagem cancelada",
};

export const STATUS_SHORT_LABEL: Record<WashStatus, string> = {
  waiting: "Aguardando",
  washing: "Lavagem",
  rinsing: "Enxágue",
  spinning: "Centrifugação",
  drying: "Secagem",
  ready: "Finalizada",
  collected: "Retirada",
  cancelled: "Cancelada",
};

export const CUSTOMER_STATUS_MESSAGE: Record<WashStatus, string> = {
  waiting: "Sua lavagem foi registrada e será iniciada em breve.",
  washing: "Suas roupas estão sendo lavadas.",
  rinsing: "O sabão está sendo removido das suas roupas.",
  spinning: "Suas roupas estão na etapa de centrifugação.",
  drying: "Suas roupas estão sendo secadas.",
  ready: "Sua roupa está pronta para retirada!",
  collected: "Esta lavagem foi retirada. Obrigado por escolher a LavTudo!",
  cancelled: "Esta lavagem foi cancelada. Procure um funcionário para atendimento.",
};

export const TRACKING_STAGES: WashStatus[] = [
  "waiting",
  "washing",
  "rinsing",
  "spinning",
  "drying",
  "ready",
];

export const STAFF_CONTROL_STATUSES: WashStatus[] = [
  "washing",
  "rinsing",
  "spinning",
  "drying",
  "ready",
];

export function isWashStatus(value: unknown): value is WashStatus {
  return typeof value === "string" && WASH_STATUSES.includes(value as WashStatus);
}

export function progressForStatus(status: WashStatus): number {
  switch (status) {
    case "waiting":
      return 0;
    case "washing":
      return 20;
    case "rinsing":
      return 45;
    case "spinning":
      return 68;
    case "drying":
      return 84;
    case "ready":
    case "collected":
      return 100;
    case "cancelled":
      return 0;
  }
}

export function formatWashDate(value: string | null, includeDate = false): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    ...(includeDate ? { day: "2-digit", month: "2-digit", year: "numeric" } : {}),
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function trackingPath(id: string): string {
  return `/acompanhar/${encodeURIComponent(id)}`;
}
