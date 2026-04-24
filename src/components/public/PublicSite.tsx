"use client";

import { useState, useEffect, useCallback } from "react";
import type { SiteData, Lang } from "@/types";
import { translations } from "@/lib/i18n";
import { StatusBar } from "./StatusBar";
import { Sidebar } from "./Sidebar";
import { WindowFrame } from "./WindowFrame";
import { Lightbox, type LightboxItem } from "./Lightbox";
import { TweaksPanel } from "./TweaksPanel";
import { CRTFilter } from "./CRTFilter";
import dynamic from "next/dynamic";
const DavidBackground = dynamic(
  () => import("./DavidBackground").then((m) => ({ default: m.DavidBackground })),
  { ssr: false }
);

export type SectionId = "home" | "blog" | "projects" | "cv" | "gallery" | "contact";

const PALETTES = {
  green:  { bg: "#060b06", bg2: "#0b130b", bg3: "#101a10", g1: "#b8f0a4", g2: "#78b864", g3: "#4a7840", g4: "#243624" },
  amber:  { bg: "#090700", bg2: "#0f0c00", bg3: "#161000", g1: "#f0d060", g2: "#c8a030", g3: "#7a6018", g4: "#342800" },
  blue:   { bg: "#060912", bg2: "#0a0f1e", bg3: "#0e1428", g1: "#60d4f0", g2: "#3090b8", g3: "#1a5878", g4: "#0a2030" },
  white:  { bg: "#0c0f0c", bg2: "#121412", bg3: "#181818", g1: "#e8ede8", g2: "#a8b8a8", g3: "#607060", g4: "#283028" },
} as const;

type PaletteKey = keyof typeof PALETTES;

interface TweakState {
  scanline: number;
  glow: number;
  palette: PaletteKey;
  pincushion: boolean;
}

export function PublicSite({ data }: { data: SiteData }) {
  const [section, setSection] = useState<SectionId>("home");
  const [lang, setLang] = useState<Lang>("en");
  const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null);
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [tweaks, setTweaks] = useState<TweakState>({ scanline: 6, glow: 31, palette: "green", pincushion: false });

  // Restore from localStorage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("bul_lang") as Lang | null;
      if (savedLang && ["en", "ru", "sk"].includes(savedLang)) setLang(savedLang);
      const savedSec = localStorage.getItem("bul_sec") as SectionId | null;
      if (savedSec) setSection(savedSec);
      const savedTweaks = localStorage.getItem("bul_tweaks");
      if (savedTweaks) setTweaks((prev) => ({ ...prev, ...JSON.parse(savedTweaks) }));
    } catch {}
  }, []);

  const goSection = useCallback((id: SectionId) => {
    setSection(id);
    try { localStorage.setItem("bul_sec", id); } catch {}
    // scroll to top
    const wc = document.querySelector(".wincontent");
    if (wc) wc.scrollTop = 0;
  }, []);

  const changeLang = useCallback((l: Lang) => {
    setLang(l);
    try { localStorage.setItem("bul_lang", l); } catch {}
  }, []);

  // Switch body font based on language
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--fm",
      lang === "ru"
        ? "'IBM Plex Mono', monospace"
        : "'Bitcount Single', monospace"
    );
  }, [lang]);

  // Apply tweaks to CSS vars
  useEffect(() => {
    const pal = PALETTES[tweaks.palette];
    const r = document.documentElement;
    r.style.setProperty("--bg", pal.bg);
    r.style.setProperty("--bg2", pal.bg2);
    r.style.setProperty("--bg3", pal.bg3);
    r.style.setProperty("--g1", pal.g1);
    r.style.setProperty("--g2", pal.g2);
    r.style.setProperty("--g3", pal.g3);
    r.style.setProperty("--g4", pal.g4);
    const gl = tweaks.glow / 100;
    r.style.setProperty("--gw", `0 0 ${Math.round(16 * gl)}px ${pal.g1}, 0 0 ${Math.round(48 * gl)}px ${pal.g1}66`);
    r.style.setProperty("--sl", String(tweaks.scanline / 20 * 0.14));
  }, [tweaks]);

  const t = (key: keyof (typeof translations)["en"]) =>
    translations[lang]?.[key] ?? translations.en[key];

  const sectionTitle = t(section);

  return (
    <>
      <DavidBackground />
      <div className={`app${tweaks.pincushion ? " pin" : ""}`}>
        <CRTFilter />
        <span className="vhs-noise"   aria-hidden="true" />
        <span className="vhs-chroma"  aria-hidden="true" />
        <span className="crt-flicker" aria-hidden="true" />
        <StatusBar />

        {/* Mobile nav */}
        <div id="mobile-nav">
          <div id="mobile-nav-sections-wrap">
            <div id="mobile-nav-sections">
              {(["home","blog","projects","cv","gallery","contact"] as SectionId[]).map((s) => (
                <button
                  key={s}
                  className={`nb${section === s ? " on" : ""}`}
                  onClick={() => goSection(s)}
                >
                  {t(s)}
                </button>
              ))}
            </div>
          </div>
          <div id="mobile-nav-lang">
            {(["en", "ru", "sk"] as Lang[]).map((l) => (
              <button key={l} className={`lb${lang === l ? " on" : ""}`} onClick={() => changeLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="main">
          <Sidebar
            section={section}
            lang={lang}
            onSection={goSection}
            onLang={changeLang}
            profile={data.profile}
          />
          <WindowFrame
            title={sectionTitle}
            onTweaks={() => setTweaksOpen((o) => !o)}
          >
            <div className="wincontent">
              {section === "home" && <HomeSection data={data} lang={lang} t={t} />}
              {section === "blog" && <BlogSection posts={data.posts} lang={lang} t={t} />}
              {section === "projects" && <ProjectsSection projects={data.projects} lang={lang} t={t} />}
              {section === "cv" && <CVSection data={data} lang={lang} t={t} />}
              {section === "gallery" && <GallerySection gallery={data.gallery} lang={lang} t={t} onOpen={setLightboxItem} />}
              {section === "contact" && <ContactSection profile={data.profile} lang={lang} t={t} />}
            </div>
          </WindowFrame>
        </div>
      </div>

      <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
      <TweaksPanel
        open={tweaksOpen}
        tweaks={tweaks}
        onChange={(next) => {
          setTweaks(next);
          try { localStorage.setItem("bul_tweaks", JSON.stringify(next)); } catch {}
        }}
      />
    </>
  );
}

// ── INLINE SECTION COMPONENTS ──────────────────────────────────────────────

import type { PostData, ProjectData, GalleryImageData, CVEntryData, ProfileData } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type T = (key: keyof (typeof translations)["en"]) => string;

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const pad = (x: number) => String(x).padStart(2, "0");

function fmtDate(s: string) {
  if (!s) return "";
  const d = new Date(s + "T12:00:00");
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function ageOf(b: string) {
  const d = new Date(b), n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
  return a;
}

function excerpt(s: string, n = 150) {
  const r = s.replace(/[#*`>\[\]!]/g, "").replace(/\n+/g, " ").trim();
  return r.length > n ? r.slice(0, n) + "..." : r;
}

function getLocalized(lang: Lang, en?: string|null, ru?: string|null, sk?: string|null, fb = "") {
  if (lang === "ru" && ru) return ru;
  if (lang === "sk" && sk) return sk;
  return en || fb;
}

function parseEmails(email?: string | null): string[] {
  if (!email) return [];
  return email.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
}

function contactDisplayText(type: string, raw: string): string {
  if (type === "telegram") {
    const username = raw.replace(/^https?:\/\/t\.me\//, "").replace(/^t\.me\//, "").replace(/^@/, "");
    return `@${username}`;
  }
  const url = raw.startsWith("http") ? raw
    : type === "github" ? `https://github.com/${raw}`
    : `https://linkedin.com/in/${raw}`;
  try {
    const u = new URL(url);
    return (u.hostname.replace(/^www\./, "") + u.pathname).replace(/\/$/, "");
  } catch {
    return raw;
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }).catch(() => {});
      }}
      style={{
        background: "none", border: "1px solid var(--g4)", color: copied ? "var(--g1)" : "var(--g3)",
        fontFamily: "var(--fw)", fontSize: 12, letterSpacing: 2, padding: "1px 7px",
        cursor: "pointer", transition: "all .1s", flexShrink: 0,
      }}
    >
      {copied ? "✓" : "COPY"}
    </button>
  );
}

// HOME
function HomeSection({ data, lang, t }: { data: SiteData; lang: Lang; t: T }) {
  const p = data.profile;
  const name = p.name || "Aleksandr Albekov";
  const title = getLocalized(lang, p.titleEn, p.titleRu, p.titleSk, "DevOps Engineer");
  const bio = getLocalized(lang, p.bioEn, p.bioRu, p.bioSk, "");

  const linkDefs: [keyof ProfileData, string, (v: string) => string][] = [
    ["github",   "GITHUB",   (v) => v.startsWith("http") ? v : `https://github.com/${v}`],
    ["telegram", "TELEGRAM", (v) => v.startsWith("http") ? v : `https://t.me/${v}`],
    ["linkedin", "LINKEDIN", (v) => v.startsWith("http") ? v : `https://linkedin.com/in/${v}`],
  ];
  const emails = parseEmails(p.email);

  return (
    <>
      <div className="hero">
        <div>
          <div className="hname">{name.toUpperCase()}</div>
          <div className="htitle">{title.toUpperCase()}</div>
          <div className="hbio">{bio}</div>
          <div className="hlinks">
            {linkDefs.filter(([k]) => p[k]).map(([k, label, href]) => (
              <a key={k} className="hlink" href={href(String(p[k]))} target="_blank" rel="noopener noreferrer">
                [{label}]
              </a>
            ))}
          </div>
          {emails.length > 0 && (
            <div className="hemails">
              {emails.map((em) => (
                <div key={em} className="hemail-row">
                  <a href={`mailto:${em}`} className="hemail-addr">{em}</a>
                  <CopyButton text={em} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="photo">
          {p.photo
            ? <img src={p.photo} alt="photo" />
            : <span style={{ fontSize: 10, padding: 8, textAlign: "center" }}>PHOTO</span>
          }
        </div>
      </div>

      <div className="sh">{t("skills")}</div>
      <div className="sg">
        {(p.skills || []).map((cat, i) => (
          <div className="card" key={i}>
            <div className="sc">{(cat.cat || "").toUpperCase()}</div>
            {(cat.items || []).map((item, j) => (
              <div className="si" key={j}>{item}</div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

function postTitle(p: PostData, lang: Lang): string {
  if (lang === "ru" && p.titleRu) return p.titleRu;
  if (lang === "sk" && p.titleSk) return p.titleSk;
  return p.title;
}

function postContent(p: PostData, lang: Lang): string {
  if (lang === "ru" && p.contentRu) return p.contentRu;
  if (lang === "sk" && p.contentSk) return p.contentSk;
  return p.content;
}

// BLOG
function BlogSection({ posts, lang, t }: { posts: PostData[]; lang: Lang; t: T }) {
  const [open, setOpen] = useState<PostData | null>(null);

  if (open) {
    const title   = postTitle(open, lang);
    const content = postContent(open, lang);
    return (
      <>
        <button className="backbtn" onClick={() => setOpen(null)}>◂ {t("back")}</button>
        <div className="pdate">{fmtDate(open.date)}</div>
        <div className="sh" style={{ marginTop: 8 }}>{title.toUpperCase()}</div>
        <div className="ptags">
          {(open.tags || []).map((tag) => <span key={tag} className="tag">{tag}</span>)}
        </div>
        <div className="md" style={{ marginTop: 20 }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="sh">{t("blog")}</div>
      {!posts.length
        ? <div className="empty">{t("noPosts")}</div>
        : posts.map((p) => {
          const title   = postTitle(p, lang);
          const content = postContent(p, lang);
          return (
            <div className="card" key={p.id} onClick={() => setOpen(p)} style={{ cursor: "pointer" }}>
              <div className="pdate">{fmtDate(p.date)}</div>
              <div className="ptitle">{(title || "UNTITLED").toUpperCase()}</div>
              <div className="pexc">{excerpt(content || "")}</div>
              {p.tags?.length ? (
                <div className="ptags">
                  {p.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
                </div>
              ) : null}
            </div>
          );
        })
      }
    </>
  );
}

// PROJECTS
function ProjectsSection({ projects, lang, t }: { projects: ProjectData[]; lang: Lang; t: T }) {
  return (
    <>
      <div className="sh">{t("projects")}</div>
      {!projects.length
        ? <div className="empty">{t("noProj")}</div>
        : (
          <div className="pg">
            {projects.map((p) => {
              const name = getLocalized(lang, p.name, p.nameRu, p.nameSk, "PROJECT");
              const desc = getLocalized(lang, p.desc, p.descRu, p.descSk, "");
              return (
                <div className="card" key={p.id}>
                  <div className="pjname">{name.toUpperCase()}</div>
                  {desc && <div className="pjdesc">{desc}</div>}
                  <div className="stk">
                    {(p.stack || []).map((s) => <span key={s} className="stag">{s}</span>)}
                  </div>
                  {(p.github || p.url) && (
                    <div className="pjlinks">
                      {p.github && <a className="pjlink" href={p.github} target="_blank" rel="noopener noreferrer">[GITHUB]</a>}
                      {p.url && <a className="pjlink" href={p.url} target="_blank" rel="noopener noreferrer">[LIVE]</a>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      }
    </>
  );
}

// CV
function CVSection({ data, lang, t }: { data: SiteData; lang: Lang; t: T }) {
  const p = data.profile;
  const name = p.name || "Aleksandr Albekov";
  const title = getLocalized(lang, p.titleEn, p.titleRu, p.titleSk, "DevOps Engineer");
  const experience = data.cvEntries.filter((e) => e.type === "experience");
  const education = data.cvEntries.filter((e) => e.type === "education");
  const certifications = data.cvEntries.filter((e) => e.type === "certification");

  return (
    <>
      <div className="cvs">
        <div style={{ fontFamily: "var(--fw)", fontSize: 28, color: "var(--g1)", letterSpacing: 3, textShadow: "var(--gw)" }}>
          {name}
        </div>
        <div style={{ color: "var(--g3)", fontSize: 13, marginTop: 5, letterSpacing: 1 }}>
          {title}
          {p.location ? ` · ${p.location}` : ""}
          {p.birthday ? ` · ${ageOf(p.birthday)} y.o.` : ""}
        </div>
      </div>

      <div className="cvs">
        <div className="cvt">{t("exp")}</div>
        {!experience.length
          ? <div className="empty">{t("noExp")}</div>
          : experience.map((e) => (
            <div className="cvi" key={e.id}>
              <div className="cvih">
                <span className="cvr">{e.role} @ {e.company}</span>
                <span className="cvd">{e.start || ""} — {e.end || t("present")}</span>
              </div>
              {e.desc && <div className="cvsub">{e.desc}</div>}
            </div>
          ))
        }
      </div>

      <div className="cvs">
        <div className="cvt">{t("edu")}</div>
        {!education.length
          ? <div className="empty">{t("noEdu")}</div>
          : education.map((e) => (
            <div className="cvi" key={e.id}>
              <div className="cvih">
                <span className="cvr">{e.degree} — {e.institution}</span>
                <span className="cvd">{e.start || ""} — {e.end || t("present")}</span>
              </div>
            </div>
          ))
        }
      </div>

      <div className="cvs">
        <div className="cvt">{t("skills")}</div>
        {(p.skills || []).map((cat, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div className="sc">{(cat.cat || "").toUpperCase()}</div>
            {(cat.items || []).map((item, j) => <div className="si" key={j}>{item}</div>)}
          </div>
        ))}
      </div>

      {certifications.length > 0 && (
        <div className="cvs">
          <div className="cvt">{t("cert")}</div>
          {certifications.map((c) => (
            <div className="cvi" key={c.id}>
              <div className="cvih">
                <span className="cvr">{c.name}</span>
                <span className="cvd">{c.date || ""}</span>
              </div>
              {c.issuer && <div className="cvsub">{c.issuer}</div>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// GALLERY
function GallerySection({
  gallery, lang, t, onOpen,
}: {
  gallery: GalleryImageData[];
  lang: Lang;
  t: T;
  onOpen: (item: LightboxItem) => void;
}) {
  return (
    <>
      <div className="sh">{t("gallery")}</div>
      {!gallery.length
        ? <div className="empty" style={{ textAlign: "center", padding: 40 }}>{t("noGal")}</div>
        : (
          <div className="gg">
            {gallery.map((img) => (
              <div className="gi" key={img.id} onClick={() => onOpen({ src: img.src, caption: img.caption })}>
                <img src={img.src} alt={img.caption || ""} />
                {img.caption && <div className="gi-caption">{img.caption}</div>}
              </div>
            ))}
          </div>
        )
      }
    </>
  );
}

// CONTACT
function ContactSection({ profile, lang, t }: { profile: ProfileData; lang: Lang; t: T }) {
  type LinkDef = { key: keyof ProfileData; label: string; href: (v: string) => string };
  const linkDefs: LinkDef[] = [
    { key: "github",   label: "GITHUB",   href: (v) => v.startsWith("http") ? v : `https://github.com/${v}` },
    { key: "telegram", label: "TELEGRAM", href: (v) => v.startsWith("http") ? v : `https://t.me/${v}` },
    { key: "linkedin", label: "LINKEDIN", href: (v) => v.startsWith("http") ? v : `https://linkedin.com/in/${v}` },
  ];
  const emails = parseEmails(profile.email);
  const hasAny = emails.length > 0 || linkDefs.some(({ key }) => profile[key]);

  return (
    <>
      <div className="sh">{t("contact")}</div>
      {!hasAny
        ? <div className="empty">{t("noCtct")}</div>
        : (
          <div className="ctl">
            {emails.map((em) => (
              <div className="cti" key={em}>
                <span className="ctlbl">EMAIL</span>
                <span className="ctval" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <a href={`mailto:${em}`}>{em}</a>
                  <CopyButton text={em} />
                </span>
              </div>
            ))}
            {linkDefs.filter(({ key }) => profile[key]).map(({ key, label, href }) => {
              const raw = String(profile[key]);
              return (
                <div className="cti" key={key}>
                  <span className="ctlbl">{label}</span>
                  <span className="ctval">
                    <a href={href(raw)} target="_blank" rel="noopener noreferrer">
                      {contactDisplayText(key, raw)}
                    </a>
                  </span>
                </div>
              );
            })}
          </div>
        )
      }
    </>
  );
}
