"use client";

import { useState } from "react";

export function SettingsTab() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");

  async function changePw() {
    if (!pw || pw !== pw2) { setMsg("Passwords do not match."); return; }
    if (pw.length < 8) { setMsg("Password must be at least 8 characters."); return; }
    const res = await fetch("/api/settings/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) {
      setPw(""); setPw2(""); setMsg("Password changed.");
    } else {
      setMsg("Failed to change password.");
    }
    setTimeout(() => setMsg(""), 3000);
  }

  async function exportData() {
    const [profile, posts, projects, gallery, cv] = await Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/posts?all=1").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/gallery").then((r) => r.json()),
      fetch("/api/cv").then((r) => r.json()),
    ]);
    const data = { profile, posts, projects, gallery, cv };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bulbashenko_data.json";
    a.click();
  }

  return (
    <div>
      <div className="ash">SETTINGS</div>

      <div className="form-section">
        <div className="form-section-title">CHANGE PASSWORD</div>
        <label className="flabel">NEW PASSWORD (min 8 chars)</label>
        <input className="finput" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <label className="flabel">CONFIRM PASSWORD</label>
        <input className="finput" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        {msg && (
          <div style={{ color: msg.includes("changed") ? "var(--g2)" : "#d06060", fontSize: 12, marginTop: 8, fontFamily: "var(--fw)", letterSpacing: "1px" }}>
            {msg}
          </div>
        )}
        <button className="btn btn-primary" onClick={changePw} style={{ marginTop: 14 }}>
          UPDATE PASSWORD
        </button>
      </div>

      <hr className="asep" />

      <div className="form-section">
        <div className="form-section-title">DATA EXPORT</div>
        <button className="btn" onClick={exportData}>EXPORT JSON</button>
      </div>
    </div>
  );
}
