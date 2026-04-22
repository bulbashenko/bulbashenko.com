"use client";

import type { Lang, ProfileData } from "@/types";
import type { SectionId } from "./PublicSite";
import { translations } from "@/lib/i18n";
import Link from "next/link";

const SECTIONS: SectionId[] = ["home", "blog", "projects", "cv", "gallery", "contact"];
const LANGS: Lang[] = ["en", "ru", "sk"];

interface Props {
  section: SectionId;
  lang: Lang;
  onSection: (s: SectionId) => void;
  onLang: (l: Lang) => void;
  profile: ProfileData;
}

export function Sidebar({ section, lang, onSection, onLang, profile }: Props) {
  const t = (key: keyof (typeof translations)["en"]) =>
    translations[lang]?.[key] ?? translations.en[key];

  const lastName = (profile.name || "Albekov").split(" ").slice(-1)[0].toUpperCase();
  const title =
    (lang === "ru" ? profile.titleRu : lang === "sk" ? profile.titleSk : profile.titleEn) ||
    "DevOps Engineer";

  return (
    <div className="sidebar">
      <div className="sb-brand">
        <div className="sb-name">{lastName}</div>
        <div className="sb-sub">{title}</div>
      </div>

      <nav className="sb-nav">
        {SECTIONS.map((s) => (
          <button
            key={s}
            className={`nb${section === s ? " on" : ""}`}
            onClick={() => onSection(s)}
          >
            {t(s)}
          </button>
        ))}
      </nav>

      <div className="sb-bottom">
        <div className="lbwrap">
          {LANGS.map((l) => (
            <button key={l} className={`lb${lang === l ? " on" : ""}`} onClick={() => onLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <Link href="/admin" className="sb-link">[ ADMIN ]</Link>
      </div>
    </div>
  );
}
