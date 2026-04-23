"use client";

import { useState, useEffect } from "react";
import type { GalleryImageData } from "@/types";

export function GalleryTab() {
  const [gallery, setGallery] = useState<GalleryImageData[]>([]);
  const [captions, setCaptions] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  async function load() {
    const res = await fetch("/api/gallery");
    if (res.ok) {
      const data: GalleryImageData[] = await res.json();
      setGallery(data);
      setCaptions(Object.fromEntries(data.map((i) => [i.id, i.caption || ""])));
    }
  }

  useEffect(() => { load(); }, []);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files || [])];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const { url } = await res.json();
        await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ src: url, caption: "" }),
        });
      }
    }
    e.target.value = "";
    load();
  }

  async function saveCaption(id: string) {
    await fetch(`/api/gallery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caption: captions[id] || null }),
    });
    setSaved((s) => ({ ...s, [id]: true }));
    setTimeout(() => setSaved((s) => ({ ...s, [id]: false })), 1800);
  }

  async function del(id: string) {
    if (!confirm("Delete image?")) return;
    await fetch(`/api/gallery/${id}`, { method: "DELETE" });
    setGallery((g) => g.filter((i) => i.id !== id));
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div className="ash">GALLERY</div>
        <label className="btn btn-primary" style={{ cursor: "pointer" }}>
          + UPLOAD IMAGES
          <input type="file" accept="image/*" multiple onChange={upload} style={{ display: "none" }} />
        </label>
      </div>
      <div className="notice">
        Images are uploaded to server storage. Max 5 MB per file.
      </div>
      {!gallery.length && <div className="empty">No images uploaded yet.</div>}
      <div className="ggrid">
        {gallery.map((img) => (
          <div className="gitem" key={img.id}>
            <img src={img.src} alt={captions[img.id] || ""} />
            <button className="gitem-del" onClick={() => del(img.id)}>✕</button>
            <div className="gitem-caption">
              <input
                className="finput"
                style={{ fontSize: 11, padding: "3px 6px" }}
                placeholder="Add caption…"
                value={captions[img.id] ?? ""}
                onChange={(e) => setCaptions((c) => ({ ...c, [img.id]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && saveCaption(img.id)}
              />
              <button
                className="btn btn-sm"
                style={{ fontSize: 11, padding: "3px 8px" }}
                onClick={() => saveCaption(img.id)}
              >
                {saved[img.id] ? "✓" : "SAVE"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
