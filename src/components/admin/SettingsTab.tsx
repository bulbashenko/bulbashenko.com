"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button, Card, CardHeader, CardTitle, CardSub, CardActions, Input, Label, SectionHeader, Badge } from "@/components/ui";
import a from "./admin.module.css";

type TotpStatus =
  | { enabled: true; remainingCodes: number }
  | { enabled: false; secret: string; qrCode: string }
  | null;

type SessionEntry = {
  id: string;
  createdAt: string;
  lastSeen: string;
  ip: string;
  userAgent: string;
  current: boolean;
};

function parseDevice(ua: string): string {
  if (!ua || ua === "unknown") return "Unknown device";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) {
    if (/Edg\//.test(ua)) return "Edge / Windows";
    if (/Chrome/.test(ua)) return "Chrome / Windows";
    if (/Firefox/.test(ua)) return "Firefox / Windows";
    return "Windows";
  }
  if (/Macintosh/.test(ua)) {
    if (/Edg\//.test(ua)) return "Edge / macOS";
    if (/Chrome/.test(ua)) return "Chrome / macOS";
    if (/Firefox/.test(ua)) return "Firefox / macOS";
    if (/Safari/.test(ua)) return "Safari / macOS";
    return "macOS";
  }
  if (/Linux/.test(ua)) {
    if (/Chrome/.test(ua)) return "Chrome / Linux";
    if (/Firefox/.test(ua)) return "Firefox / Linux";
    return "Linux";
  }
  return "Unknown device";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function SettingsTab() {
  const [pw, setPw]   = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");

  const [totp, setTotp]               = useState<TotpStatus>(null);
  const [totpCode, setTotpCode]       = useState("");
  const [totpMsg, setTotpMsg]         = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [codesSaved, setCodesSaved]   = useState(false);

  const [sessions, setSessions]           = useState<SessionEntry[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    const res = await fetch("/api/auth/sessions");
    if (res.ok) setSessions(await res.json());
    setSessionsLoading(false);
  }, []);

  useEffect(() => { loadTotp(); loadSessions(); }, [loadSessions]);

  async function loadTotp() {
    const res = await fetch("/api/settings/totp");
    if (res.ok) setTotp(await res.json());
  }

  async function changePw() {
    if (!pw || pw !== pw2) { setMsg("Passwords do not match."); return; }
    if (pw.length < 8) { setMsg("Password must be at least 8 characters."); return; }
    const res = await fetch("/api/settings/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) { setPw(""); setPw2(""); setMsg("Password changed."); }
    else { setMsg("Failed to change password."); }
    setTimeout(() => setMsg(""), 3000);
  }

  async function enableTotp() {
    if (totpCode.length !== 6) return;
    setTotpLoading(true); setTotpMsg("");
    try {
      const res = await fetch("/api/settings/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: totpCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRecoveryCodes(data.recoveryCodes ?? []);
        setCodesSaved(false); setTotpCode("");
        await loadTotp();
      } else {
        setTotpMsg(data.error || "Failed to enable 2FA.");
        setTimeout(() => setTotpMsg(""), 4000);
      }
    } catch {
      setTotpMsg("Network error. Try again.");
      setTimeout(() => setTotpMsg(""), 4000);
    }
    setTotpLoading(false);
  }

  async function disableTotp() {
    if (!confirm("Disable two-factor authentication? You will need to set it up again.")) return;
    setTotpLoading(true);
    try {
      const res = await fetch("/api/settings/totp", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setRecoveryCodes(null); setCodesSaved(false); await loadTotp(); }
      else { setTotpMsg(data.error || "Failed to disable 2FA."); setTimeout(() => setTotpMsg(""), 3000); }
    } catch {
      setTotpMsg("Network error. Try again.");
      setTimeout(() => setTotpMsg(""), 3000);
    }
    setTotpLoading(false);
  }

  async function revokeSession(id: string) {
    await fetch(`/api/auth/sessions/${id}`, { method: "DELETE" });
    await loadSessions();
  }

  async function revokeOthers() {
    if (!confirm("Log out all other devices?")) return;
    await fetch("/api/auth/sessions", { method: "DELETE" });
    await loadSessions();
  }

  async function exportData() {
    const [profile, posts, projects, gallery, cv] = await Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/posts?all=1").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/gallery").then((r) => r.json()),
      fetch("/api/cv").then((r) => r.json()),
    ]);
    const blob = new Blob([JSON.stringify({ profile, posts, projects, gallery, cv }, null, 2)], { type: "application/json" });
    const el = document.createElement("a");
    el.href = URL.createObjectURL(blob);
    el.download = "bulbashenko_data.json";
    el.click();
  }

  const setup = totp !== null && !totp.enabled ? (totp as { enabled: false; secret: string; qrCode: string }) : null;

  return (
    <div>
      <SectionHeader variant="admin">SETTINGS</SectionHeader>

      {/* ── PASSWORD ── */}
      <div className={a.formSection}>
        <div className={a.formSectionTitle}>CHANGE PASSWORD</div>
        <Label>NEW PASSWORD (min 8 chars)</Label>
        <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Label>CONFIRM PASSWORD</Label>
        <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        {msg && (
          <div style={{ color: msg.includes("changed") ? "var(--g2)" : "#d06060", fontSize: 12, marginTop: 8, fontFamily: "var(--fw)", letterSpacing: "1px" }}>
            {msg}
          </div>
        )}
        <Button variant="primary" onClick={changePw} style={{ marginTop: 14 }}>UPDATE PASSWORD</Button>
      </div>

      <hr className={a.separator} />

      {/* ── 2FA ── */}
      <div className={a.formSection}>
        <div className={a.formSectionTitle}>TWO-FACTOR AUTHENTICATION</div>

        {totp === null && (
          <div style={{ fontFamily: "var(--fw)", fontSize: 12, color: "var(--g3)", letterSpacing: "1px" }}>Loading...</div>
        )}

        {totp?.enabled && !recoveryCodes && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
              <Badge variant="published">ENABLED</Badge>
              <span style={{ fontFamily: "var(--fw)", fontSize: 11, color: "var(--g3)", letterSpacing: "1px" }}>
                {(totp as { enabled: true; remainingCodes: number }).remainingCodes} recovery code(s) remaining
              </span>
            </div>
            {(totp as { enabled: true; remainingCodes: number }).remainingCodes <= 2 && (
              <div style={{ fontFamily: "var(--fw)", fontSize: 11, color: "#d06060", letterSpacing: "1px", marginBottom: 12, padding: "8px 12px", border: "1px solid #d06060" }}>
                Low on recovery codes. Disable and re-enable 2FA to generate new ones.
              </div>
            )}
            {totpMsg && <div style={{ color: "#d06060", fontSize: 12, marginBottom: 8, fontFamily: "var(--fw)", letterSpacing: "1px" }}>{totpMsg}</div>}
            <Button variant="danger" onClick={disableTotp} disabled={totpLoading}>DISABLE 2FA</Button>
          </>
        )}

        {recoveryCodes && (
          <div>
            <div style={{ fontFamily: "var(--fw)", fontSize: 12, color: "#d06060", letterSpacing: "1px", marginBottom: 12, padding: "10px 14px", border: "1px solid #d06060", lineHeight: 1.7 }}>
              Save these recovery codes now — they will not be shown again.<br />
              Each code can be used once if you lose access to your authenticator app.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontFamily: "var(--fm)", fontSize: 14, letterSpacing: "3px", background: "var(--bg2)", border: "1px solid var(--g4)", padding: "14px 18px", marginBottom: 14 }}>
              {recoveryCodes.map((c) => <span key={c} style={{ color: "var(--g1)" }}>{c}</span>)}
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Button onClick={() => { navigator.clipboard.writeText(recoveryCodes.join("\n")); setCodesSaved(true); }}>COPY ALL</Button>
              <Button variant="primary" disabled={!codesSaved} onClick={() => setRecoveryCodes(null)} title={codesSaved ? "" : "Copy or note the codes first"}>
                I HAVE SAVED THESE CODES
              </Button>
            </div>
          </div>
        )}

        {setup && (
          <>
            <div style={{ fontFamily: "var(--fw)", fontSize: 12, color: "var(--g3)", letterSpacing: "1px", marginBottom: 18, lineHeight: 1.8 }}>
              1. Scan the QR code with Google Authenticator, Authy, or any TOTP app.<br />
              2. Enter the 6-digit code shown in the app to confirm.
            </div>
            <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
              <Image src={setup.qrCode} alt="2FA QR Code" width={164} height={164}
                style={{ imageRendering: "pixelated", border: "4px solid var(--g1)", background: "#fff" }} unoptimized />
              <div style={{ flex: 1, minWidth: 220 }}>
                <Label>SETUP KEY (enter manually if QR does not scan)</Label>
                <div style={{ fontFamily: "var(--fm)", fontSize: 13, letterSpacing: "2px", color: "var(--g2)", background: "var(--bg2)", padding: "8px 12px", marginBottom: 18, wordBreak: "break-all", border: "1px solid var(--g4)" }}>
                  {setup.secret}
                </div>
                <Label>CONFIRM WITH APP CODE</Label>
                <Input
                  type="text" inputMode="numeric" maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  style={{ letterSpacing: "4px", fontSize: 18, textAlign: "center", width: 160 }}
                />
                {totpMsg && <div style={{ color: "#d06060", fontSize: 12, marginTop: 8, fontFamily: "var(--fw)", letterSpacing: "1px" }}>{totpMsg}</div>}
                <Button variant="primary" onClick={enableTotp} disabled={totpLoading || totpCode.length !== 6} style={{ marginTop: 14 }}>
                  ENABLE 2FA
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <hr className={a.separator} />

      {/* ── SESSIONS ── */}
      <div className={a.formSection}>
        <div className={a.formSectionTitle} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>ACTIVE SESSIONS</span>
          {sessions.filter((s) => !s.current).length > 0 && (
            <Button size="sm" variant="danger" onClick={revokeOthers} style={{ fontSize: 11 }}>LOG OUT OTHER DEVICES</Button>
          )}
        </div>
        {sessionsLoading && <div style={{ fontFamily: "var(--fw)", fontSize: 12, color: "var(--g3)", letterSpacing: "1px" }}>Loading...</div>}
        {!sessionsLoading && sessions.length === 0 && <div style={{ fontFamily: "var(--fw)", fontSize: 12, color: "var(--g3)", letterSpacing: "1px" }}>No active sessions.</div>}
        {sessions.map((s) => (
          <Card variant="admin" key={s.id} style={{ marginBottom: 8 }}>
            <CardHeader style={{ alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <CardTitle style={{ fontSize: 13 }}>{parseDevice(s.userAgent)}</CardTitle>
                  {s.current && <Badge variant="published">THIS DEVICE</Badge>}
                </div>
                <CardSub>{s.ip} · Last seen {timeAgo(s.lastSeen)} · Logged in {timeAgo(s.createdAt)}</CardSub>
              </div>
              <CardActions>
                <Button size="sm" variant="danger" onClick={() => revokeSession(s.id)}>
                  {s.current ? "LOG OUT" : "REVOKE"}
                </Button>
              </CardActions>
            </CardHeader>
          </Card>
        ))}
      </div>

      <hr className={a.separator} />

      {/* ── EXPORT ── */}
      <div className={a.formSection}>
        <div className={a.formSectionTitle}>DATA EXPORT</div>
        <Button onClick={exportData}>EXPORT JSON</Button>
      </div>
    </div>
  );
}
