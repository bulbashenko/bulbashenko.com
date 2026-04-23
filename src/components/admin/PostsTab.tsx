"use client";

import { useState, useEffect } from "react";
import type { PostData } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Lang = "en" | "ru" | "sk";

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const pad = (x: number) => String(x).padStart(2, "0");
function fmtDate(s: string) {
  if (!s) return "";
  const d = new Date(s + "T12:00:00");
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function genId() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

export function PostsTab() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [editing, setEditing] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep session alive while in the blog section (ping every 30 min)
  useEffect(() => {
    const id = setInterval(() => {
      fetch("/api/auth/keepalive").catch(() => undefined);
    }, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/posts?all=1");
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function deletePost(id: string) {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    load();
  }

  async function savePost(post: PostData) {
    const isNew = !posts.find((p) => p.id === post.id);
    await fetch(isNew ? "/api/posts" : `/api/posts/${post.id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });
    setEditing(null);
    load();
  }

  if (editing !== null) {
    return <PostEditor post={editing} onSave={savePost} onCancel={() => setEditing(null)} />;
  }

  const sorted = [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div className="ash">POSTS</div>
        <button
          className="btn btn-primary"
          onClick={() => setEditing({
            id: genId(), title: "", titleRu: "", titleSk: "",
            content: "", contentRu: "", contentSk: "",
            date: new Date().toISOString().slice(0, 10),
            tags: [], published: false, createdAt: "", updatedAt: "",
          })}
        >
          + NEW POST
        </button>
      </div>
      {loading && <div className="empty">Loading...</div>}
      {!loading && !sorted.length && <div className="empty">No posts yet. Create your first post.</div>}
      {sorted.map((p) => (
        <div className="acard" key={p.id}>
          <div className="acard-h">
            <div>
              <div className="acard-title">{p.title || "(untitled)"}</div>
              <div className="acard-sub">
                {fmtDate(p.date)}&nbsp;
                <span className={`badge${p.published ? " badge-pub" : ""}`}>
                  {p.published ? "PUBLISHED" : "DRAFT"}
                </span>
                {(p.tags || []).map((t) => (
                  <span key={t} className="badge" style={{ marginLeft: 4 }}>{t}</span>
                ))}
                {(p.titleRu || p.contentRu) && <span className="badge" style={{ marginLeft: 4 }}>RU</span>}
                {(p.titleSk || p.contentSk) && <span className="badge" style={{ marginLeft: 4 }}>SK</span>}
              </div>
            </div>
            <div className="acard-acts">
              <button className="btn btn-sm" onClick={() => setEditing(p)}>EDIT</button>
              <button className="btn btn-sm btn-danger" onClick={() => deletePost(p.id)}>DEL</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── POST EDITOR ────────────────────────────────────────────────────────────

function PostEditor({ post, onSave, onCancel }: {
  post: PostData;
  onSave: (p: PostData) => void;
  onCancel: () => void;
}) {
  const [title, setTitle]       = useState(post.title);
  const [titleRu, setTitleRu]   = useState(post.titleRu || "");
  const [titleSk, setTitleSk]   = useState(post.titleSk || "");
  const [content, setContent]     = useState(post.content);
  const [contentRu, setContentRu] = useState(post.contentRu || "");
  const [contentSk, setContentSk] = useState(post.contentSk || "");
  const [date, setDate]         = useState(post.date);
  const [tags, setTags]         = useState((post.tags || []).join(", "));
  const [published, setPublished] = useState(post.published);

  const [langTab, setLangTab] = useState<Lang>("en");
  const [viewTab, setViewTab] = useState<"edit" | "preview">("edit");

  const currentTitle   = langTab === "ru" ? titleRu   : langTab === "sk" ? titleSk   : title;
  const currentContent = langTab === "ru" ? contentRu : langTab === "sk" ? contentSk : content;

  function setCurrentTitle(v: string) {
    if (langTab === "ru") setTitleRu(v);
    else if (langTab === "sk") setTitleSk(v);
    else setTitle(v);
  }

  function setCurrentContent(v: string) {
    if (langTab === "ru") setContentRu(v);
    else if (langTab === "sk") setContentSk(v);
    else setContent(v);
  }

  function save() {
    onSave({
      ...post,
      title, titleRu: titleRu || null, titleSk: titleSk || null,
      content, contentRu: contentRu || null, contentSk: contentSk || null,
      date,
      tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
      published,
    });
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div className="ash">{post.title ? "EDIT POST" : "NEW POST"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={onCancel}>CANCEL</button>
          <button className="btn btn-primary" onClick={save}>SAVE POST</button>
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 1fr auto", gap: 12, alignItems: "end", marginBottom: 14 }}>
        <div>
          <label className="flabel">TITLE (EN)</label>
          <input className="finput" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" />
        </div>
        <div>
          <label className="flabel">DATE</label>
          <input className="finput" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="flabel">TAGS (comma sep.)</label>
          <input className="finput" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="devops, linux" />
        </div>
        <div>
          <label style={{
            display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
            fontFamily: "var(--fw)", fontSize: 16, color: published ? "var(--g1)" : "var(--g3)",
            letterSpacing: "2px", border: "1px solid var(--g4)", padding: "8px 14px", whiteSpace: "nowrap",
          }}>
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)}
              style={{ accentColor: "var(--g1)", width: 14, height: 14 }} />
            PUBLISHED
          </label>
        </div>
      </div>

      {/* Language tabs + view tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 0 }}>
        <div className="ltabs" style={{ marginTop: 0 }}>
          {(["en","ru","sk"] as Lang[]).map((l) => (
            <button key={l} className={`ltab${langTab === l ? " on" : ""}`} onClick={() => setLangTab(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["edit","preview"] as const).map((k) => (
            <button key={k} className={`ltab${viewTab === k ? " on" : ""}`} onClick={() => setViewTab(k)}>
              {k.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Title for current lang (ru/sk) */}
      {langTab !== "en" && (
        <div style={{ marginTop: 6 }}>
          <label className="flabel">TITLE ({langTab.toUpperCase()})</label>
          <input
            className="finput"
            value={currentTitle}
            onChange={(e) => setCurrentTitle(e.target.value)}
            placeholder={`Title in ${langTab.toUpperCase()} (leave empty to fall back to EN)`}
          />
        </div>
      )}

      {/* Content editor/preview */}
      {viewTab === "edit" ? (
        <textarea
          className="ftextarea"
          value={currentContent}
          onChange={(e) => setCurrentContent(e.target.value)}
          style={{ minHeight: 420, marginTop: 6, fontFamily: "var(--fm)", fontSize: 13, lineHeight: 1.6 }}
          placeholder={
            langTab === "en"
              ? "Write your post in Markdown..."
              : `Content in ${langTab.toUpperCase()} — leave empty to show EN version`
          }
        />
      ) : (
        <div className="editor-preview" style={{ minHeight: 420, border: "1px solid var(--g4)", padding: 20, marginTop: 6 }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {currentContent || (langTab !== "en" ? content : "*No content yet*")}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
