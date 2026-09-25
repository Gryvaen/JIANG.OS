"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ServerDetail, ServerNode } from "@/domains/servers/types";
const STATUS_LABEL: Record<string, string> = { online: "Online", degraded: "Degraded", offline: "Offline", unknown: "Unknown" };
function relativeTime(iso: string | null) { if (!iso) return "never"; const diff = (Date.now() - new Date(iso).getTime()) / 1000; if (diff < 60) return `${Math.floor(diff)}s ago`; if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`; return `${Math.floor(diff / 86400)}d ago` }
function ServerDetailView({ detail, onBack }: { detail: ServerDetail; onBack: () => void }) {
  const { server, metrics, incidents } = detail;
  const stale = !server.lastHeartbeatAt || (Date.now() - new Date(server.lastHeartbeatAt).getTime()) > 90000;
  const chartData = metrics.map(m => ({ time: new Date(m.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), cpu: m.cpuPercent, memory: m.memoryPercent, disk: m.diskPercent }));
  return <div className="app-page">
    <button className="back" onClick={onBack}><ArrowLeft /> All servers</button>
    <span className="eyebrow">{server.hostname}</span>
    <h1>{server.name}</h1>
    <p className="server-status"><span className={`status-dot status-${server.status}`} /><b className={`status-${server.status}`}>{STATUS_LABEL[server.status]}</b><small>{stale ? `Last updated ${relativeTime(server.lastHeartbeatAt)} — may be stale` : `Last updated ${relativeTime(server.lastHeartbeatAt)}`}</small></p>
    <div className="metric-row"><div><b>{server.lastMetrics ? `${Math.round(server.lastMetrics.cpuPercent)}%` : "—"}</b><span>CPU</span></div><div><b>{server.lastMetrics ? `${Math.round(server.lastMetrics.memoryPercent)}%` : "—"}</b><span>MEMORY</span></div><div><b>{server.lastMetrics ? `${Math.round(server.lastMetrics.diskPercent)}%` : "—"}</b><span>DISK</span></div></div>
    {chartData.length > 1 && <div className="server-chart"><ResponsiveContainer width="100%" height={220}><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="var(--line)" /><XAxis dataKey="time" stroke="var(--muted)" fontSize={11} /><YAxis stroke="var(--muted)" fontSize={11} /><Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)" }} /><Line type="monotone" dataKey="cpu" stroke="var(--accent)" dot={false} strokeWidth={2} /><Line type="monotone" dataKey="memory" stroke="#73a7ff" dot={false} strokeWidth={2} /><Line type="monotone" dataKey="disk" stroke="var(--danger)" dot={false} strokeWidth={2} /></LineChart></ResponsiveContainer></div>}
    <h3>INCIDENTS</h3>
    {!incidents.length ? <p className="muted">No incidents recorded.</p> : <div className="repo-list">{incidents.map(i => <div key={i.id}><div><b>{i.title}</b><p>{i.body || i.source}</p></div><span>{i.status === "open" ? `OPEN · ${relativeTime(i.openedAt)}` : `RESOLVED · ${relativeTime(i.resolvedAt)}`}</span></div>)}</div>}
  </div>;
}
export function ServersApp({ payload }: { payload?: { item?: string } }) {
  const [servers, setServers] = useState<ServerNode[] | null>(null);
  const [mode, setMode] = useState<"live" | "unavailable">("live");
  const [selectedId, setSelectedId] = useState<string | undefined>(payload?.item);
  const [detail, setDetail] = useState<ServerDetail | null>(null);
  useEffect(() => { fetch("/api/admin/servers").then(r => r.json()).then(d => { setServers(d.servers ?? []); setMode(d.mode) }).catch(() => setMode("unavailable")) }, []);
  useEffect(() => { if (!selectedId) { setDetail(null); return } setDetail(null); fetch(`/api/admin/servers/${selectedId}`).then(r => r.json()).then(d => setDetail(d.detail)).catch(() => setDetail(null)) }, [selectedId]);
  if (mode === "unavailable") return <div className="app-page"><div className="app-heading"><span>SERVERS</span><h1>Infrastructure</h1></div><p className="empty-hint">Server data is unavailable right now.</p></div>;
  if (selectedId) return detail ? <ServerDetailView detail={detail} onBack={() => setSelectedId(undefined)} /> : <div className="app-page"><button className="back" onClick={() => setSelectedId(undefined)}><ArrowLeft /> All servers</button><p className="muted">Loading…</p></div>;
  return <div className="app-page"><div className="app-heading"><span>INFRASTRUCTURE</span><h1>Servers</h1><p>Nodes, metrics and incidents.</p></div>{!servers?.length ? <p className="empty-hint">No servers registered yet.</p> : <div className="project-list">{servers.map(s => <button key={s.id} onClick={() => setSelectedId(s.id)}><span className={`status-dot status-${s.status}`} /><div><h2>{s.name}</h2><p>{s.hostname}</p><small>{relativeTime(s.lastHeartbeatAt)}</small></div><b className={`status-${s.status}`}>{STATUS_LABEL[s.status]}</b><ArrowUpRight /></button>)}</div>}</div>;
}
