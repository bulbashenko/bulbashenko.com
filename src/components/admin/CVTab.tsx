"use client";

import { useState, useEffect } from "react";
import type { CVEntryData } from "@/types";
import { Button, Card, CardHeader, CardTitle, CardSub, CardActions, Input, Label, SectionHeader } from "@/components/ui";
import a from "./admin.module.css";

function genId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

type CVType = "experience" | "education" | "certification";

interface Field { key: keyof CVEntryData; label: string }

const EXP_FIELDS: Field[] = [
  { key: "role",    label: "ROLE" },
  { key: "company", label: "COMPANY" },
  { key: "start",   label: "FROM (e.g. 2022)" },
  { key: "end",     label: "TO (blank = Present)" },
  { key: "desc",    label: "DESCRIPTION" },
];

const EDU_FIELDS: Field[] = [
  { key: "degree",      label: "DEGREE / PROGRAM" },
  { key: "institution", label: "INSTITUTION" },
  { key: "start",       label: "FROM" },
  { key: "end",         label: "TO" },
];

const CERT_FIELDS: Field[] = [
  { key: "name",   label: "CERTIFICATION NAME" },
  { key: "issuer", label: "ISSUER" },
  { key: "date",   label: "DATE (e.g. 2024)" },
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
          <Label>{label}</Label>
          <Input
            value={String(vals[key] || "")}
            onChange={(e) => setVals((v) => ({ ...v, [key]: e.target.value }))}
          />
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <Button variant="primary" onClick={() => onSave(vals)}>SAVE</Button>
        <Button onClick={onCancel}>CANCEL</Button>
      </div>
    </div>
  );
}

function CvSection({
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
    <div className={a.formSection}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className={a.formSectionTitle} style={{ margin: 0 }}>{title}</div>
        <Button size="sm" onClick={onAdd}>+ ADD</Button>
      </div>
      {editingId === "new" && editingItem && (
        <CvItemForm item={editingItem} fields={fields} onSave={onSaveEdit} onCancel={onCancelEdit} />
      )}
      {!entries.length && editingId !== "new" && <div className={a.empty}>No entries yet.</div>}
      {entries.map((e) => (
        <div key={e.id}>
          {editingId === e.id && editingItem ? (
            <CvItemForm item={editingItem} fields={fields} onSave={onSaveEdit} onCancel={onCancelEdit} />
          ) : (
            <Card variant="admin">
              <CardHeader>
                <div>
                  <CardTitle style={{ fontSize: 17 }}>
                    {type === "experience"
                      ? `${e.role} @ ${e.company}`
                      : type === "education"
                      ? `${e.degree} — ${e.institution}`
                      : e.name}
                  </CardTitle>
                  <CardSub>
                    {type !== "certification"
                      ? `${e.start || ""} — ${e.end || "Present"}`
                      : `${e.issuer || ""} ${e.date ? `· ${e.date}` : ""}`}
                  </CardSub>
                </div>
                <CardActions>
                  <Button size="sm" onClick={() => onEdit(e)}>EDIT</Button>
                  <Button size="sm" variant="danger" onClick={() => onDel(e.id)}>DEL</Button>
                </CardActions>
              </CardHeader>
            </Card>
          )}
        </div>
      ))}
    </div>
  );
}

export function CVTab() {
  const [entries, setEntries] = useState<CVEntryData[]>([]);
  const [editing, setEditing] = useState<{ id: string; item: CVEntryData } | null>(null);

  useEffect(() => {
    fetch("/api/cv").then((r) => r.json()).then(setEntries);
  }, []);

  const exp  = entries.filter((e) => e.type === "experience");
  const edu  = entries.filter((e) => e.type === "education");
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
      title, entries, fields, type,
      onAdd:       () => setEditing({ id: "new", item: newEntry(type) }),
      onEdit:      (e: CVEntryData) => setEditing({ id: e.id, item: { ...e } }),
      onDel:       delEntry,
      editingId:   editing?.item.type === type ? editing.id : null,
      editingItem: editing?.item.type === type ? editing.item : null,
      onSaveEdit:  saveEntry,
      onCancelEdit: () => setEditing(null),
    };
  }

  return (
    <div>
      <SectionHeader variant="admin">CV</SectionHeader>
      <CvSection {...makeProps("experience",   exp,  EXP_FIELDS,  "EXPERIENCE")} />
      <CvSection {...makeProps("education",    edu,  EDU_FIELDS,  "EDUCATION")} />
      <CvSection {...makeProps("certification", cert, CERT_FIELDS, "CERTIFICATIONS")} />
    </div>
  );
}
