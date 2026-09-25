"use client";
import { useEffect, useState } from "react";
import type { ServerNode } from "@/domains/servers/types";
const STATUS_LABEL: Record<string, string> = { online: "Online", degraded: "Degraded", offline: "Offline", unknown: "Unknown" };
export function MonitorApp({ windowCount }: { windowCount?: number }) {
  const [servers, setServers] = useState<ServerNode[] | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [online, setOnline] = useState(true);
  useEffect(() => { fetch("/api/admin/servers").then(r => r.json()).then(d => setServers(d.servers ?? [])).catch(() => setServers(null)) }, []);
  useEffect(() => { fetch("/api/public/content").then(r => setBackendOk(r.ok)).catch(() => setBackendOk(false)) }, []);
  useEffect(() => { setOnline(navigator.onLine); const on = () => setOnline(true); const off = () => setOnline(false); addEventListener("online", on); addEventListener("offline", off); return () => { removeEventListener("online", on); removeEventListener("offline", off) } }, []);
  const counts = (servers ?? []).reduce((acc, s) => { acc[s.status] = (acc[s.status] ?? 0) + 1; return acc }, {} as Record<string, number>);
  return <div className="app-page">
    <div className="app-heading"><span>MONITOR</span><h1>System</h1><p>Local session and backend health overview.</p></div>
    <div className="metric-row">
      <div><b>{windowCount ?? "—"}</b><span>OPEN WINDOWS</span></div>
      <div><b className={online ? "status-online" : "status-offline"}>{online ? "Online" : "Offline"}</b><span>NETWORK</span></div>
      <div><b className={backendOk === null ? "" : backendOk ? "status-online" : "status-offline"}>{backendOk === null ? "…" : backendOk ? "Reachable" : "Unreachable"}</b><span>BACKEND</span></div>
    </div>
    <h3>SERVERS</h3>
    {!servers?.length ? <p className="muted">No servers registered.</p> : <div className="repo-list">{(["online", "degraded", "offline", "unknown"] as const).filter(k => counts[k]).map(k => <div key={k}><div><b className={`status-${k}`}>{STATUS_LABEL[k]}</b></div><span>{counts[k]}</span></div>)}</div>}
  </div>;
}
