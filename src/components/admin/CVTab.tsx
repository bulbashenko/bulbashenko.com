"use client";

import { useState, useEffect } from "react";
import type { CVEntryData } from "@/types";

function genId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

type CVType = "experience" | "education" | "certification";

interface Field { key: keyof CVEntryData; label: string }

const EXP_FIELDS: Field[] = [
  { key: "role", label: "ROLE" },
  { key: "company", label: "COMPANY" },
  { key: "start", label: "FROM (e.g. 2022)" },
  { key: "end", label: "TO (blank = Present)" },
  { key: "desc", label: "DESCRIPTION" },
];

const EDU_FIELDS: Field[] = [
  { key: "degree", label: "DEGREE / PROGRAM" },
  { key: "institution", label: "INSTITUTION" },
  { key: "start", label: "FROM" },
  { key: "end", label: "TO" },
];

const CERT_FIELDS: Field[] = [
  { key: "name", label: "CERTIFICATION NAME" },
  { key: "issuer", label: "ISSUER" },
  { key: "date", label: "DATE (e.g. 2024)" },
];

function CvItemForm({ item, fields, onSave, onCancel }: {
  item: CVEntryData;
  fields: Field[];
  onSave: (item: CVEntryData) => void;
  onCancel: () => void;
}) {
  const [vals, setVals] = useState<CVEntryData>({ ...item });
  return (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--g3)", padding: 16, margin: "10px 0" }}>
      {fields.map(({ key, label }) => (
        <div key={key}>
          <label className="flabel">{label}</label>
          <input
            className="finput"
            value={String(vals[key] || "")}
            onChange={(e) => setVals((v) => ({ ...v, [key]: e.target.value }))}
          />
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button className="btn btn-primary" onClick={() => onSave(vals)}>SAVE</button>
        <button className="btn" onClick={onCancel}>CANCEL</button>
      </div>
    </div>
  );
}

function Section({
  title, entries, fields, type, onAdd, onEdit, onDel, editingId, editingItem, onSaveEdit, onCancelEdit,
}: {
  title: string;
  entries: CVEntryData[];
  fields: Field[];
  type: CVType;
  onAdd: () => void;
  onEdit: (e: CVEntryData) => void;
  onDel: (id: string) => void;
  editingId: string | null;
  editingItem: CVEntryData | null;
  onSaveEdit: (e: CVEntryData) => void;
  onCancelEdit: () => void;
}) {
  return (
    <div className="form-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="form-section-title" style={{ margin: 0 }}>{title}</div>
        <button className="btn btn-sm" onClick={onAdd}>+ ADD</button>
      </div>
      {editingId === "new" && editingItem && (
        <CvItemForm item={editingItem} fields={fields} onSave={onSaveEdit} onCancel={onCancelEdit} />
      )}
      {!entries.length && editingId !== "new" && <div className="empty">No entries yet.</div>}
      {entries.map((e) => (
        <div key={e.id}>
          {editingId === e.id && editingItem ? (
            <CvItemForm item={editingItem} fields={fields} onSave={onSaveEdit} onCancel={onCancelEdit} />
          ) : (
            <div className="acard">
              <div className="acard-h">
                <div>
                  <div className="acard-title" style={{ fontSize: 17 }}>
                    {type === "experience" ? `${e.role} @ ${e.company}` : type === "education" ? `${e.degree} — ${e.institution}` : e.name}
                  </div>
                  <div className="acard-sub">
                    {type !== "certification" ? `${e.start || ""} — ${e.end || "Present"}` : `${e.issuer || ""} ${e.date ? `· ${e.date}` : ""}`}
                  </div>
                </div>
                <div className="acard-acts">
                  <button className="btn btn-sm" onClick={() => onEdit(e)}>EDIT</button>
                  <button className="btn btn-sm btn-danger" onClick={() => onDel(e.id)}>DEL</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function CVTab() {
  const [entries, setEntries] = useState<CVEntryData[]>([]);
  const [editing, setEditing] = useState<{ id: string; item: CVEntryData } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/cv").then((r) => r.json()).then(setEntries);
  }, []);

  const exp = entries.filter((e) => e.type === "experience");
  const edu = entries.filter((e) => e.type === "education");
  const cert = entries.filter((e) => e.type === "certification");

  function newEntry(type: CVType): CVEntryData {
    return { id: genId(), type, role: "", company: "", degree: "", institution: "", name: "", issuer: "", start: "", end: "", desc: "", date: "", order: 0 };
  }

  async function saveEntry(item: CVEntryData) {
    const isNew = !entries.find((e) => e.id === item.id);
    await fetch(isNew ? "/api/cv" : `/api/cv/${item.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const res = await fetch("/api/cv");
    if (res.ok) setEntries(await res.json());
    setEditing(null);
  }

  async function delEntry(id: string) {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/cv/${id}`, { method: "DELETE" });
    setEntries((e) => e.filter((x) => x.id !== id));
  }

  function makeProps(type: CVType, entries: CVEntryData[], fields: Field[], title: string) {
    return {
      title,
      entries,
      fields,
      type,
      onAdd: () => setEditing({ id: "new", item: newEntry(type) }),
      onEdit: (e: CVEntryData) => setEditing({ id: e.id, item: { ...e } }),
      onDel: delEntry,
      editingId: editing?.item.type === type ? editing.id : null,
      editingItem: editing?.item.type === type ? editing.item : null,
      onSaveEdit: saveEntry,
      onCancelEdit: () => setEditing(null),
    };
  }

  return (
    <div>
      <div className="ash">CV</div>
      <Section {...makeProps("experience", exp, EXP_FIELDS, "EXPERIENCE")} />
      <Section {...makeProps("education", edu, EDU_FIELDS, "EDUCATION")} />
      <Section {...makeProps("certification", cert, CERT_FIELDS, "CERTIFICATIONS")} />
    </div>
  );
}
