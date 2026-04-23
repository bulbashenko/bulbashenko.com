"use client";

import { useState, useEffect } from "react";
import type { ProjectData } from "@/types";

type Lang = "en" | "ru" | "sk";

function genId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

export function ProjectsTab() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [editing, setEditing] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/projects");
    if (res.ok) setProjects(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function del(id: string) {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  }

  async function save(proj: ProjectData) {
    const isNew = !projects.find((p) => p.id === proj.id);
    await fetch(isNew ? "/api/projects" : `/api/projects/${proj.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proj),
    });
    setEditing(null);
    load();
  }

  if (editing) return <ProjectEditor proj={editing} onSave={save} onCancel={() => setEditing(null)} />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div className="ash">PROJECTS</div>
        <button
          className="btn btn-primary"
          onClick={() => setEditing({ id: genId(), name: "", nameRu: "", nameSk: "", desc: "", descRu: "", descSk: "", stack: [], github: "", url: "", order: 0 })}
        >
          + NEW PROJECT
        </button>
      </div>
      {loading && <div className="empty">Loading...</div>}
      {!loading && !projects.length && <div className="empty">No projects yet.</div>}
      {projects.map((p) => (
        <div className="acard" key={p.id}>
          <div className="acard-h">
            <div>
              <div className="acard-title">{p.name || "(unnamed)"}</div>
              <div className="acard-sub">{(p.stack || []).join(" · ")}</div>
            </div>
            <div className="acard-acts">
              <button className="btn btn-sm" onClick={() => setEditing(p)}>EDIT</button>
              <button className="btn btn-sm btn-danger" onClick={() => del(p.id)}>DEL</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectEditor({ proj, onSave, onCancel }: { proj: ProjectData; onSave: (p: ProjectData) => void; onCancel: () => void }) {
  const [nameLang, setNameLang] = useState<Lang>("en");
  const [descLang, setDescLang] = useState<Lang>("en");
  const [name, setName] = useState(proj.name || "");
  const [nameRu, setNameRu] = useState(proj.nameRu || "");
  const [nameSk, setNameSk] = useState(proj.nameSk || "");
  const [desc, setDesc] = useState(proj.desc || "");
  const [descRu, setDescRu] = useState(proj.descRu || "");
  const [descSk, setDescSk] = useState(proj.descSk || "");
  const [stackRaw, setStackRaw] = useState((proj.stack || []).join(", "));
  const [github, setGithub] = useState(proj.github || "");
  const [url, setUrl] = useState(proj.url || "");

  const nameValue = nameLang === "ru" ? nameRu : nameLang === "sk" ? nameSk : name;
  const descValue = descLang === "ru" ? descRu : descLang === "sk" ? descSk : desc;

  function setNameValue(v: string) {
    if (nameLang === "ru") setNameRu(v);
    else if (nameLang === "sk") setNameSk(v);
    else setName(v);
  }

  function setDescValue(v: string) {
    if (descLang === "ru") setDescRu(v);
    else if (descLang === "sk") setDescSk(v);
    else setDesc(v);
  }

  function save() {
    onSave({
      ...proj,
      name, nameRu: nameRu || null, nameSk: nameSk || null,
      desc: desc || null, descRu: descRu || null, descSk: descSk || null,
      stack: stackRaw.split(",").map((s) => s.trim()).filter(Boolean),
      github: github || null,
      url: url || null,
    });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div className="ash">{proj.name ? "EDIT PROJECT" : "NEW PROJECT"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={onCancel}>CANCEL</button>
          <button className="btn btn-primary" onClick={save}>SAVE</button>
        </div>
      </div>

      <label className="flabel">PROJECT NAME</label>
      <div className="ltabs">
        {(["en", "ru", "sk"] as Lang[]).map((l) => (
          <button key={l} className={`ltab${nameLang === l ? " on" : ""}`} onClick={() => setNameLang(l)}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <input
        className="finput"
        style={{ marginTop: 0 }}
        value={nameValue}
        onChange={(e) => setNameValue(e.target.value)}
        placeholder={nameLang === "en" ? "My Awesome Project" : nameLang === "ru" ? "Мой проект" : "Môj projekt"}
      />

      <label className="flabel" style={{ marginTop: 14 }}>DESCRIPTION</label>
      <div className="ltabs">
        {(["en", "ru", "sk"] as Lang[]).map((l) => (
          <button key={l} className={`ltab${descLang === l ? " on" : ""}`} onClick={() => setDescLang(l)}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <textarea
        className="ftextarea"
        style={{ marginTop: 0, minHeight: 88 }}
        value={descValue}
        onChange={(e) => setDescValue(e.target.value)}
        placeholder={descLang === "en" ? "Project description..." : descLang === "ru" ? "Описание проекта..." : "Popis projektu..."}
      />

      <label className="flabel">STACK (comma separated)</label>
      <input className="finput" value={stackRaw} onChange={(e) => setStackRaw(e.target.value)} placeholder="Docker, Kubernetes, Python" />
      <label className="flabel">GITHUB URL</label>
      <input className="finput" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." />
      <label className="flabel">LIVE URL</label>
      <input className="finput" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
    </div>
  );
}
