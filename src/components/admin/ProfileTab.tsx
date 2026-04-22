"use client";

import { useState, useEffect } from "react";
import type { ProfileData, SkillCategory } from "@/types";

type Lang = "en" | "ru" | "sk";

export function ProfileTab() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [saved, setSaved] = useState(false);
  const [bioLang, setBioLang] = useState<Lang>("en");
  const [titleLang, setTitleLang] = useState<Lang>("en");
  const [skillInput, setSkillInput] = useState<Record<number, string>>({});
  const [newCat, setNewCat] = useState("");

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then(setProfile);
  }, []);

  if (!profile) return <div className="empty">Loading...</div>;

  function upd<K extends keyof ProfileData>(k: K, v: ProfileData[K]) {
    setProfile((p) => p ? { ...p, [k]: v } : p);
  }

  async function save() {
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      // Save immediately so the photo persists without requiring a manual save
      const updated = { ...profile!, photo: url };
      setProfile(updated);
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    }
  }

  const skills = (profile.skills || []) as SkillCategory[];

  function addCat() {
    if (!newCat.trim()) return;
    upd("skills", [...skills, { cat: newCat.trim(), items: [] }]);
    setNewCat("");
  }

  function delCat(i: number) {
    upd("skills", skills.filter((_, j) => j !== i));
  }

  function addItem(ci: number) {
    const v = (skillInput[ci] || "").trim();
    if (!v) return;
    const s = [...skills];
    s[ci] = { ...s[ci], items: [...s[ci].items, v] };
    upd("skills", s);
    setSkillInput((x) => ({ ...x, [ci]: "" }));
  }

  function delItem(ci: number, ii: number) {
    const s = [...skills];
    s[ci] = { ...s[ci], items: s[ci].items.filter((_, j) => j !== ii) };
    upd("skills", s);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div className="ash">PROFILE</div>
        <button className="btn btn-primary" onClick={save}>{saved ? "SAVED ✓" : "SAVE PROFILE"}</button>
      </div>

      <div className="form-section">
        <div className="form-section-title">PERSONAL INFO</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label className="flabel">FULL NAME</label>
            <input className="finput" value={profile.name || ""} onChange={(e) => upd("name", e.target.value)} />
          </div>
          <div>
            <label className="flabel">LOCATION</label>
            <input className="finput" value={profile.location || ""} onChange={(e) => upd("location", e.target.value)} />
          </div>
          <div>
            <label className="flabel">BIRTHDAY (YYYY-MM-DD)</label>
            <input className="finput" value={profile.birthday || ""} onChange={(e) => upd("birthday", e.target.value)} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">TITLE & BIO</div>
        <div className="ltabs">
          {(["en","ru","sk"] as Lang[]).map((l) => (
            <button key={l} className={`ltab${titleLang === l ? " on" : ""}`} onClick={() => setTitleLang(l)}>{l.toUpperCase()}</button>
          ))}
        </div>
        <input
          className="finput"
          style={{ marginTop: 0 }}
          value={(titleLang === "ru" ? profile.titleRu : titleLang === "sk" ? profile.titleSk : profile.titleEn) || ""}
          onChange={(e) => upd(titleLang === "ru" ? "titleRu" : titleLang === "sk" ? "titleSk" : "titleEn", e.target.value)}
          placeholder="Job title"
        />
        <div className="ltabs" style={{ marginTop: 14 }}>
          {(["en","ru","sk"] as Lang[]).map((l) => (
            <button key={l} className={`ltab${bioLang === l ? " on" : ""}`} onClick={() => setBioLang(l)}>{l.toUpperCase()}</button>
          ))}
        </div>
        <textarea
          className="ftextarea"
          style={{ marginTop: 0, minHeight: 80 }}
          value={(bioLang === "ru" ? profile.bioRu : bioLang === "sk" ? profile.bioSk : profile.bioEn) || ""}
          onChange={(e) => upd(bioLang === "ru" ? "bioRu" : bioLang === "sk" ? "bioSk" : "bioEn", e.target.value)}
          placeholder="Short bio..."
        />
      </div>

      <div className="form-section">
        <div className="form-section-title">CONTACT LINKS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {(["email","github","telegram","linkedin"] as const).map((k) => (
            <div key={k}>
              <label className="flabel">{k.toUpperCase()}</label>
              <input className="finput" value={profile[k] || ""} onChange={(e) => upd(k, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">PHOTO</div>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          {profile.photo && (
            <img src={profile.photo} alt="profile" style={{ width: 80, height: 80, objectFit: "cover", border: "1px solid var(--g4)" }} />
          )}
          <div>
            <input type="file" accept="image/*" onChange={uploadPhoto} style={{ color: "var(--g2)", fontSize: 12 }} />
            {profile.photo && (
              <button className="btn btn-sm btn-danger" onClick={() => upd("photo", null)} style={{ marginTop: 8, display: "block" }}>
                REMOVE
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">SKILLS</div>
        {skills.map((cat, ci) => (
          <div className="skill-cat-block" key={ci}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--fw)", fontSize: 16, color: "var(--g3)", letterSpacing: "2px" }}>{cat.cat.toUpperCase()}</span>
              <button className="btn btn-sm btn-danger" onClick={() => delCat(ci)}>DEL CAT</button>
            </div>
            {cat.items.map((item, ii) => (
              <div className="skill-item-row" key={ii}>
                <span>{item}</span>
                <button style={{ background: "none", border: "none", color: "#d06060", cursor: "pointer", fontSize: 14, padding: "0 4px" }} onClick={() => delItem(ci, ii)}>×</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <input
                className="finput"
                style={{ flex: 1 }}
                value={skillInput[ci] || ""}
                onChange={(e) => setSkillInput((x) => ({ ...x, [ci]: e.target.value }))}
                placeholder="New skill item"
                onKeyDown={(e) => e.key === "Enter" && addItem(ci)}
              />
              <button className="btn btn-sm" onClick={() => addItem(ci)}>ADD</button>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input
            className="finput"
            style={{ flex: 1 }}
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            placeholder="New category name"
            onKeyDown={(e) => e.key === "Enter" && addCat()}
          />
          <button className="btn" onClick={addCat}>+ CATEGORY</button>
        </div>
      </div>
    </div>
  );
}
