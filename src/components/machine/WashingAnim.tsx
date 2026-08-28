import type { Machine } from "@/lib/machines";

const activeStatuses = new Set(["filling", "washing", "rinsing", "spinning", "drying", "cooling"]);

export function WashingAnim({ machine }: { machine: Machine }) {
  const running = activeStatuses.has(machine.status);
  return (
    <svg
      viewBox="0 0 200 220"
      className={`mach-anim ${running ? "" : "paused"}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.04" />
        </linearGradient>
        <radialGradient id="drum" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0" stopColor="#479fdf" />
          <stop offset="1" stopColor="#240b7e" />
        </radialGradient>
      </defs>
      <rect
        x="20"
        y="20"
        width="160"
        height="180"
        rx="18"
        fill="url(#body)"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
      />
      <rect x="34" y="34" width="132" height="18" rx="6" fill="rgba(255,255,255,0.08)" />
      <circle cx="52" cy="43" r="4" fill="#479fdf" />
      <circle cx="68" cy="43" r="4" fill="#7c5cbf" />
      <circle
        cx="100"
        cy="110"
        r="60"
        fill="rgba(0,0,0,0.35)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="2"
      />
      <g className="drum">
        <circle cx="100" cy="110" r="52" fill="url(#drum)" />
        <circle cx="100" cy="72" r="6" fill="rgba(255,255,255,0.85)" />
        <circle cx="138" cy="110" r="6" fill="rgba(255,255,255,0.85)" />
        <circle cx="100" cy="148" r="6" fill="rgba(255,255,255,0.85)" />
        <circle cx="62" cy="110" r="6" fill="rgba(255,255,255,0.85)" />
      </g>
      <circle cx="100" cy="110" r="10" fill="rgba(255,255,255,0.2)" />
    </svg>
  );
}
