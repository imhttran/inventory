"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";

type Health = {
  status?: string;
  service?: string;
  database?: string;
};

// Step 1 wiring check: the dashboard pings the Rust API's /api/health (through
// the Next.js /api/* proxy — same origin, no CORS) and shows backend +
// database status. Unauthenticated by design; no session required.
export function SystemStatus() {
  const [health, setHealth] = useState<Health | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/health`)
      .then(async (response) => {
        if (cancelled) return;
        setOnline(true);
        setHealth((await response.json().catch(() => ({}))) as Health);
      })
      .catch(() => {
        if (!cancelled) setOnline(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const backendLabel =
    online === null ? "checking…" : online ? "ok" : "unreachable";
  const databaseLabel = online
    ? health?.database === "ok"
      ? "ok"
      : "error"
    : "—";
  const backendClass =
    online === null
      ? "status-unknown"
      : online
        ? "status-ok"
        : "status-error";
  const databaseClass = online
    ? health?.database === "ok"
      ? "status-ok"
      : "status-error"
    : "status-unknown";

  return (
    <section className="system-status">
      <h2>System Status</h2>
      <div className="status-item">
        <span className="status-label">Rust API</span>
        <span className={`status-pill ${backendClass}`}>{backendLabel}</span>
      </div>
      <div className="status-item">
        <span className="status-label">PostgreSQL</span>
        <span className={`status-pill ${databaseClass}`}>{databaseLabel}</span>
      </div>
    </section>
  );
}
