"use client";
import { useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
const accents = ["#e8ff5a", "#67a7ff", "#ff8a4c", "#ff5d67", "#f2f2f2"];
const SECTIONS = ["Appearance", "Desktop", "System", "Web", "Security", "About"] as const;

interface PasskeySummary { id: string; deviceLabel: string; lastUsedAt: string | null; createdAt: string }

function SecuritySection() {
  const [passkeys, setPasskeys] = useState<PasskeySummary[] | null>(null);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const load = () => fetch("/api/webauthn/credentials").then(r => r.json()).then(setPasskeys).catch(() => setPasskeys([]));
  useEffect(() => { load() }, []);

  async function register() {
    setRegistering(true); setError("");
    try {
      const optionsRes = await fetch("/api/webauthn/register/options", { method: "POST" });
      if (!optionsRes.ok) throw new Error();
      const options = await optionsRes.json();
      const response = await startRegistration(options);
      const label = prompt("Name this passkey (e.g. iPhone, YubiKey)") || "Passkey";
      const verifyRes = await fetch("/api/webauthn/register/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ response, deviceLabel: label }) });
      if (!verifyRes.ok) throw new Error();
      load();
    } catch {
      setError("Could not register passkey.");
    } finally {
      setRegistering(false);
    }
  }
  async function revoke(id: string) {
    const r = await fetch(`/api/webauthn/credentials/${id}`, { method: "DELETE" });
    if (r.ok) setPasskeys(v => (v ?? []).filter(p => p.id !== id));
  }

  return <section>
    <span className="eyebrow">SECURITY</span>
    <h1>Passkeys.</h1>
    <p className="muted">Passkeys unlock the Vault app. Register at least one to use it.</p>
    {!passkeys?.length ? <p className="empty-hint">No passkeys registered yet.</p> : <div className="repo-list">{passkeys.map(p => <div key={p.id}><div><b>{p.deviceLabel}</b><p>{p.lastUsedAt ? `Last used ${new Date(p.lastUsedAt).toLocaleString()}` : "Never used"}</p></div><button onClick={() => revoke(p.id)}>Revoke</button></div>)}</div>}
    <div className="setting-row"><button onClick={register} disabled={registering}>{registering ? "Registering…" : "Register new Passkey"}</button></div>
    {error && <p className="empty-hint">{error}</p>}
  </section>;
}

export function SettingsApp() {
  const [section, setSection] = useState<typeof SECTIONS[number]>("Appearance");
  const [accent, setAccent] = useState("#e8ff5a");
  const [motion, setMotion] = useState(true);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  const apply = (c: string) => { setAccent(c); document.documentElement.style.setProperty("--accent", c); localStorage.setItem("jiang-os-accent", c) };
  useEffect(() => { const c = localStorage.getItem("jiang-os-accent"); if (c) apply(c) }, []);
  useEffect(() => { setNotifPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission) }, []);
  const requestNotifications = async () => { if (typeof Notification === "undefined") return; const result = await Notification.requestPermission(); setNotifPermission(result) };

  return <div className="settings-page">
    <div className="settings-nav"><b>SETTINGS</b>{SECTIONS.map(x => <button className={section === x ? "active" : ""} key={x} onClick={() => setSection(x)}>{x}</button>)}</div>
    {section === "Security" ? <SecuritySection /> : <section>
      <span className="eyebrow">APPEARANCE</span>
      <h1>Make it yours.</h1>
      <label>ACCENT COLOR</label>
      <div className="accent-picker">{accents.map(c => <button key={c} style={{ background: c }} className={accent === c ? "selected" : ""} onClick={() => apply(c)} aria-label={`Set accent ${c}`} />)}</div>
      <label className="setting-row"><span><b>Motion</b><small>Window and interface animations</small></span><input type="checkbox" checked={motion} onChange={e => setMotion(e.target.checked)} /></label>
      <label className="setting-row"><span><b>Skip cover next time</b><small>Open directly into the desktop</small></span><input type="checkbox" onChange={e => localStorage.setItem("jiang-os-skip-cover", e.target.checked ? "1" : "0")} /></label>
      <div className="setting-row"><span><b>Desktop notifications</b><small>Alerts for server incidents, shown by your browser</small></span>{notifPermission === "unsupported" ? <small className="muted">Not supported</small> : notifPermission === "granted" ? <small className="muted">Enabled</small> : notifPermission === "denied" ? <small className="muted">Blocked in browser settings</small> : <button onClick={requestNotifications}>ENABLE</button>}</div>
      <div className="version"><span>JIANG.OS</span><b>VERSION 0.1.0 · BUILD 2026.09</b></div>
    </section>}
  </div>;
}
