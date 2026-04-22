"use client";

import { useState, useEffect } from "react";
import type { ProjectData } from "@/types";

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
          onClick={() => setEditing({ id: genId(), name: "", desc: "", stack: [], github: "", url: "", order: 0 })}
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
  const [name, setName] = useState(proj.name);
  const [desc, setDesc] = useState(proj.desc || "");
  const [stackRaw, setStackRaw] = useState((proj.stack || []).join(", "));
  const [github, setGithub] = useState(proj.github || "");
  const [url, setUrl] = useState(proj.url || "");

  function save() {
    onSave({ ...proj, name, desc, stack: stackRaw.split(",").map((s) => s.trim()).filter(Boolean), github, url });
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
      <input className="finput" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Awesome Project" />
      <label className="flabel">DESCRIPTION</label>
      <textarea className="ftextarea" value={desc} onChange={(e) => setDesc(e.target.value)} style={{ minHeight: 88 }} />
      <label className="flabel">STACK (comma separated)</label>
      <input className="finput" value={stackRaw} onChange={(e) => setStackRaw(e.target.value)} placeholder="Docker, Kubernetes, Python" />
      <label className="flabel">GITHUB URL</label>
      <input className="finput" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." />
      <label className="flabel">LIVE URL</label>
      <input className="finput" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
    </div>
  );
}
