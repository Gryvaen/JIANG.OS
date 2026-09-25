"use client";
import { useEffect, useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/admin/delete-confirm-dialog";
import type { VaultRecordInput, VaultRecordRevealed, VaultRecordSummary } from "@/domains/vault/types";

async function unlockWithPasskey(): Promise<boolean> {
  const optionsRes = await fetch("/api/webauthn/authenticate/options", { method: "POST" });
  if (!optionsRes.ok) return false;
  const options = await optionsRes.json();
  try {
    const response = await startAuthentication(options);
    const verifyRes = await fetch("/api/webauthn/authenticate/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ response }) });
    return verifyRes.ok;
  } catch {
    return false;
  }
}

function VaultForm({ item, onCancel, onSubmit }: { item?: VaultRecordRevealed; onCancel: () => void; onSubmit: (input: VaultRecordInput) => void }) {
  const [form, setForm] = useState<VaultRecordInput>({
    alias: item?.alias ?? "", provider: item?.provider ?? "", tags: item?.tags ?? [],
    redactedAddress: item?.redactedAddress ?? "", username: item?.username ?? "", port: item?.port ?? null,
    notes: item?.notes ?? "", managerRef: item?.managerRef ?? "", sshCommandTemplate: item?.sshCommandTemplate ?? ""
  });
  return <form className="admin-editor" onSubmit={e => { e.preventDefault(); onSubmit(form) }}>
    <input placeholder="Alias" value={form.alias} onChange={e => setForm({ ...form, alias: e.target.value })} required autoFocus />
    <input placeholder="Provider" value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} />
    <input placeholder="Tags, comma separated" value={form.tags.join(", ")} onChange={e => setForm({ ...form, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })} />
    <input placeholder="Redacted address (e.g. 10.0.x.x)" value={form.redactedAddress} onChange={e => setForm({ ...form, redactedAddress: e.target.value })} />
    <input placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
    <input placeholder="Port" type="number" value={form.port ?? ""} onChange={e => setForm({ ...form, port: e.target.value ? Number(e.target.value) : null })} />
    <input placeholder="Manager reference (e.g. 1Password item)" value={form.managerRef} onChange={e => setForm({ ...form, managerRef: e.target.value })} />
    <input placeholder="SSH command template" value={form.sshCommandTemplate} onChange={e => setForm({ ...form, sshCommandTemplate: e.target.value })} />
    <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
    <div><button type="button" onClick={onCancel}>Cancel</button><button type="submit">Save</button></div>
  </form>;
}

function VaultDetail({ summary, onBack, onChanged }: { summary: VaultRecordSummary; onBack: () => void; onChanged: (next: VaultRecordSummary | null) => void }) {
  const [revealed, setRevealed] = useState<VaultRecordRevealed | null>(null);
  const [needsReverify, setNeedsReverify] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function reveal() {
    const r = await fetch(`/api/vault/records/${summary.id}/reveal`, { method: "POST" });
    if (r.status === 401) { setNeedsReverify(true); return }
    if (!r.ok) return;
    setRevealed(await r.json());
    setNeedsReverify(false);
  }
  async function reverifyAndReveal() {
    if (await unlockWithPasskey()) await reveal();
  }
  async function copy(field: string, value: string) {
    await navigator.clipboard.writeText(value).catch(() => {});
    fetch(`/api/vault/records/${summary.id}/audit-copy`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ field }) }).catch(() => {});
  }
  async function save(input: VaultRecordInput) {
    const r = await fetch(`/api/vault/records/${summary.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    if (!r.ok) return;
    const saved = await r.json();
    onChanged(saved);
    setEditing(false);
    setRevealed(null);
  }
  async function archive() { const r = await fetch(`/api/vault/records/${summary.id}/archive`, { method: "POST" }); if (r.ok) onChanged({ ...summary, archivedAt: new Date().toISOString() }) }
  async function restore() { const r = await fetch(`/api/vault/records/${summary.id}/restore`, { method: "POST" }); if (r.ok) onChanged({ ...summary, archivedAt: null }) }
  async function remove() { const r = await fetch(`/api/vault/records/${summary.id}`, { method: "DELETE" }); if (r.ok) onChanged(null) }

  if (editing) return <div className="app-page"><button className="back" onClick={() => setEditing(false)}><ArrowLeft /> Cancel</button><VaultForm item={revealed ?? undefined} onCancel={() => setEditing(false)} onSubmit={save} /></div>;

  return <div className="app-page">
    <button className="back" onClick={onBack}><ArrowLeft /> All records</button>
    <span className="eyebrow">{summary.provider || "Vault record"}</span>
    <h1>{summary.alias}</h1>
    {summary.tags.length > 0 && <p className="muted">{summary.tags.join(" · ")}</p>}
    {summary.archivedAt && <p className="muted">Archived</p>}
    {!revealed && !needsReverify && <Button onClick={reveal}>Reveal details</Button>}
    {needsReverify && <p className="empty-hint">Step-up expired. <Button onClick={reverifyAndReveal}>Verify again</Button></p>}
    {revealed && <div className="repo-list">
      <div><div><b>Address</b><p>{revealed.redactedAddress || "—"}</p></div><button onClick={() => copy("redactedAddress", revealed.redactedAddress)}>Copy</button></div>
      <div><div><b>Username</b><p>{revealed.username || "—"}</p></div><button onClick={() => copy("username", revealed.username)}>Copy</button></div>
      <div><div><b>Port</b><p>{revealed.port ?? "—"}</p></div></div>
      <div><div><b>Manager reference</b><p>{revealed.managerRef || "—"}</p></div><button onClick={() => copy("managerRef", revealed.managerRef)}>Copy</button></div>
      <div><div><b>SSH command</b><p>{revealed.sshCommandTemplate || "—"}</p></div><button onClick={() => copy("sshCommandTemplate", revealed.sshCommandTemplate)}>Copy</button></div>
      {revealed.notes && <div><div><b>Notes</b><p>{revealed.notes}</p></div></div>}
    </div>}
    <div className="setting-row">
      <Button onClick={() => setEditing(true)}>Edit</Button>
      {summary.archivedAt ? <Button onClick={restore}>Restore</Button> : <Button onClick={archive}>Archive</Button>}
      <Button variant="danger" onClick={() => setDeleting(true)}>Delete</Button>
    </div>
    {deleting && <DeleteConfirmDialog title={summary.alias} onCancel={() => setDeleting(false)} onConfirm={remove} />}
  </div>;
}

export function VaultApp() {
  const [unlocked, setUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [records, setRecords] = useState<VaultRecordSummary[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  function lock() {
    setUnlocked(false); setRecords(null); setSelectedId(null); setCreating(false);
    fetch("/api/vault/lock", { method: "POST" }).catch(() => {});
  }
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) lock() };
    document.addEventListener("visibilitychange", onVisibility);
    addEventListener("blur", lock);
    return () => { document.removeEventListener("visibilitychange", onVisibility); removeEventListener("blur", lock) };
  }, []);

  async function unlock() {
    setUnlocking(true); setError("");
    const ok = await unlockWithPasskey();
    setUnlocking(false);
    if (!ok) { setError("Verification failed."); return }
    setUnlocked(true);
    const r = await fetch("/api/vault/records");
    if (r.ok) setRecords((await r.json()).records);
  }
  async function create(input: VaultRecordInput) {
    const r = await fetch("/api/vault/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    if (!r.ok) return;
    const saved = await r.json();
    setRecords(v => [saved, ...(v ?? [])]);
    setCreating(false);
  }
  function onChanged(next: VaultRecordSummary | null) {
    setRecords(v => next ? (v ?? []).map(r => r.id === next.id ? next : r) : (v ?? []).filter(r => r.id !== selectedId));
    if (!next) setSelectedId(null);
  }

  if (!unlocked) return <div className="app-page locked">
    <div className="app-heading"><span>VAULT</span><h1>Private space</h1><p>Server credential references, sealed behind a passkey.</p></div>
    <Lock size={32} strokeWidth={1.4} />
    <Button onClick={unlock} disabled={unlocking}>{unlocking ? "Verifying…" : "Unlock with Passkey"}</Button>
    {error && <p className="empty-hint">{error}</p>}
  </div>;

  const selected = records?.find(r => r.id === selectedId);
  if (selected) return <VaultDetail summary={selected} onBack={() => setSelectedId(null)} onChanged={onChanged} />;
  if (creating) return <div className="app-page"><button className="back" onClick={() => setCreating(false)}><ArrowLeft /> Cancel</button><VaultForm onCancel={() => setCreating(false)} onSubmit={create} /></div>;

  return <div className="app-page">
    <div className="app-heading"><span>VAULT</span><h1>Records</h1><p>Sanitized credential metadata only — never raw secrets.</p></div>
    <div className="setting-row"><Button onClick={() => setCreating(true)}>New record</Button><Button onClick={lock}>Lock</Button></div>
    {!records?.length ? <p className="empty-hint">No records yet.</p> : <div className="project-list">{records.map(r => <button key={r.id} onClick={() => setSelectedId(r.id)}><div><h2>{r.alias}</h2><p>{r.provider || "—"}</p><small>{r.tags.join(", ")}</small></div>{r.archivedAt && <b>Archived</b>}</button>)}</div>}
  </div>;
}
